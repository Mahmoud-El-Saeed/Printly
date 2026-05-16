from typing import Annotated
from fastapi import HTTPException, UploadFile, Depends, status, APIRouter
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.services import (
    create_book,
    get_book,
    update_book,
    delete_book,
    delete_book_file,
    list_books,
    upload_book_file,
    download_book_file,
)
from app.schemas import (
    BookCreate,
    BookResponse,
    BookUpdate,
    BooksRequest,
    BookListResponse,
    TokenData,
)
from app.routes.deps import get_db, require_tenant_staff

router = APIRouter(prefix="/books", tags=["Books"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book_endpoint(
    book: Annotated[BookCreate, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to create a new book with optional file upload."""
    try:
        return await create_book(
            db=db,
            tenant_id=current_user.tenant_id,
            created_by=current_user.user_id,
            book_data=book,
        )
    except ValueError as e:
        logger.error(f"Error creating book: {e}")
        raise HTTPException(status_code=400, detail=str(e)) from e

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.get("/", response_model=BookListResponse)
async def list_books_endpoint(
    request: Annotated[BooksRequest, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to list books with optional pagination, search, and sorting."""
    try:
        return await list_books(
            db=db, tenant_id=current_user.tenant_id, request=request
        )
    except ValueError as e:
        logger.error(f"Error listing books: {e}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.get("/{book_id}", response_model=BookResponse)
async def get_book_endpoint(
    book_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to get details of a specific book."""
    try:
        return await get_book(db=db, tenant_id=current_user.tenant_id, book_id=book_id)
    except ValueError as e:
        logger.error(f"Error getting book: {e}")
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.put("/{book_id}", response_model=BookResponse)
async def update_book_endpoint(
    book_id: UUID,
    book_data: Annotated[BookUpdate, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to update details of a specific book."""
    try:
        return await update_book(
            db=db,
            tenant_id=current_user.tenant_id,
            book_id=book_id,
            book_data=book_data,
        )
    except ValueError as e:
        logger.error(f"Error updating book: {e}")
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book_endpoint(
    book_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to delete a specific book."""
    try:
        await delete_book(db=db, tenant_id=current_user.tenant_id, book_id=book_id)
    except ValueError as e:
        logger.error(f"Error deleting book: {e}")
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.delete("/{book_id}/file", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book_file_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    book_id: UUID,
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to delete the file associated with a book."""
    try:
        await delete_book_file(db=db, tenant_id=current_user.tenant_id, book_id=book_id)
    except ValueError as e:
        logger.error(f"Error deleting book file: {e}")
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.get("/{book_id}/file")
async def download_book_file_endpoint(
    book_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to download the file associated with a book."""
    try:
        return await download_book_file(
            db=db, tenant_id=current_user.tenant_id, book_id=book_id
        )
    except ValueError as e:
        logger.error(f"Error downloading book file: {e}")
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.post("/{book_id}/file", status_code=status.HTTP_200_OK)
async def upload_book_file_endpoint(
    book_id: UUID,
    file: UploadFile,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to upload or replace the file associated with a book."""
    try:
        return await upload_book_file(
            db=db, tenant_id=current_user.tenant_id, book_id=book_id, file=file
        )
    except ValueError as e:
        logger.error(f"Error uploading book file: {e}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") from e
