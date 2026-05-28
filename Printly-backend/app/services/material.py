from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession


from app.schemas import (
    MaterialCreate,
    MaterialUpdate,
    MaterialResponse,
    MaterialsRequest,
    MaterialListResponse,
    TransactionCreate,
    TransactionResponse,
    TransactionsRequest,
    TransactionListResponse,
)
from app.db import MaterialCRUD, MaterialTransactionCRUD
from app.enums import MaterialTransactionType


async def create_material(
    db: AsyncSession,
    tenant_id: UUID,
    material: MaterialCreate,
) -> MaterialResponse:
    """Create a new material for the tenant."""
    material_model = material.model_dump()

    try:
        new_material = await MaterialCRUD.create(
            db, tenant_id=tenant_id, **material_model
        )
        await db.commit()
        return MaterialResponse.model_validate(new_material)

    except Exception as e:
        await db.rollback()
        raise Exception(f"Error creating material: {str(e)}")


async def get_material(
    db: AsyncSession,
    tenant_id: UUID,
    material_id: UUID,
) -> MaterialResponse:
    """Get details of a specific material."""
    material = await MaterialCRUD.get_by_id(db, material_id)
    if not material or material.tenant_id != tenant_id or not material.is_active:
        raise ValueError("Material not found")
    return MaterialResponse.model_validate(material)


async def list_materials(
    db: AsyncSession,
    tenant_id: UUID,
    request: MaterialsRequest,
) -> MaterialListResponse:
    """Get a paginated list of materials with optional filters."""
    filters = {"tenant_id": tenant_id}
    if request.name is not None:
        filters["name"] = request.name
    if request.unit is not None:
        filters["unit"] = request.unit
    filters["is_active"] = request.is_active

    materials, total = await MaterialCRUD.get_list(
        db,
        filters=filters,
        offset=request.offset,
        limit=request.limit,
        order_by=request.order_by,
        order_dir=request.order_dir,
    )
    return MaterialListResponse(
        total=total,
        items=[MaterialResponse.model_validate(m) for m in materials],
    )


async def update_material(
    db: AsyncSession,
    tenant_id: UUID,
    material_id: UUID,
    material_data: MaterialUpdate,
) -> MaterialResponse:
    """Update details of a specific material."""
    material = await MaterialCRUD.get_by_id(db, material_id)
    if not material or material.tenant_id != tenant_id or not material.is_active:
        raise ValueError("Material not found")
    update_data = material_data.model_dump(exclude_unset=True, exclude_none=True)
    try:
        updated_material = await MaterialCRUD.update(db, material, **update_data)
        await db.commit()
        return MaterialResponse.model_validate(updated_material)
    except Exception as e:
        await db.rollback()
        raise Exception(f"Error updating material: {str(e)}")


async def delete_material(
    db: AsyncSession,
    tenant_id: UUID,
    material_id: UUID,
) -> None:
    """Delete a specific material."""

    material = await MaterialCRUD.get_by_id(db, material_id)
    if not material or material.tenant_id != tenant_id or not material.is_active:
        raise ValueError("Material not found")
    has_transactions = await MaterialTransactionCRUD.exists(db, material_id=material_id)

    if has_transactions:
        try:
            await MaterialCRUD.update(db=db, db_obj=material, is_active=False)
            await db.commit()
            return
        except Exception as e:
            await db.rollback()
            raise Exception(f"Error deactivating material: {str(e)}")
    else:
        try:
            _ = await MaterialCRUD.delete(db, material_id)
            await db.commit()
            return
        except Exception as e:
            await db.rollback()
            raise Exception(f"Error deleting material: {str(e)}")


async def create_transaction(
    db: AsyncSession,
    tenant_id: UUID,
    created_by: UUID,
    material_id: UUID,
    transaction: TransactionCreate,
) -> TransactionResponse:
    """Create a new material transaction."""
    transaction_model = transaction.model_dump()
    material = await MaterialCRUD.get_by_id(db, material_id)
    if not material or material.tenant_id != tenant_id or not material.is_active:
        raise ValueError("Material not found")
    try:
        new_transaction = await MaterialTransactionCRUD.create(
            db,
            tenant_id=tenant_id,
            material_id=material_id,
            created_by=created_by,
            **transaction_model,
        )

        new_count = material.current_stock
        if transaction.transaction_type in [
            MaterialTransactionType.RESTOCK,
            MaterialTransactionType.RETURN,
        ]:
            new_count += transaction.quantity
        elif transaction.transaction_type == MaterialTransactionType.CONSUMPTION:
            new_count -= transaction.quantity
        elif transaction.transaction_type == MaterialTransactionType.ADJUSTMENT:
            new_count = transaction.quantity
        else:
            raise ValueError("Invalid transaction type")

        if new_count < 0:
            raise ValueError("Resulting stock cannot be negative")
        await MaterialCRUD.update(db=db, db_obj=material, current_stock=new_count)

        await db.commit()
        return TransactionResponse.model_validate(new_transaction)
    except ValueError as e:
        await db.rollback()
        raise e
    except Exception as e:
        await db.rollback()
        raise Exception(f"Error creating transaction: {str(e)}")


async def get_transaction(
    db: AsyncSession,
    tenant_id: UUID,
    material_id: UUID,
    transaction_id: UUID,
) -> TransactionResponse:
    """Get details of a specific material transaction."""
    transaction = await MaterialTransactionCRUD.get_by_id(db, transaction_id)
    if (
        not transaction
        or transaction.tenant_id != tenant_id
        or transaction.material_id != material_id
    ):
        raise ValueError("Transaction not found")
    return TransactionResponse.model_validate(transaction)


async def list_transactions(
    db: AsyncSession,
    tenant_id: UUID,
    material_id: UUID,
    request: TransactionsRequest,
) -> TransactionListResponse:
    """Get a paginated list of material transactions with optional filters."""
    filters = {"tenant_id": tenant_id, "material_id": material_id}
    if request.transaction_type is not None:
        filters["transaction_type"] = request.transaction_type
    if request.order_id is not None:
        filters["order_id"] = request.order_id

    transactions, total = await MaterialTransactionCRUD.get_list(
        db,
        filters=filters,
        offset=request.offset,
        limit=request.limit,
        order_by=request.order_by,
        order_dir=request.order_dir,
    )
    return TransactionListResponse(
        total=total,
        items=[TransactionResponse.model_validate(t) for t in transactions],
    )
