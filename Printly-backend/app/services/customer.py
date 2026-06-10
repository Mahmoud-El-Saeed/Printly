from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from decimal import Decimal
import secrets
import string

from app.models import WalkInCustomers
from app.enums import LinkStatus, UserRole
from app.core.security import hash_password

from app.db import (
    WalkInCustomerCRUD,
    TenantCRUD,
    TenantMemberCRUD,
    CustomerTenantLinkCRUD,
    UserCRUD,
    OrderCRUD,
)

from app.schemas import (
    WalkInCustomerCreate,
    WalkInCustomerResponse,
    WalkInCustomerUpdate,
    WalkInCustomerListResponse,
    WalkInCustomerListRequest,
    CustomerMemberCreate,
    CustomerMemberResponse,
    CustomerMemberUpdate,
    CustomerLinkResponse,
    CustomerLinkListRequest,
    CustomerLinkListResponse,
    CustomerLinkRequest,
    CustomerMemberListRequest,
    CustomerMemberListResponse,
    CustomerLinkApprovalRequest,
)


async def create_walk_in_customer(
    db: AsyncSession,
    tenant_id: UUID,
    data: WalkInCustomerCreate,
) -> WalkInCustomerResponse:
    """Create a new walk-in customer for the tenant"""

    try:
        walk_in_customer: WalkInCustomers = await WalkInCustomerCRUD.create(
            db=db, tenant_id=tenant_id, **data.model_dump()
        )
        await db.commit()
        return WalkInCustomerResponse.model_validate(walk_in_customer)

    except Exception as e:
        await db.rollback()
        raise e


async def list_walk_in_customers(
    db: AsyncSession,
    tenant_id: UUID,
    data: WalkInCustomerListRequest,
) -> WalkInCustomerListResponse:
    """List walk-in customers for the tenant with pagination"""

    walk_in_customers, total = await WalkInCustomerCRUD.get_list(
        db=db,
        filters={"tenant_id": tenant_id},
        offset=data.offset,
        limit=data.limit,
        order_by=data.order_by,
        order_dir=data.order_dir,
    )
    return WalkInCustomerListResponse(
        customers=[WalkInCustomerResponse.model_validate(c) for c in walk_in_customers],
        total=total,
    )


async def update_walk_in_customer(
    db: AsyncSession,
    tenant_id: UUID,
    customer_id: UUID,
    data: WalkInCustomerUpdate,
) -> WalkInCustomerResponse:
    """Update a walk-in customer's details"""

    walk_in_customer: WalkInCustomers = await WalkInCustomerCRUD.get_by_id(
        db=db, id=customer_id
    )
    if not walk_in_customer or walk_in_customer.tenant_id != tenant_id:
        raise ValueError("Walk-in customer not found")
    data_dict = data.model_dump(exclude_unset=True, exclude_none=True)
    try:
        updated_customer = await WalkInCustomerCRUD.update(
            db=db, db_obj=walk_in_customer, **data_dict
        )
        await db.commit()
        await db.refresh(updated_customer)
        return WalkInCustomerResponse.model_validate(updated_customer)

    except Exception as e:
        await db.rollback()
        raise e


async def _get_walk_in_customer_or_raise(
    db: AsyncSession,
    tenant_id: UUID,
    customer_id: UUID,
) -> WalkInCustomers:
    """Helper function to get walk-in customer and validate ownership"""

    walk_in_customer: WalkInCustomers = await WalkInCustomerCRUD.get_by_id(
        db=db, id=customer_id
    )

    if not walk_in_customer or walk_in_customer.tenant_id != tenant_id:
        raise ValueError("Walk-in customer not found")
    return walk_in_customer


async def delete_walk_in_customer(
    db: AsyncSession,
    tenant_id: UUID,
    customer_id: UUID,
) -> None:
    """Delete a walk-in customer"""

    _: WalkInCustomers = await _get_walk_in_customer_or_raise(
        db=db,
        tenant_id=tenant_id,
        customer_id=customer_id,
    )

    try:
        await WalkInCustomerCRUD.delete(db=db, id=customer_id)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise e


async def get_walk_in_customer_by_id(
    db: AsyncSession,
    tenant_id: UUID,
    customer_id: UUID,
) -> WalkInCustomerResponse:
    """Get a walk-in customer's details by ID"""

    walk_in_customer: WalkInCustomers = await _get_walk_in_customer_or_raise(
        db=db,
        tenant_id=tenant_id,
        customer_id=customer_id,
    )

    return WalkInCustomerResponse.model_validate(walk_in_customer)


def _generate_random_password(length: int = 10) -> str:
    """Generate a random password of specified length"""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


async def create_customer_member(
    db: AsyncSession,
    tenant_id: UUID,
    data: CustomerMemberCreate,
) -> CustomerMemberResponse:
    """Create a new customer member for the tenant"""

    tenant_member = await TenantMemberCRUD.get_tenant_member_by_phone(
        db=db,
        tenant_id=tenant_id,
        phone=data.phone.strip(),
    )
    if tenant_member:
        raise ValueError(
            "A customer member with this phone number already exists in the tenant"
        )
    try:
        email = (
            data.email
            or f"{secrets.token_urlsafe(8).replace('-', '_')}_{data.phone.strip()}@printly.com"
        )

        existing_user = (
            await UserCRUD.get_by_email(db=db, email=email) if email else None
        )

        if existing_user:
            existing_member = await TenantMemberCRUD.get_tenant_member(
                db=db,
                tenant_id=tenant_id,
                customer_user_id=existing_user.id,
            )
            if existing_member:
                raise ValueError("Already a member")
            customer_user = existing_user
        else:
            password = _generate_random_password()
            customer_user = await UserCRUD.create(
                db=db,
                email=email,
                full_name=data.name,
                phone=data.phone.strip(),
                password_hash=hash_password(password),
                role=UserRole.CUSTOMER,
            )
            # Optionally, send the generated password to the customer's email here

        tenant_member = await TenantMemberCRUD.create(
            db=db,
            tenant_id=tenant_id,
            customer_user_id=customer_user.id,
            display_name=data.name,
            balance=data.balance,
            is_approved=True,  # Automatically approve members created by tenant admins
        )
        await db.commit()
        return CustomerMemberResponse(
            id=tenant_member.id,
            name=tenant_member.display_name,
            email=customer_user.email,
            phone=customer_user.phone,
            tenant_id=tenant_id,
            is_approved=tenant_member.is_approved,
            balance=tenant_member.balance,
            created_at=customer_user.created_at,
        )
    except Exception as e:
        await db.rollback()
        raise e


async def list_customer_members(
    db: AsyncSession,
    tenant_id: UUID,
    data: CustomerMemberListRequest,
) -> CustomerMemberListResponse:
    """List customer members for the tenant with pagination"""
    members, total = await TenantMemberCRUD.search_members(
        db=db,
        tenant_id=tenant_id,
        **data.model_dump(exclude_unset=True, exclude_none=True),
    )
    return CustomerMemberListResponse(
        members=[
            CustomerMemberResponse(
                id=m.id,
                name=m.display_name,
                email=m.customer_user.email,
                phone=m.customer_user.phone,
                tenant_id=tenant_id,
                is_approved=m.is_approved,
                balance=m.balance,
                created_at=m.linked_at,
            )
            for m in members
        ],
        total=total,
    )


async def get_customer_member_by_id(
    db: AsyncSession,
    tenant_id: UUID,
    member_id: UUID,
) -> CustomerMemberResponse:
    """Get a customer member's details by ID"""
    tenant_member = await TenantMemberCRUD.get_by_id(
        db=db,
        id=member_id,
    )
    if not tenant_member or tenant_member.tenant_id != tenant_id:
        raise ValueError("Customer member not found")
    return CustomerMemberResponse(
        id=tenant_member.id,
        name=tenant_member.display_name,
        email=tenant_member.customer_user.email,
        phone=tenant_member.customer_user.phone,
        tenant_id=tenant_id,
        is_approved=tenant_member.is_approved,
        balance=tenant_member.balance,
        created_at=tenant_member.linked_at,
    )


async def update_customer_member(
    db: AsyncSession,
    tenant_id: UUID,
    member_id: UUID,
    data: CustomerMemberUpdate,
) -> CustomerMemberResponse:
    """Update a customer member's details"""
    tenant_member = await TenantMemberCRUD.get_by_id(
        db=db,
        id=member_id,
    )
    if not tenant_member or tenant_member.tenant_id != tenant_id:
        raise ValueError("Customer member not found")
    try:
        if data.name is not None:
            tenant_member.display_name = data.name
        if data.email is not None:
            tenant_member.customer_user.email = data.email
        if data.phone is not None:
            tenant_member.customer_user.phone = data.phone.strip()

        await db.commit()
        return CustomerMemberResponse(
            id=tenant_member.id,
            name=tenant_member.display_name,
            email=tenant_member.customer_user.email,
            phone=tenant_member.customer_user.phone,
            tenant_id=tenant_id,
            is_approved=tenant_member.is_approved,
            balance=tenant_member.balance,
            created_at=tenant_member.linked_at,
        )

    except Exception as e:
        await db.rollback()
        raise e


async def delete_customer_member(
    db: AsyncSession,
    tenant_id: UUID,
    member_id: UUID,
) -> None:
    """Delete a customer member"""
    tenant_member = await TenantMemberCRUD.get_by_id(
        db=db,
        id=member_id,
    )
    if not tenant_member or tenant_member.tenant_id != tenant_id:
        raise ValueError("Customer member not found")
    if tenant_member.balance > 0:
        raise ValueError("Cannot delete member with outstanding balance")
    orders = await OrderCRUD.get_unpaid_orders(
        db=db,
        tenant_id=tenant_id,
        customer_id=tenant_member.customer_user_id,
    )
    if orders:
        raise ValueError("Cannot delete member with unpaid orders")

    try:
        await TenantMemberCRUD.delete(db=db, id=member_id)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise e


async def request_customer_link(
    db: AsyncSession,
    customer_user_id: UUID,
    data: CustomerLinkRequest,
) -> CustomerLinkResponse:
    """Request a link between a customer user and a tenant"""
    tenant = await TenantCRUD.get_by_slug(db=db, slug=data.slug)
    if not tenant:
        raise ValueError("Tenant not found")
    existing_link = await CustomerTenantLinkCRUD.get_by_customer_and_tenant(
        db=db,
        customer_user_id=customer_user_id,
        tenant_id=tenant.id,
    )
    try:
        if existing_link:
            if existing_link.status == LinkStatus.PENDING:
                raise ValueError("Link request already pending")
            elif existing_link.status == LinkStatus.APPROVED:
                raise ValueError("Already linked to this tenant")
            else:
                # If previously rejected, allow creating a new request
                existing_link.status = LinkStatus.PENDING
                existing_link.requested_at = func.now()
                existing_link.approved_at = None
                await db.commit()
                await db.refresh(existing_link, ["customer_user"])
                return CustomerLinkResponse(
                    id=existing_link.id,
                    tenant_id=tenant.id,
                    customer_user_id=customer_user_id,
                    customer_name=existing_link.customer_user.full_name,
                    customer_email=existing_link.customer_user.email,
                    status=existing_link.status,
                    requested_at=existing_link.requested_at,
                    approved_at=existing_link.approved_at,
                )
        link = await CustomerTenantLinkCRUD.create(
            db=db,
            tenant_id=tenant.id,
            customer_user_id=customer_user_id,
            status=LinkStatus.PENDING,
        )
        await db.commit()
        await db.refresh(link, ["customer_user"])
        return CustomerLinkResponse(
            id=link.id,
            tenant_id=tenant.id,
            customer_user_id=customer_user_id,
            customer_name=link.customer_user.full_name,
            customer_email=link.customer_user.email,
            status=link.status,
            requested_at=link.requested_at,
            approved_at=link.approved_at,
        )
    except Exception as e:
        await db.rollback()
        raise e


async def get_pending_link_requests(
    db: AsyncSession,
    tenant_id: UUID,
    request: CustomerLinkListRequest,
) -> CustomerLinkListResponse:
    """Get pending link requests for a customer user"""

    links, total = await CustomerTenantLinkCRUD.get_pending_by_tenant(
        db=db, tenant_id=tenant_id, **request.model_dump()
    )
    return CustomerLinkListResponse(
        links=[
            CustomerLinkResponse(
                id=link.id,
                tenant_id=link.tenant_id,
                customer_user_id=link.customer_user_id,
                customer_name=link.customer_user.full_name,
                customer_email=link.customer_user.email,
                status=link.status,
                requested_at=link.requested_at,
                approved_at=link.approved_at,
            )
            for link in links
        ],
        total=total,
    )


async def get_customer_link_requests(
    db: AsyncSession,
    customer_user_id: UUID,
    data: CustomerLinkListRequest,
) -> CustomerLinkListResponse:
    """Get all link requests for a customer user across all tenants"""
    links, total = await CustomerTenantLinkCRUD.get_list(
        db=db,
        filters={"customer_user_id": customer_user_id},
        offset=data.offset,
        limit=data.limit,
        order_by=data.order_by,
        order_dir=data.order_dir,
    )
    return CustomerLinkListResponse(
        links=[
            CustomerLinkResponse(
                id=link.id,
                tenant_id=link.tenant_id,
                customer_user_id=link.customer_user_id,
                customer_name=link.customer_user.full_name,
                customer_email=link.customer_user.email,
                status=link.status,
                requested_at=link.requested_at,
                approved_at=link.approved_at,
            )
            for link in links
        ],
        total=total,
    )


async def approve_or_reject_link_request(
    db: AsyncSession,
    tenant_id: UUID,
    link_id: UUID,
    request: CustomerLinkApprovalRequest,
) -> CustomerLinkResponse:
    """Approve or reject a pending link request"""
    link = await CustomerTenantLinkCRUD.get_by_id(db=db, id=link_id)
    if (
        not link
        or link.tenant_id != tenant_id
        or link.customer_user_id != request.customer_user_id
    ):
        raise ValueError("Link request not found")
    if link.status != LinkStatus.PENDING:
        raise ValueError("Link request is not pending")
    
    user = await UserCRUD.get_by_id(db=db, id=request.customer_user_id)

    try:
        link.status = LinkStatus.APPROVED if request.approve else LinkStatus.REJECTED
        link.approved_at = func.now() if request.approve else None

        if request.approve:
            # Create tenant member if approved
            _ = await TenantMemberCRUD.create(
                db=db,
                tenant_id=tenant_id,
                customer_user_id=request.customer_user_id,
                display_name=user.full_name,
                balance=Decimal("0"),
                is_approved=True,
            )
        await db.commit()
        await db.refresh(link)
        await db.refresh(user)
        
        return CustomerLinkResponse(
            id=link.id,
            tenant_id=link.tenant_id,
            customer_user_id=link.customer_user_id,
            customer_name=user.full_name,
            customer_email=user.email,
            status=link.status,
            requested_at=link.requested_at,
            approved_at=link.approved_at,
        )
    except Exception as e:
        await db.rollback()
        raise e
