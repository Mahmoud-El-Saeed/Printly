from sqlalchemy.ext.asyncio import AsyncSession

from .base_crud import BaseCRUD
from app.models import Payments

class PaymentCRUD(BaseCRUD[Payments]):
    model = Payments
        
    @classmethod
    async def batch_create(self, db: AsyncSession, items_data: list[Payments]):
        """Create multiple payment records in a batch."""
        db.add_all(items_data)
        await db.flush()
        return items_data