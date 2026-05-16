from .auth import router as auth_router
from .customer import router as customer_router
from .book import router as book_router
__all__ = [
    "auth_router",
    "customer_router",
    "book_router",
    ]