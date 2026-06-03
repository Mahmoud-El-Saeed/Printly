from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import logging
from app.routes.deps import get_db, require_tenant_staff
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
    TokenData,
)
from app.services import (
    create_material,
    get_material,
    update_material,
    delete_material,
    create_transaction,
    get_transaction,
    list_materials,
    list_transactions,
)

router = APIRouter(prefix="/materials", tags=["materials"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def create_material_endpoint(
    material: MaterialCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to create a new material."""
    try:
        new_material = await create_material(db, user.tenant_id, material)
        return new_material
    except ValueError as e:
        logger.warning(f"Validation error creating material: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating material: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/", response_model=MaterialListResponse)
async def list_materials_endpoint(
    request: Annotated[MaterialsRequest, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to list materials with optional pagination, search, and sorting."""
    try:
        return await list_materials(db, user.tenant_id, request)
    except ValueError as e:
        logger.warning(f"Validation error listing materials: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error listing materials: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/{material_id}", response_model=MaterialResponse)
async def get_material_endpoint(
    material_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to retrieve a material by its ID."""
    try:
        return await get_material(db, user.tenant_id, material_id)
    except ValueError as e:
        logger.warning(f"Material not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error retrieving material: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.put("/{material_id}", response_model=MaterialResponse)
async def update_material_endpoint(
    material_id: UUID,
    material_update: MaterialUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to update an existing material."""
    try:
        return await update_material(db, user.tenant_id, material_id, material_update)
    except ValueError as e:
        logger.warning(f"Validation error updating material: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating material: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material_endpoint(
    material_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to delete a material."""
    try:
        await delete_material(db, user.tenant_id, material_id)
    except ValueError as e:
        logger.warning(f"Material not found for deletion: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting material: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/{material_id}/transactions", response_model=TransactionListResponse)
async def list_material_transactions_endpoint(
    material_id: UUID,
    request: Annotated[TransactionsRequest, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to list transactions for a specific material."""
    try:
        return await list_transactions(db, user.tenant_id, material_id, request)
    except ValueError as e:
        logger.warning(f"Validation error listing transactions: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error listing transactions: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post(
    "/{material_id}/transactions",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_material_transaction_endpoint(
    material_id: UUID,
    transaction: TransactionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to create a new transaction for a specific material."""
    try:
        return await create_transaction(
        db=db,
        tenant_id=user.tenant_id,
        created_by=user.user_id,
        material_id=material_id,
        transaction=transaction,
    )
        
        
    except ValueError as e:
        logger.warning(f"Validation error creating transaction: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating transaction: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/{material_id}/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_material_transaction_endpoint(
    material_id: UUID,
    transaction_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to get details of a specific material transaction."""
    try:
        return await get_transaction(db, user.tenant_id, material_id, transaction_id)
    except ValueError as e:
        logger.warning(f"Validation error getting transaction: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting transaction: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
