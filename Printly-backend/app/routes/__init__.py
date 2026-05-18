from .auth import router as auth_router
from .customer import router as customer_router
from .book import router as book_router
from .material import router as material_router
from .pricing import router as pricing_router
__all__ = [
    "auth_router",
    "customer_router",
    "book_router",
    "material_router",
    "pricing_router",
    ]