from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordRequestForm

import logging
from typing import Annotated

from app.services import (
    register_shop_owner,
    login,
    register_customer,
    refresh_tokens,
)
from app.routes.deps import get_db, get_current_user
from app.schemas import (
    ShopOwnerRegister,
    ShopOwnerResponse,
    LoginRequest,
    TokenResponse,
    CustomerRegister,
    CustomerResponse,
    RefreshRequest,
    TokenData
)

router = APIRouter(prefix="/auth", tags=["auth"])


logger = logging.getLogger(__name__)


@router.post("/register/shop-owner", response_model=ShopOwnerResponse)
async def register_shop_owner_endpoint(
    data: ShopOwnerRegister,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ShopOwnerResponse:
    """Endpoint to register a new shop owner and create a tenant"""
    try:
        return await register_shop_owner(db, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.error(f"Error registering shop owner: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while registering the shop owner",
        ) from e


@router.post("/register/customer", response_model=CustomerResponse)
async def register_customer_endpoint(
    data: CustomerRegister,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CustomerResponse:
    """Endpoint to register a new customer"""
    try:
        return await register_customer(db, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.error(f"Error registering customer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while registering the customer",
        ) from e


@router.post("/login", response_model=TokenResponse)
async def login_endpoint(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Endpoint to authenticate user and return access and refresh tokens"""
    try:
        return await login(
            db, LoginRequest(email=form_data.username, password=form_data.password)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    except Exception as e:
        logger.error(f"Error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login",
        ) from e


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens_endpoint(
    data: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Endpoint to refresh access token using a valid refresh token"""
    try:
        return await refresh_tokens(db, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.error(f"Error refreshing tokens: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while refreshing tokens",
        ) from e


@router.get("/protected")
async def protected_endpoint(
    tokendata: Annotated[TokenData, Depends(get_current_user)],   
) -> dict:
    """Example of a protected endpoint that requires authentication"""
    return {"message": "This is a protected endpoint", "user": tokendata}