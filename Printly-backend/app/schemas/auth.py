from pydantic import BaseModel, Field, EmailStr, ConfigDict
from uuid import UUID
from app.enums import UserRole



class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: str
    tenant_id: UUID | None
    role: str


class ShopOwnerRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=3)
    shop_name: str = Field(..., min_length=3)
    shop_phone: str | None = None
    shop_address: str | None = None


class ShopOwnerResponse(BaseModel):
    user_id: UUID
    email: str
    full_name: str
    role: str = UserRole.SHOP_OWNER.value
    tenant_id: UUID
    shop_name: str




class CustomerRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=3)


class CustomerResponse(BaseModel):
    user_id: UUID
    email: str
    full_name: str
    role: str = UserRole.CUSTOMER.value




class LoginRequest(BaseModel):
    email: EmailStr
    password: str




class RefreshRequest(BaseModel):
    refresh_token: str