from datetime import date
from uuid import UUID
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.db import ReportDB
from app.schemas import DebtsResponse, DebtorItem


async def get_debts(db: AsyncSession, tenant_id: UUID) -> DebtsResponse:
    rows = await ReportDB.get_debts(db, tenant_id)

    today = date.today()
    total_outstanding = Decimal("0")
    total_overdue = Decimal("0")

    debtors = []
    for row in rows:
        outstanding = row["outstanding"]
        due_date = row["due_date"]
        days_overdue = None
        if due_date and due_date < today:
            days_overdue = (today - due_date).days
            total_overdue += outstanding
        total_outstanding += outstanding

        debtors.append(DebtorItem(
            order_id=row["order_id"],
            order_number=row["order_number"],
            customer_name=row["customer_name"],
            total_amount=row["total_amount"],
            paid_amount=row["paid_amount"],
            outstanding=row["outstanding"],
            due_date=due_date,
            days_overdue=days_overdue,
        ))

    return DebtsResponse(
        total_outstanding=total_outstanding,
        total_overdue=total_overdue,
        debtors_count=len(debtors),
        debtors=debtors,
    )