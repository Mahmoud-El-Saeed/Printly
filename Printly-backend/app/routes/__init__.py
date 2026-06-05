from .auth import router as auth_router
from .customer import router as customer_router
from .book import router as book_router
from .material import router as material_router
from .pricing import router as pricing_router
from .order import router as order_router
from .payment import router as payment_router
from .expense import router as expense_router
from .activation_code import router as activation_code_router
from .notification import router as notification_router
from .dashboard import router as dashboard_router
from .customer_portal import router as customer_portal_router
__all__ = [
    "auth_router",
    "customer_router",
    "book_router",
    "material_router",
    "pricing_router",
    "order_router",
    "payment_router",
    "expense_router",
    "activation_code_router",
    "notification_router",
    "dashboard_router",
    "customer_portal_router",
]