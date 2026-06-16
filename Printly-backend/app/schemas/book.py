from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class BookMaterialItem(BaseModel):
    material_id: UUID
    quantity_per_copy: Decimal = Field(..., gt=0)


class BookCreate(BaseModel):
    title: str = Field(..., max_length=300)
    subject: str | None = Field(None, max_length=200)
    total_pages: int = Field(..., gt=0)
    color_mode: str = Field("bw", pattern="^(bw|color)$")
    sides_per_page: int = Field(1, ge=1, le=4)
    copies: int = Field(1, gt=0)
    binding_type: str | None = Field(None, max_length=50)
    has_lamination: bool = False
    notes: str | None = None
    materials: list[BookMaterialItem] = Field(default_factory=list)


class BookUpdate(BaseModel):
    title: str | None = Field(None, max_length=300)
    subject: str | None = Field(None, max_length=200)
    total_pages: int | None = Field(None, gt=0)
    color_mode: str | None = Field(None, pattern="^(bw|color)$")
    sides_per_page: int | None = Field(None, ge=1, le=4)
    copies: int | None = Field(None, gt=0)
    binding_type: str | None = Field(None, max_length=50)
    has_lamination: bool | None = None
    notes: str | None = None


class BookMaterialResponse(BaseModel):
    material_id: UUID
    material_name: str
    quantity_per_copy: Decimal
    price_per_unit: Decimal

    model_config = ConfigDict(from_attributes=True)


class BookResponse(BaseModel):
    id: UUID
    title: str
    subject: str | None
    total_pages: int
    color_mode: str
    sides_per_page: int
    copies: int
    binding_type: str | None
    has_lamination: bool
    notes: str | None
    file_size: int | None
    file_url: str | None
    created_at: datetime
    updated_at: datetime
    book_materials: list[BookMaterialResponse] = []

    model_config = ConfigDict(from_attributes=True)


class BooksRequest(BaseModel):
    title: str | None = None
    subject: str | None = None
    offset: int = 0
    limit: int = 10
    order_by: str = "created_at"
    order_dir: str = "desc"
    has_file: bool | None = None


class BookListResponse(BaseModel):
    total: int
    items: list[BookResponse]
