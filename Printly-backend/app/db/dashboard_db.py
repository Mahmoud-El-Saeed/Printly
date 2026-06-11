from datetime import date, datetime, timedelta
from uuid import UUID
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class DashboardDB:

    @staticmethod
    def _get_date_ranges() -> dict:
        today = date.today()
        return {
            "start_of_today": datetime.combine(today, datetime.min.time()),
            "start_of_yesterday": datetime.combine(
                today - timedelta(days=1), datetime.min.time()
            ),
            "start_of_this_month": datetime.combine(
                today.replace(day=1), datetime.min.time()
            ),
            "start_of_last_month": datetime.combine(
                (today.replace(day=1) - timedelta(days=1)).replace(day=1),
                datetime.min.time()
            ),
            "start_of_this_year": datetime.combine(
                today.replace(month=1, day=1), datetime.min.time()
            ),
            "today_date": today,
            "this_month_date": today.replace(day=1),
            "this_year_date": today.replace(month=1, day=1),
        }

    @classmethod
    async def get_revenue_stats(
        cls, db: AsyncSession, tenant_id: UUID,
        from_date: date | None = None, to_date: date | None = None,
    ) -> dict:
        d = cls._get_date_ranges()

        if from_date and to_date:
            start_from = datetime.combine(from_date, datetime.min.time())
            end_to = datetime.combine(to_date, datetime.max.time())
            result = await db.execute(
                text("""
                    SELECT COALESCE(SUM(p.amount), 0)
                    FROM payments p
                    JOIN orders o ON o.id = p.order_id
                    WHERE p.tenant_id = :tenant_id
                      AND o.status != 'CANCELLED'
                      AND p.created_at >= :start_from
                      AND p.created_at <= :end_to
                """),
                {"tenant_id": tenant_id, "start_from": start_from, "end_to": end_to},
            )
            total = float(result.scalar())
            return {
                "today": total,
                "this_month": total,
                "this_year": total,
                "yesterday": 0.0,
                "last_month": 0.0,
            }

        result = await db.execute(
            text("""
                SELECT
                    COALESCE(SUM(CASE WHEN p.created_at >= :start_of_today
                                    THEN p.amount ELSE 0 END), 0),
                    COALESCE(SUM(CASE WHEN p.created_at >= :start_of_this_month
                                    THEN p.amount ELSE 0 END), 0),
                    COALESCE(SUM(CASE WHEN p.created_at >= :start_of_this_year
                                    THEN p.amount ELSE 0 END), 0),
                    COALESCE(SUM(CASE WHEN p.created_at >= :start_of_yesterday
                                        AND p.created_at < :start_of_today
                                    THEN p.amount ELSE 0 END), 0),
                    COALESCE(SUM(CASE WHEN p.created_at >= :start_of_last_month
                                        AND p.created_at < :start_of_this_month
                                    THEN p.amount ELSE 0 END), 0)
                FROM payments p
                JOIN orders o ON o.id = p.order_id
                WHERE p.tenant_id = :tenant_id
                AND o.status != 'CANCELLED'
            """),
            {**d, "tenant_id": tenant_id},
        )

        row = result.fetchone()
        return {
            "today": float(row[0]),
            "this_month": float(row[1]),
            "this_year": float(row[2]),
            "yesterday": float(row[3]),
            "last_month": float(row[4]),
        }

    @classmethod
    async def get_expense_stats(
        cls, db: AsyncSession, tenant_id: UUID,
        from_date: date | None = None, to_date: date | None = None,
    ) -> dict:
        d = cls._get_date_ranges()

        if from_date and to_date:
            result = await db.execute(
                text("""
                    SELECT COALESCE(SUM(e.amount), 0)
                    FROM expenses e
                    WHERE e.tenant_id = :tenant_id
                      AND e.expense_date >= :from_date
                      AND e.expense_date <= :to_date
                """),
                {"tenant_id": tenant_id, "from_date": from_date, "to_date": to_date},
            )
            total = float(result.scalar())
            return {"today": total, "this_month": total, "this_year": total}

        result = await db.execute(
            text("""
                SELECT
                    COALESCE(SUM(CASE WHEN e.expense_date = :today_date
                                    THEN e.amount ELSE 0 END), 0),
                    COALESCE(SUM(CASE WHEN e.expense_date >= :this_month_date
                                    THEN e.amount ELSE 0 END), 0),
                    COALESCE(SUM(CASE WHEN e.expense_date >= :this_year_date
                                    THEN e.amount ELSE 0 END), 0)
                FROM expenses e
                WHERE e.tenant_id = :tenant_id
            """),
            {**d, "tenant_id": tenant_id},
        )
        row = result.fetchone()
        return {
            "today": float(row[0]),
            "this_month": float(row[1]),
            "this_year": float(row[2]),
        }

    @classmethod
    async def get_expenses_by_category(
        cls, db: AsyncSession, tenant_id: UUID,
        from_date: date | None = None, to_date: date | None = None,
    ) -> list[dict]:
        d = cls._get_date_ranges()

        if from_date and to_date:
            result = await db.execute(
                text("""
                    SELECT e.category, COALESCE(SUM(e.amount), 0)
                    FROM expenses e
                    WHERE e.tenant_id = :tenant_id
                      AND e.expense_date >= :from_date
                      AND e.expense_date <= :to_date
                    GROUP BY e.category
                    ORDER BY SUM(e.amount) DESC
                """),
                {"tenant_id": tenant_id, "from_date": from_date, "to_date": to_date},
            )
        else:
            result = await db.execute(
                text("""
                    SELECT e.category, COALESCE(SUM(e.amount), 0)
                    FROM expenses e
                    WHERE e.tenant_id = :tenant_id
                        AND e.expense_date >= :this_month_date
                    GROUP BY e.category
                    ORDER BY SUM(e.amount) DESC
                """),
                {**d, "tenant_id": tenant_id},
            )
        return [
            {"category": row[0], "total": float(row[1])} for row in result.fetchall()
        ]

    @classmethod
    async def get_orders_stats(
        cls, db: AsyncSession, tenant_id: UUID,
        from_date: date | None = None, to_date: date | None = None,
    ) -> dict:
        d = cls._get_date_ranges()

        if from_date and to_date:
            start_from = datetime.combine(from_date, datetime.min.time())
            end_to = datetime.combine(to_date, datetime.max.time())

            by_status_result = await db.execute(
                text("""
                    SELECT o.status, COUNT(*)
                    FROM orders o
                    WHERE o.tenant_id = :tenant_id
                      AND o.created_at >= :start_from
                      AND o.created_at <= :end_to
                    GROUP BY o.status
                """),
                {"tenant_id": tenant_id, "start_from": start_from, "end_to": end_to},
            )

            by_status = {}
            for row in by_status_result.fetchall():
                by_status[row[0]] = int(row[1])

            avg_result = await db.execute(
                text("""
                    SELECT COALESCE(
                        AVG(EXTRACT(EPOCH FROM (o.completed_at - o.created_at)) / 3600), 0
                    )
                    FROM orders o
                    WHERE o.tenant_id = :tenant_id
                      AND o.completed_at IS NOT NULL
                      AND o.created_at >= :start_from
                      AND o.created_at <= :end_to
                """),
                {"tenant_id": tenant_id, "start_from": start_from, "end_to": end_to},
            )
            avg_hours = float(avg_result.scalar())

            return {
                "total": sum(by_status.values()),
                "by_status": by_status,
                "today_new": 0,
                "avg_completion_hours": round(avg_hours, 1),
            }

        by_status_result = await db.execute(
            text("""
                SELECT
                    o.status,
                    COUNT(*),
                    SUM(CASE WHEN o.created_at >= :start_of_today THEN 1 ELSE 0 END)
                FROM orders o
                WHERE o.tenant_id = :tenant_id
                GROUP BY o.status
            """),
            {**d, "tenant_id": tenant_id},
        )

        by_status = {}
        today_new = 0
        for row in by_status_result.fetchall():
            by_status[row[0]] = int(row[1])
            today_new += int(row[2])

        avg_result = await db.execute(
            text("""
                SELECT COALESCE(
                    AVG(EXTRACT(EPOCH FROM (o.completed_at - o.created_at)) / 3600), 0
                )
                FROM orders o
                WHERE o.tenant_id = :tenant_id
                    AND o.completed_at IS NOT NULL
            """),
            {**d, "tenant_id": tenant_id},
        )
        avg_hours = float(avg_result.scalar())

        return {
            "total": sum(by_status.values()),
            "by_status": by_status,
            "today_new": today_new,
            "avg_completion_hours": round(avg_hours, 1),
        }

    @classmethod
    async def get_top_materials(
        cls, db: AsyncSession, tenant_id: UUID,
        from_date: date | None = None, to_date: date | None = None,
    ) -> list[dict]:
        result = await db.execute(
            text("""
                SELECT
                    m.id,
                    m.name,
                    COALESCE(SUM(mt.quantity), 0),
                    COALESCE(SUM(mt.quantity * m.cost_per_unit), 0)
                FROM materials m
                JOIN material_transactions mt ON mt.material_id = m.id
                WHERE m.tenant_id = :tenant_id
                  AND mt.transaction_type = 'consumption'
                  AND m.is_active = true
                GROUP BY m.id, m.name
                ORDER BY SUM(mt.quantity) DESC
                LIMIT 10
            """),
            {"tenant_id": tenant_id},
        )
        return [
            {
                "material_id": str(row[0]),
                "material_name": row[1],
                "total_quantity_used": int(row[2]),
                "total_cost": float(row[3]),
            }
            for row in result.fetchall()
        ]

    @classmethod
    async def get_top_customers(
        cls, db: AsyncSession, tenant_id: UUID,
        from_date: date | None = None, to_date: date | None = None,
    ) -> list[dict]:
        result = await db.execute(
            text("""
                SELECT
                    o.customer_id,
                    o.walk_in_customer_id,
                    COALESCE(u.full_name, w.name, 'Walk-in'),
                    COALESCE(SUM(p.amount), 0),
                    COALESCE(COUNT(DISTINCT o.id), 0)
                FROM payments p
                JOIN orders o ON o.id = p.order_id
                LEFT JOIN users u ON u.id = o.customer_id
                LEFT JOIN walk_in_customers w ON w.id = o.walk_in_customer_id
                WHERE p.tenant_id = :tenant_id
                    AND o.status != 'CANCELLED'
                GROUP BY o.customer_id, o.walk_in_customer_id, u.full_name, w.name
                ORDER BY SUM(p.amount) DESC
                LIMIT 10
            """),
            {"tenant_id": tenant_id},
        )
        return [
            {
                "customer_id": str(row[0]) if row[0] else str(row[1]),
                "customer_name": row[2],
                "total_spent": float(row[3]),
                "total_orders": int(row[4]),
            }
            for row in result.fetchall()
        ]