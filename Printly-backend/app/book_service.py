import os
from fastapi import UploadFile
from fastapi.responses import FileResponse
from uuid import UUID
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import FileController
from app.models import Books
from app.db import BookCRUD, SubscriptionCRUD, PlanCRUD,UserCRUD
from app.schemas import (
    BookCreate,
    BookResponse,
    BookUpdate,
    BooksRequest,
    BookListResponse,
)


async def create_book(
    db: AsyncSession,
    tenant_id: UUID,
    created_by: UUID,
    book_data: BookCreate,
) -> BookResponse:
    """Create a new book for the given tenant."""

    book_crud = BookCRUD()
    plan_crud = PlanCRUD()
    subscription_crud = SubscriptionCRUD()
    user_crud = UserCRUD()
    file_controller = FileController()
    file_path = None
    
    if book_data.customer_id:
        customer = await user_crud.get_by_id(db, book_data.customer_id)
        if not customer or customer.tenant_id != tenant_id:
            raise ValueError("Customer not found in your tenant")

    if book_data.file:
        active_sub = await subscription_crud.get_active_by_tenant_id(db, tenant_id)
        if not active_sub:
            raise ValueError("No active subscription found")
        plan = await plan_crud.get_by_id(db, active_sub.plan_id)
        if not plan:
            raise ValueError("Subscription plan not found")
        max_books = plan.features.get("max_books", 20)
        current_book_count = await book_crud.count_stored_books(db, tenant_id=tenant_id)
        if current_book_count >= max_books:
            raise ValueError("Maximum number of books reached for the current plan remove some books or upgrade your plan to add more")
        if not file_controller.verify_file_type(book_data.file.filename, book_data.file.content_type):
            raise ValueError("Unsupported file type")
        if not file_controller.verify_file_size(book_data.file.size):
            raise ValueError("File size exceeds the limit")
        try:
            file_extension = file_controller.get_file_extension(book_data.file.filename)
            file_path = file_controller.return_file_path(str(tenant_id),  str(uuid4()) + file_extension)
            await file_controller.save_file(file_path, book_data.file)
        except Exception as e:
            raise ValueError("Failed to save file") from e
    try:
        new_book = await book_crud.create(
            db=db,
            tenant_id=tenant_id,
            customer_id=book_data.customer_id,
            created_by=created_by,
            title=book_data.title,
            subject=book_data.subject,
            total_pages=book_data.total_pages,
            file_url=file_path,
            file_size=book_data.file.size if book_data.file else None,
        )
        await db.commit()
        book_response = BookResponse.model_validate(new_book)
        return book_response

    except Exception as e:
        await db.rollback()
        if os.path.exists(file_path) and file_path:
            file_controller.delete_file(file_path)  # Clean up the file if book creation fails
        raise ValueError("Failed to create book") from e

async def upload_book_file(
    db: AsyncSession,
    tenant_id: UUID,
    book_id: UUID,
    file: UploadFile,
) -> BookResponse:
    """Upload or replace the file associated with a book."""
    book_crud = BookCRUD()
    plan_crud = PlanCRUD()
    subscription_crud = SubscriptionCRUD()
    file_controller = FileController()

    book = await book_crud.get_by_id(db, book_id)
    if not book or book.tenant_id != tenant_id:
        raise ValueError("Book not found")

    if not file_controller.verify_file_type(file.filename, file.content_type):
        raise ValueError("Unsupported file type")
    if not file_controller.verify_file_size(file.size):
        raise ValueError("File size exceeds the limit")

    try:
        remove_file = False
        # Delete old file if exists
        if book.file_url:
            await file_controller.delete_file(book.file_url)
            remove_file = True
        
        active_sub = await subscription_crud.get_active_by_tenant_id(db, tenant_id)
        if not active_sub:
            raise ValueError("No active subscription found")
        plan = await plan_crud.get_by_id(db, active_sub.plan_id)
        if not plan:
            raise ValueError("Subscription plan not found")
        max_books = plan.features.get("max_books", 20)
        current_book_count = await book_crud.count_stored_books(db, tenant_id=tenant_id) - (1 if remove_file else 0) 
        if current_book_count >= max_books:
            raise ValueError("Maximum number of books reached for the current plan remove some books or upgrade your plan to add more")


        # Save new file
        file_extension = file_controller.get_file_extension(file.filename)
        file_path = file_controller.return_file_path(str(tenant_id),  str(uuid4()) + file_extension)
        await file_controller.save_file(file_path, file)
        updated_book = await book_crud.update(
            db,
            book,
            file_url=file_path,
            file_size=file.size,
        )
        await db.commit()
        return BookResponse.model_validate(updated_book)
    except Exception as e:
        await db.rollback()
        if file_path and os.path.exists(file_path):
            file_controller.delete_file(file_path)  # Clean up the file if upload fails
        raise ValueError("Failed to upload file") from e

async def download_book_file(
    db: AsyncSession,
    tenant_id: UUID,
    book_id: UUID,
) -> FileResponse:
    """Download the file associated with a book."""
    book_crud = BookCRUD()
    file_controller = FileController()

    book: Books | None = await book_crud.get_by_id(db, book_id)

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
    book_crud = BookCRUD()
    book = await book_crud.get_by_id(db, book_id)
    if not book or book.tenant_id != tenant_id:
        raise ValueError("Book not found")
    return BookResponse.model_validate(book)


async def list_books(
    db: AsyncSession,
    tenant_id: UUID,
    request: BooksRequest,
) -> BookListResponse:
    """List books for a tenant with optional search and pagination."""
    book_crud = BookCRUD()
    books, total = await book_crud.search_books(
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
    return BookListResponse(
        total=total,
        items=[BookResponse.model_validate(book) for book in books],
    )


async def update_book(
    db: AsyncSession,
    tenant_id: UUID,
    book_id: UUID,
    book_data: BookUpdate,
) -> BookResponse:
    """Update details of a specific book."""
    book_crud = BookCRUD()
    book = await book_crud.get_by_id(db, book_id)
    if not book or book.tenant_id != tenant_id:
        raise ValueError("Book not found")

    update_data = book_data.model_dump(exclude_unset=True)
    updated_book = await book_crud.update(db, book, **update_data)
    await db.commit()
    return BookResponse.model_validate(updated_book)


async def delete_book_file(
    db: AsyncSession,
    tenant_id: UUID,
    book_id: UUID,
) -> None:
    """Delete the file associated with a book."""
    book_crud = BookCRUD()
    file_controller = FileController()

    book = await book_crud.get_by_id(db, book_id)
    if not book or book.tenant_id != tenant_id:
        raise ValueError("Book not found")
    if not book.file_url:
        raise ValueError("No file associated with this book")

    try:
        if book.file_url and os.path.exists(book.file_url):
            await file_controller.delete_file(book.file_url)
        await book_crud.update(db, book, file_url=None, file_size=None)
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
    book_crud = BookCRUD()
    file_controller = FileController()

    book = await book_crud.get_by_id(db, book_id)
    if not book or book.tenant_id != tenant_id:
        raise ValueError("Book not found")

    try:
        if book.file_url and os.path.exists(book.file_url):
            await file_controller.delete_file(book.file_url)
        await book_crud.delete(db, book_id)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise ValueError("Failed to delete book") from e
