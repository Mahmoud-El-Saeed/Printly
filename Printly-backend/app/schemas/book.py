from pydantic import BaseModel, Field, ConfigDict
from fastapi import UploadFile
from uuid import UUID
from datetime import datetime


class BookCreate(BaseModel):
    customer_id: UUID | None = None
    title: str = Field(..., max_length=300)
    subject: str | None = Field(None, max_length=200)
    total_pages: int = Field(..., gt=0)
    file: UploadFile | None = None


class BookUpdate(BaseModel):
    customer_id: UUID | None = None
    title: str | None = Field(None, max_length=300)
    subject: str | None = Field(None, max_length=200)
    total_pages: int | None = Field(None, gt=0)
    local_file_path: str | None = Field(None, max_length=500)


class BookResponse(BaseModel):
    id: UUID
    created_by: UUID
    customer_id: UUID | None
    title: str
    subject: str | None
    total_pages: int
    file_size: int | None
    local_file_path: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BooksRequest(BaseModel):
    customer_id: UUID | None = None
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

