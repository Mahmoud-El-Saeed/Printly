import os
from fastapi import UploadFile
from fastapi.responses import FileResponse
from uuid import UUID
from uuid import uuid4
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import FileController
from app.models import Books, BookMaterials, Materials
from app.db import BookCRUD, SubscriptionCRUD, PlanCRUD, MaterialCRUD
from app.schemas import (
    BookCreate,
    BookResponse,
    BookUpdate,
    BooksRequest,
    BookListResponse,
    BookMaterialResponse,
)


def _build_material_responses(book: Books) -> list[BookMaterialResponse]:
    result = []
    for bm in book.book_materials:
        result.append(
            BookMaterialResponse(
                material_id=bm.material_id,
                material_name=bm.material.name,
                quantity_per_copy=bm.quantity_per_copy,
                price_per_unit=bm.material.price_per_unit,
            )
        )
    return result


async def create_book(
    db: AsyncSession,
    tenant_id: UUID,
    created_by: UUID,
    book_data: BookCreate,
) -> BookResponse:
    """Create a new book for the given tenant."""

    file_controller = FileController()
    file_path = None
    file_size = None

    if book_data.file:
        active_sub = await SubscriptionCRUD.get_active_by_tenant_id(db, tenant_id)
        if not active_sub:
            raise ValueError("No active subscription found")
        plan = await PlanCRUD.get_by_id(db, active_sub.plan_id)
        if not plan:
            raise ValueError("Subscription plan not found")
        max_books = plan.features.get("max_books", 20)
        current_book_count = await BookCRUD.count_stored_books(db, tenant_id=tenant_id)
        if current_book_count >= max_books:
            raise ValueError("Maximum number of books reached for the current plan remove some books or upgrade your plan to add more")
        if not file_controller.verify_file_type(book_data.file.filename, book_data.file.content_type):
            raise ValueError("Unsupported file type")
        if not file_controller.verify_file_size(book_data.file.size):
            raise ValueError("File size exceeds the limit")
        try:
            file_extension = file_controller.get_file_extension(book_data.file.filename)
            file_path = file_controller.return_file_path(str(tenant_id),  str(uuid4()) + file_extension)
            file_size = await file_controller.save_file(file_path, book_data.file)
        except Exception as e:
            raise ValueError("Failed to save file") from e
    try:
        create_kwargs = dict(
            tenant_id=tenant_id,
            created_by=created_by,
            title=book_data.title,
            subject=book_data.subject,
            total_pages=book_data.total_pages,
            color_mode=book_data.color_mode,
            sides_per_page=book_data.sides_per_page,
            copies=book_data.copies,
            binding_type=book_data.binding_type,
            has_lamination=book_data.has_lamination,
            notes=book_data.notes,
            file_url=file_path,
            file_size=book_data.file.size if book_data.file and book_data.file.size not in [None,-1] else (file_size if book_data.file else None),
        )

        new_book = await BookCRUD.create(db=db, **create_kwargs)

        if book_data.materials:
            material_ids = [m.material_id for m in book_data.materials]
            existing_materials = await MaterialCRUD.get_materials_by_ids(db, material_ids, tenant_id)
            existing_ids = {m.id for m in existing_materials}
            for item in book_data.materials:
                if item.material_id not in existing_ids:
                    raise ValueError(f"Material {item.material_id} not found in your tenant")
                db_item = BookMaterials(
                    book_id=new_book.id,
                    material_id=item.material_id,
                    quantity_per_copy=item.quantity_per_copy,
                )
                db.add(db_item)
            await db.flush()

        await db.commit()

        stmt = (
            select(Books)
            .options(selectinload(Books.book_materials).selectinload(BookMaterials.material))
            .where(Books.id == new_book.id)
        )
        result = await db.execute(stmt)
        new_book = result.scalar_one()

        book_response = BookResponse.model_validate(new_book)
        book_response.book_materials = _build_material_responses(new_book)
        return book_response

    except Exception as e:
        await db.rollback()
        if file_path and os.path.exists(file_path):
            file_controller.delete_file(file_path)
        if isinstance(e, ValueError):
            raise
        raise ValueError("Failed to create book") from e


async def upload_book_file(
    db: AsyncSession,
    tenant_id: UUID,
    book_id: UUID,
    file: UploadFile,
) -> BookResponse:
    """Upload or replace the file associated with a book."""

    file_controller = FileController()

    book = await BookCRUD.get_by_id(db, book_id)
    if not book or book.tenant_id != tenant_id:
        raise ValueError("Book not found")

    if not file_controller.verify_file_type(file.filename, file.content_type):
        raise ValueError("Unsupported file type")
    if not file_controller.verify_file_size(file.size):
        raise ValueError("File size exceeds the limit")

    try:
        remove_file = False
        if book.file_url:
            await file_controller.delete_file(book.file_url)
            remove_file = True

        active_sub = await SubscriptionCRUD.get_active_by_tenant_id(db, tenant_id)
        if not active_sub:
            raise ValueError("No active subscription found")
        plan = await PlanCRUD.get_by_id(db, active_sub.plan_id)
        if not plan:
            raise ValueError("Subscription plan not found")
        max_books = plan.features.get("max_books", 20)
        current_book_count = await BookCRUD.count_stored_books(db, tenant_id=tenant_id) - (1 if remove_file else 0)
        if current_book_count >= max_books:
            raise ValueError("Maximum number of books reached for the current plan remove some books or upgrade your plan to add more")

        file_extension = file_controller.get_file_extension(file.filename)
        file_path = file_controller.return_file_path(str(tenant_id),  str(uuid4()) + file_extension)
        file_size = await file_controller.save_file(file_path, file)
        updated_book = await BookCRUD.update(
            db,
            book,
            file_url=file_path,
            file_size= file.size if file.size not in [None,-1] else file_size,
        )
        await db.commit()
        resp = BookResponse.model_validate(updated_book)
        resp.book_materials = _build_material_responses(updated_book)
        return resp
    except Exception as e:
        await db.rollback()
        if file_path and os.path.exists(file_path):
            file_controller.delete_file(file_path)
        raise ValueError("Failed to upload file") from e


async def download_book_file(
    db: AsyncSession,
    tenant_id: UUID,
    book_id: UUID,
) -> FileResponse:
    """Download the file associated with a book."""
    file_controller = FileController()

    book: Books | None = await BookCRUD.get_by_id(db, book_id)

    if not book or book.tenant_id != tenant_id:
        raise ValueError("Book not found")
    if not book.file_url:
        raise ValueError("No file associated with this book")
    if not file_controller.file_exists(book.file_url):
        raise ValueError("File not found on server")

    return FileResponse(
        path=book.file_url,
        filename=book.title + file_controller.get_file_extension(book.file_url),
        media_type=file_controller.get_file_mime_type(book.file_url),
    )


async def get_book(
    db: AsyncSession,
    tenant_id: UUID,
    book_id: UUID,
) -> BookResponse:
    """Get details of a specific book."""
    book = await BookCRUD.get_by_id(db, book_id)
    if not book or book.tenant_id != tenant_id:
        raise ValueError("Book not found")
    resp = BookResponse.model_validate(book)
    resp.book_materials = _build_material_responses(book)
    return resp


async def list_books(
    db: AsyncSession,
    tenant_id: UUID,
    request: BooksRequest,
) -> BookListResponse:
    """List books for a tenant with optional search and pagination."""
    books, total = await BookCRUD.search_books(
        db=db,
        tenant_id=tenant_id,
        title=request.title,
        subject=request.subject,
        has_file=request.has_file,
        offset=request.offset,
        limit=request.limit,
        order_by=request.order_by,
        order_dir=request.order_dir,
    )
    items = []
    for book in books:
        resp = BookResponse.model_validate(book)
        resp.book_materials = _build_material_responses(book)
        items.append(resp)
    return BookListResponse(
        total=total,
        items=items,
    )


async def update_book(
    db: AsyncSession,
    tenant_id: UUID,
    book_id: UUID,
    book_data: BookUpdate,
) -> BookResponse:
    """Update details of a specific book."""
    book = await BookCRUD.get_by_id(db, book_id)
    if not book or book.tenant_id != tenant_id:
        raise ValueError("Book not found")

    update_data = book_data.model_dump(exclude_unset=True, exclude_none=True)
    updated_book = await BookCRUD.update(db, book, **update_data)
    await db.commit()
    resp = BookResponse.model_validate(updated_book)
    resp.book_materials = _build_material_responses(updated_book)
    return resp


async def delete_book_file(
    db: AsyncSession,
    tenant_id: UUID,
    book_id: UUID,
) -> None:
    """Delete the file associated with a book."""
    file_controller = FileController()

    book = await BookCRUD.get_by_id(db, book_id)
    if not book or book.tenant_id != tenant_id:
        raise ValueError("Book not found")
    if not book.file_url:
        raise ValueError("No file associated with this book")

    try:
        if book.file_url and os.path.exists(book.file_url):
            await file_controller.delete_file(book.file_url)
        await BookCRUD.update(db, book, file_url=None, file_size=None)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise ValueError("Failed to delete file") from e


async def delete_book(
    db: AsyncSession,
    tenant_id: UUID,
    book_id: UUID,
) -> None:
    """Delete a book and its associated file."""
    file_controller = FileController()

    book = await BookCRUD.get_by_id(db, book_id)
    if not book or book.tenant_id != tenant_id:
        raise ValueError("Book not found")

    try:
        if book.file_url and os.path.exists(book.file_url):
            await file_controller.delete_file(book.file_url)
        await BookCRUD.delete(db, book_id)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise ValueError("Failed to delete book") from e
