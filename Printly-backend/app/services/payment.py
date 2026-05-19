from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from decimal import Decimal
from app.enums import PaymentMethod, OrderStatus

from app.db import PaymentCRUD, OrderCRUD, TenantMemberCRUD
from app.models import Payments

from app.schemas import (
    PaymentCreate,
    PaymentUpdate,
    PaymentResponse,
    PaymentListResponse,
    PaymentRequest,
    SettlePaymentCreate,
    SettlePaymentResponse,
    CustomerBalanceResponse,
)


async def create_payment(
    db: AsyncSession,
    tenant_id: UUID,
    received_by: UUID,
    payment_create: PaymentCreate,
) -> PaymentResponse:
    payment_crud = PaymentCRUD()
    order_crud = OrderCRUD()
    tenant_member_crud = TenantMemberCRUD()

    order = await order_crud.get_by_id(db, payment_create.order_id)
    if not order or order.tenant_id != tenant_id:
        raise ValueError("Order not found or does not belong to the tenant.")
    if order.status == OrderStatus.CANCELLED:
        raise ValueError("Cannot add payment to a cancelled order.")

    remaining_amount = order.total_amount - order.paid_amount
    if remaining_amount <= 0:
        raise ValueError("This order is already fully paid.")

    excess_amount = Decimal("0")
    split_cash_to_store = None

    if payment_create.payment_method == PaymentMethod.BALANCE:
        if order.walk_in_customer_id:
            raise ValueError("Cannot use balance payment method for walk-in customers.")
        customer = await tenant_member_crud.get_tenant_member(
            db, tenant_id, order.customer_id
        )
        if not customer:
            raise ValueError("Customer not found or does not belong to the tenant.")

        if payment_create.amount > remaining_amount:
            raise ValueError("Payment amount exceeds the remaining order amount.")

        if customer.balance >= payment_create.amount:
            customer.balance -= payment_create.amount
        else:
            shortfall = payment_create.amount - customer.balance
            if (
                payment_create.split_cash_amount is None
                or payment_create.split_cash_amount != shortfall
            ):
                raise ValueError(
                    f"Insufficient balance ({customer.balance}). "
                    f"Provide split_cash_amount={shortfall}."
                )
            split_cash_to_store = shortfall
            customer.balance = 0

        new_paid = order.paid_amount + payment_create.amount

    else:
        if order.walk_in_customer_id and payment_create.amount != remaining_amount:
            raise ValueError(
                "For walk-in customers, payment amount must equal the remaining order amount."
            )

        if payment_create.amount > remaining_amount:
            excess_amount = payment_create.amount - remaining_amount
            if order.customer_id and payment_create.add_to_balance:
                customer = await tenant_member_crud.get_tenant_member(
                    db, tenant_id, order.customer_id
                )
                if not customer:
                    raise ValueError(
                        "Customer not found or does not belong to the tenant."
                    )
                customer.balance += excess_amount
            new_paid = order.total_amount
        else:
            new_paid = order.paid_amount + payment_create.amount

    try:
        payment_data = payment_create.model_dump()
        payment_data["excess_amount"] = excess_amount
        payment_data["split_cash_amount"] = split_cash_to_store
        payment = await payment_crud.create(
            db, tenant_id=tenant_id, **payment_data, received_by=received_by
        )
        await order_crud.update(db=db, db_obj=order, paid_amount=new_paid)
        await db.commit()
        return PaymentResponse.model_validate(payment)
    except Exception as e:
        await db.rollback()
        raise e


async def get_payment(
    db: AsyncSession, tenant_id: UUID, payment_id: UUID
) -> PaymentResponse:
    """Get a specific payment."""
    payment_crud = PaymentCRUD()
    payment = await payment_crud.get_by_id(db, payment_id)
    if not payment or payment.tenant_id != tenant_id:
        raise ValueError("Payment not found or does not belong to the tenant.")
    return PaymentResponse.model_validate(payment)


async def list_payments(
    db: AsyncSession,
    tenant_id: UUID,
    payment_request: PaymentRequest,
) -> PaymentListResponse:
    """List all payments for a tenant, optionally filtered by order."""
    payment_crud = PaymentCRUD()

    filters = {"tenant_id": tenant_id}
    if payment_request.order_id:
        filters["order_id"] = payment_request.order_id
    if payment_request.payment_method:
        filters["payment_method"] = payment_request.payment_method

    payments, total = await payment_crud.get_list(
        db=db,
        filters=filters,
        offset=payment_request.offset,
        limit=payment_request.limit,
        order_by=payment_request.order_by,
        order_dir=payment_request.order_dir,
    )
    return PaymentListResponse(
        payments=[PaymentResponse.model_validate(p) for p in payments], total=total
    )


async def update_payment(
    db: AsyncSession,
    tenant_id: UUID,
    payment_id: UUID,
    payment_update: PaymentUpdate,
) -> PaymentResponse:
    payment_crud = PaymentCRUD()
    order_crud = OrderCRUD()
    tenant_member_crud = TenantMemberCRUD()

    payment_update_data = payment_update.model_dump(
        exclude_unset=True, exclude_none=True
    )
    if not payment_update_data:
        raise ValueError("No valid fields provided for update.")

    payment = await payment_crud.get_by_id(db, payment_id)
    if not payment or payment.tenant_id != tenant_id:
        raise ValueError("Payment not found or does not belong to the tenant.")

    order = await order_crud.get_by_id(db, payment.order_id)
    if not order:
        raise ValueError("Associated order not found.")
    if order.status == OrderStatus.CANCELLED:
        raise ValueError("Cannot update payment for a cancelled order.")
    try:
        amount_changed = (
            "amount" in payment_update_data
            and payment.amount != payment_update_data["amount"]
        )
        method_changed = "payment_method" in payment_update_data
        balance_flag_changed = (
            "add_to_balance" in payment_update_data
            and payment.add_to_balance != payment_update_data["add_to_balance"]
        )
    
        if not amount_changed and not method_changed and not balance_flag_changed:
            updated_payment = await payment_crud.update(
                db=db, db_obj=payment, **payment_update_data
            )
            await db.commit()
            return PaymentResponse.model_validate(updated_payment)
    except Exception as e:
        await db.rollback()
        raise e

    try:
        contribution = payment.amount - payment.excess_amount
        order.paid_amount -= contribution
        if order.paid_amount < 0:
            raise ValueError(
                "Cannot update: reversing payment would make paid_amount negative."
            )

        if payment.payment_method == PaymentMethod.BALANCE and order.customer_id:
            customer = await tenant_member_crud.get_tenant_member(
                db, tenant_id, order.customer_id
            )
            if customer:
                if payment.split_cash_amount:
                    customer.balance += payment.amount - payment.split_cash_amount
                else:
                    customer.balance += payment.amount
        elif payment.excess_amount > 0 and payment.add_to_balance and order.customer_id:
            customer = await tenant_member_crud.get_tenant_member(
                db, tenant_id, order.customer_id
            )
            if customer:
                customer.balance -= payment.excess_amount

        new_amount = payment_update_data.get("amount", payment.amount)
        new_method = payment_update_data.get("payment_method", payment.payment_method)
        new_add_to_balance = payment_update_data.get(
            "add_to_balance", payment.add_to_balance
        )
        new_split_cash = payment_update_data.get("split_cash_amount")

        remaining = order.total_amount - order.paid_amount
        new_excess = Decimal("0")
        new_split_cash_to_store = None

        if new_method == PaymentMethod.BALANCE:
            if order.walk_in_customer_id:
                raise ValueError("Cannot use balance for walk-in customers.")
            customer = await tenant_member_crud.get_tenant_member(
                db, tenant_id, order.customer_id
            )
            if not customer:
                raise ValueError("Customer not found.")
            if new_amount > remaining:
                raise ValueError("Payment amount exceeds the remaining order amount.")
            if customer.balance >= new_amount:
                customer.balance -= new_amount
            else:
                shortfall = new_amount - customer.balance
                if new_split_cash is None or new_split_cash != shortfall:
                    raise ValueError(
                        f"Insufficient balance ({customer.balance}). "
                        f"Provide split_cash_amount={shortfall}."
                    )
                new_split_cash_to_store = shortfall
                customer.balance = 0
            new_paid = order.paid_amount + new_amount
        else:
            if order.walk_in_customer_id and new_amount != remaining:
                raise ValueError("Walk-in customers must pay exact remaining amount.")
            if new_amount > remaining:
                new_excess = new_amount - remaining
                if order.customer_id and new_add_to_balance:
                    customer = await tenant_member_crud.get_tenant_member(
                        db, tenant_id, order.customer_id
                    )
                    if customer:
                        customer.balance += new_excess
                new_paid = order.total_amount
            else:
                new_paid = order.paid_amount + new_amount
        
        order.paid_amount = new_paid

        payment_update_data["excess_amount"] = new_excess
        payment_update_data["split_cash_amount"] = new_split_cash_to_store

        updated_payment = await payment_crud.update(
            db=db, db_obj=payment, **payment_update_data
        )
        await db.commit()
        return PaymentResponse.model_validate(updated_payment)

    except Exception as e:
        await db.rollback()
        raise e


async def delete_payment(
    db: AsyncSession,
    tenant_id: UUID,
    payment_id: UUID,
) -> None:
    payment_crud = PaymentCRUD()
    order_crud = OrderCRUD()
    tenant_member_crud = TenantMemberCRUD()

    payment = await payment_crud.get_by_id(db, payment_id)
    if not payment or payment.tenant_id != tenant_id:
        raise ValueError("Payment not found or does not belong to the tenant.")

    order = await order_crud.get_by_id(db, payment.order_id)
    if not order:
        raise ValueError("Associated order not found.")
    if order.status == OrderStatus.CANCELLED:
        raise ValueError("Cannot delete payment for a cancelled order.")

    try:
        contribution = payment.amount - payment.excess_amount
        if order.paid_amount < contribution:
            raise ValueError(
                "Cannot delete payment: order paid_amount would become negative."
            )

        order.paid_amount -= contribution

        if payment.payment_method == PaymentMethod.BALANCE and order.customer_id:
            customer = await tenant_member_crud.get_tenant_member(
                db, tenant_id, order.customer_id
            )
            if customer:
                if payment.split_cash_amount:
                    customer.balance += payment.amount - payment.split_cash_amount
                else:
                    customer.balance += payment.amount
        elif payment.excess_amount > 0 and payment.add_to_balance and order.customer_id:
            customer = await tenant_member_crud.get_tenant_member(
                db, tenant_id, order.customer_id
            )
            if customer:
                customer.balance -= payment.excess_amount

        await payment_crud.delete(db, id=payment_id)
        await db.commit()

    except Exception as e:
        await db.rollback()
        raise e


async def settle_payments_for_customer(
    db: AsyncSession,
    tenant_id: UUID,
    received_by: UUID,
    settle_payment_create: SettlePaymentCreate,
) -> SettlePaymentResponse:
    """Settle all unpaid orders for a customer with a single payment."""
    order_crud = OrderCRUD()
    payment_crud = PaymentCRUD()
    tenant_member_crud = TenantMemberCRUD()

    customer = await tenant_member_crud.get_tenant_member(
        db, tenant_id, settle_payment_create.customer_id
    )
    if not customer:
        raise ValueError("Customer not found or does not belong to the tenant.")

    unpaid_orders = await order_crud.get_unpaid_orders(
        db, tenant_id, settle_payment_create.customer_id
    )
    if not unpaid_orders:
        raise ValueError("No unpaid orders found for the customer.")

    remaining = settle_payment_create.amount

    payments = []
    try:
        for order in unpaid_orders:
            if remaining <= 0:
                break

            order_remaining = order.total_amount - order.paid_amount
            payment_amount = min(remaining, order_remaining)

            payment = Payments(
                tenant_id=tenant_id,
                order_id=order.id,
                amount=payment_amount,
                payment_method=settle_payment_create.payment_method,
                reference=settle_payment_create.reference,
                notes=settle_payment_create.notes,
                received_by=received_by,
            )

            new_paid = order.paid_amount + payment_amount

            await order_crud.update(db=db, db_obj=order, paid_amount=new_paid)
            remaining -= payment_amount

            payments.append(payment)

        payments_items = await payment_crud.batch_create(db=db, items_data=payments)
        added_to_balance = Decimal("0")
        if remaining > 0:
            customer.balance += remaining
            added_to_balance = remaining

        total_settled = settle_payment_create.amount - remaining

        await db.commit()
        return SettlePaymentResponse(
            payments=[PaymentResponse.model_validate(p) for p in payments_items],
            total_settled=total_settled,
            added_to_balance=added_to_balance,
            new_balance=customer.balance,
        )
    except Exception as e:
        await db.rollback()
        raise e


async def get_customer_balance(
    db: AsyncSession, tenant_id: UUID, customer_id: UUID
) -> CustomerBalanceResponse:
    """Get the current balance for a customer."""
    tenant_member_crud = TenantMemberCRUD()
    order_crud = OrderCRUD()

    customer = await tenant_member_crud.get_tenant_member(db, tenant_id, customer_id)
    if not customer:
        raise ValueError("Customer not found or does not belong to the tenant.")

    unpaid_orders = await order_crud.get_unpaid_orders(db, tenant_id, customer_id)
    unpaid_total = sum(
        order.total_amount - order.paid_amount for order in unpaid_orders
    )

    net_balance = customer.balance - unpaid_total

    return CustomerBalanceResponse(
        customer_id=customer_id,
        balance=customer.balance,
        unpaid_total=unpaid_total,
        net_balance=net_balance,
    )
