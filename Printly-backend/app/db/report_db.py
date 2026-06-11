from datetime import date
from uuid import UUID
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class ReportDB:
    @classmethod
    async def get_debts(cls, db: AsyncSession, tenant_id: UUID) -> list[dict]:
        result = await db.execute(
            text("""
                SELECT
                    o.id,
                    o.order_number,
                    COALESCE(u.full_name, w.name, 'Walk-in'),
                    o.total_amount,
                    o.paid_amount,
                    o.total_amount - o.paid_amount,
                    o.due_date
                FROM orders o
                LEFT JOIN users u ON u.id = o.customer_id
                LEFT JOIN walk_in_customers w ON w.id = o.walk_in_customer_id
                WHERE o.tenant_id = :tenant_id
                  AND o.total_amount > o.paid_amount
                  AND o.status NOT IN ('cancelled', 'delivered')
                ORDER BY o.total_amount - o.paid_amount DESC
            """),
            {"tenant_id": tenant_id},
        )
        return [
            {
                "order_id": row[0],
                "order_number": row[1],
                "customer_name": row[2],
                "total_amount": row[3],
                "paid_amount": row[4],
                "outstanding": row[5],
                "due_date": row[6],
            }
            for row in result.fetchall()
        ]
