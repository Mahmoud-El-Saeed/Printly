"""
Demo seed script — populates the database with realistic fake data.
Run:  python -m app.db.seed_runner --demo
Safe to run multiple times — deletes old demo data before re-seeding.
"""

import random
from datetime import date, datetime, timedelta
from decimal import Decimal

from faker import Faker
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.enums import (
    ExpenseCategory,
    LinkStatus,
    MaterialTransactionType,
    NotificationType,
    OrderStatus,
    PaymentMethod,
    UserRole,
)
from app.models import (
    Books,
    CustomerTenantLinks,
    Expenses,
    MaterialTransactions,
    Materials,
    Notifications,
    OrderItems,
    Orders,
    Payments,
    TenantMembers,
    Tenants,
    Users,
    WalkInCustomers,
)

# ── Config ────────────────────────────────────────────────────────
DEMO_SHOP_NAME = "مطبعة النور للطباعة الرقمية"
DEMO_SHOP_EMAIL = "shop@printly.demo"
DEMO_SHOP_PASSWORD = "Demo1234"
DEMO_CUSTOMER_PASSWORD = "Customer1234"

NUM_WALK_IN = 12
NUM_REGISTERED_CUSTOMERS = 8
NUM_ORDERS_PER_CUSTOMER = 5
NUM_MATERIALS = 8
NUM_TRANSACTIONS = 15
NUM_EXPENSES = 12
NUM_NOTIFICATIONS = 15

# ── Helpers ───────────────────────────────────────────────────────

_faker = Faker(["ar_EG", "en_US"])


def ar():  # Arabic fake data
    _faker.seed_instance(42)
    return _faker


def en():
    _faker.seed_instance(99)
    return Faker("en_US")


def rand_date(days_back: int = 90) -> date:
    return (datetime.now() - timedelta(days=random.randint(0, days_back))).date()


def rand_datetime(days_back: int = 90) -> datetime:
    return datetime.now() - timedelta(
        days=random.randint(0, days_back),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
    )


def rand_money(min_val: float = 10, max_val: float = 500) -> Decimal:
    return Decimal(str(round(random.uniform(min_val, max_val), 2)))


# ── Seed Functions ────────────────────────────────────────────────

async def _get_demo_tenant(db: AsyncSession) -> Tenants | None:
    stmt = select(Tenants).where(Tenants.name == DEMO_SHOP_NAME)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def seed_demo_data(db: AsyncSession) -> None:
    """Seeds full demo data for testing. Idempotent — removes old demo data first."""
    f_en = en()
    f_ar = ar()

    # ── 1. Clean old demo data (reverse FK order) ────────────────
    print("🧹 Cleaning old demo data...")
    for model_cls in [
        Notifications,
        Expenses,
        Payments,
        OrderItems,
        Orders,
        WalkInCustomers,
        Books,
        MaterialTransactions,
        Materials,
        Users,
        Tenants,
    ]:
        await db.execute(model_cls.__table__.delete())
    await db.flush()

    # ── 2. Tenant ──────────────────────────────────────────────────
    tenant = Tenants(
        name=DEMO_SHOP_NAME,
        slug="printly-demo",
        address="cairo, egypt",
        phone="+20 100 123 4567",
        email="info@printly.demo",
        is_active=True,
    )
    db.add(tenant)
    await db.flush()
    print(f"🏪 Tenant: {tenant.name}")

    # ── 3. Users: Shop Owner + Staff ──────────────────────────────
    shop_owner = Users(
        tenant_id=tenant.id,
        email=DEMO_SHOP_EMAIL,
        password_hash=hash_password(DEMO_SHOP_PASSWORD),
        full_name="أحمد محمد السعيد",
        phone="+20 100 111 2222",
        role=UserRole.SHOP_OWNER,
        is_active=True,
    )
    db.add(shop_owner)

    staff = Users(
        tenant_id=tenant.id,
        email="staff@printly.demo",
        password_hash=hash_password(DEMO_SHOP_PASSWORD),
        full_name="محمد علي",
        phone="+20 100 333 4444",
        role=UserRole.STAFF,
        is_active=True,
    )
    db.add(staff)
    await db.flush()

    # ── 4. Registered Customers ───────────────────────────────────
    customers: list[Users] = []
    customer_names_ar = [
        "عمرو خالد",
        "سارة أحمد",
        "محمود حسن",
        "نور الدين",
        "فاطمة الزهراء",
        "كريم عادل",
        "هند محمد",
        "يوسف إبراهيم",
    ]
    for i, name in enumerate(customer_names_ar):
        customer = Users(
            email=f"customer{i + 1}@demo.com",
            password_hash=hash_password(DEMO_CUSTOMER_PASSWORD),
            full_name=name,
            phone=f"+20 10{random.randint(10000000, 99999999)}",
            role=UserRole.CUSTOMER,
            is_active=True,
        )
        db.add(customer)
        customers.append(customer)

    await db.flush()
    print(f"👤 Users: 1 owner + 1 staff + {len(customers)} customers")

    # ── 5. Customer-Tenant Links ─────────────────────────────────
    for i, customer in enumerate(customers[:6]):
        link = CustomerTenantLinks(
            tenant_id=tenant.id,
            customer_user_id=customer.id,
            status=LinkStatus.APPROVED if i < 4 else LinkStatus.PENDING,
            requested_at=rand_datetime(60),
            approved_at=rand_datetime(30) if i < 4 else None,
        )
        db.add(link)

    # ── 6. Tenant Members ───────────────────────────────────────
    for customer in customers[:4]:
        member = TenantMembers(
            tenant_id=tenant.id,
            customer_user_id=customer.id,
            display_name=customer.full_name,
            balance=Decimal(str(round(random.uniform(-500, 3000), 2))),
            is_approved=True,
        )
        db.add(member)
    await db.flush()

    # ── 7. Walk-in Customers ──────────────────────────────────────
    walkin_names = [
        "عميل واك إن 1",
        "أبو النور",
        "شركة النور للطباعة",
        "مدرسة المستقبل",
        "شركة الأمل",
        "مكتبة المعرفة",
        "عميل شهري",
        "دار الفكر",
        "مؤسسة الإبداع",
        "مكتبة الأدب",
        "شركة التطور",
        "عميل جديد",
    ]
    walkins: list[WalkInCustomers] = []
    for name in walkin_names[:NUM_WALK_IN]:
        w = WalkInCustomers(
            tenant_id=tenant.id,
            name=name,
            phone=f"+20 10{random.randint(10000000, 99999999)}",
            notes=random.choice(["عميل مميز", "طباعة بالجملة", "فاتورة شهرية", "", "", ""]),
        )
        db.add(w)
        walkins.append(w)
    await db.flush()
    print(f"🚶 Walk-in customers: {len(walkins)}")

    # ── 8. Books ──────────────────────────────────────────────────
    book_titles = [
        ("كتاب الرياضيات - ترم أول", "رياضيات", random.randint(50, 300)),
        ("مذكرة فيزياء الصف الثالث", "فيزياء", random.randint(30, 150)),
        ("ملف شركة النور - تقرير سنوي", "إداري", random.randint(20, 100)),
        ("كتيب التعليمات الداخلية", "إداري", random.randint(10, 50)),
        ("مذكرة لغة عربية", "لغة عربية", random.randint(40, 200)),
        ("ملف طلبات العميل", "أوراق متنوعة", random.randint(5, 30)),
        ("كتاب الكيمياء", "كيمياء", random.randint(60, 250)),
        ("كتاب الأحياء", "أحياء", random.randint(50, 200)),
        ("ملف تخرج - جامعة القاهرة", "أكاديمي", random.randint(80, 400)),
        ("دليل المنتجات - شركة الأمل", "تسويقي", random.randint(15, 80)),
        ("نشاط مدرسة المستقبل", "تعليمي", random.randint(10, 60)),
        ("تقرير مالي - دار الفكر", "مالي", random.randint(20, 100)),
    ]
    books: list[Books] = []
    for title, subject, pages in book_titles:
        b = Books(
            tenant_id=tenant.id,
            title=title,
            subject=subject,
            total_pages=pages,
            created_by=shop_owner.id,
        )
        db.add(b)
        books.append(b)
    await db.flush()
    print(f"📚 Books: {len(books)}")

    # ── 9. Orders + Order Items ──────────────────────────────────
    statuses = list(OrderStatus)
    statuses_weighted = [
        OrderStatus.NEW, OrderStatus.NEW, OrderStatus.PRINTING,
        OrderStatus.PRINTING, OrderStatus.READY, OrderStatus.READY,
        OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED,
        OrderStatus.DELIVERED, OrderStatus.CANCELLED,
    ]

    binding_types = ["none", "staple", "plastic", "metal"]
    all_customers = customers + walkins  # type: ignore

    orders: list[Orders] = []
    for i in range(30):
        status = random.choice(statuses_weighted)
        is_walkin = random.random() < 0.4
        customer_ref = random.choice(walkins if is_walkin else customers)

        order = Orders(
            tenant_id=tenant.id,
            customer_id=None if is_walkin else customer_ref.id,
            walk_in_customer_id=customer_ref.id if is_walkin else None,
            created_by=random.choice([shop_owner.id, staff.id]),
            order_number=f"ORD-2025-{i + 1:04d}",
            status=status,
            total_amount=Decimal("0"),
            paid_amount=Decimal("0"),
            notes=random.choice(["عاجل", "طباعة بالجملة", "", "", "", "عميل مميز", ""]),
            due_date=rand_date(30) if status != OrderStatus.DELIVERED else None,
            completed_at=rand_datetime(20) if status == OrderStatus.DELIVERED else None,
        )
        db.add(order)
        orders.append(order)
    await db.flush()

    # Order items
    for order in orders:
        num_items = random.randint(1, 3)
        order_total = Decimal("0")

        for _ in range(num_items):
            book = random.choice(books)
            copies = random.randint(1, 50)
            pages = book.total_pages
            sides = random.choice([1, 2])

            is_color = random.random() < 0.3
            color_mode = "color" if is_color else "bw"

            binding_type = random.choice(binding_types)
            has_lam = random.random() < 0.2

            unit_price = Decimal(str(round(random.uniform(0.5, 5.0), 2)))
            subtotal = unit_price * Decimal(str(copies))
            order_total += subtotal

            item = OrderItems(
                order_id=order.id,
                book_id=book.id,
                book_title=book.title,
                copies=copies,
                unit_price=unit_price,
                total_pages=pages,
                color_mode=color_mode,
                sides_per_page=sides,
                binding_type=binding_type if binding_type != "none" else None,
                has_lamination=has_lam,
                materials_snapshot=[],
                subtotal=subtotal,
            )
            db.add(item)

        order.total_amount = order_total
        # Partially or fully paid
        if order.status in (OrderStatus.DELIVERED, OrderStatus.READY):
            order.paid_amount = order_total
        elif order.status == OrderStatus.PRINTING:
            order.paid_amount = order_total * Decimal(str(round(random.uniform(0, 0.5), 2)))

    await db.flush()
    print(f"📋 Orders: {len(orders)}")

    # ── 11. Payments ────────────────────────────────────────────
    payment_count = 0
    for order in orders:
        if order.paid_amount > 0:
            num_payments = random.randint(1, 2)
            remaining = order.paid_amount
            for j in range(num_payments):
                amount = remaining if j == num_payments - 1 else remaining / Decimal("2")
                remaining -= amount

                payment = Payments(
                    tenant_id=tenant.id,
                    order_id=order.id,
                    amount=amount,
                    payment_method=random.choice(
                        [PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER, PaymentMethod.MOBILE_WALLET]
                    ),
                    notes="",
                    excess_amount=Decimal("0"),
                    received_by=random.choice([shop_owner.id, staff.id]),
                )
                db.add(payment)
                payment_count += 1
    await db.flush()
    print(f"💳 Payments: {payment_count}")

    # ── 12. Materials ────────────────────────────────────────────
    materials_data = [
        ("ورق A4 أبيض", "ream", Decimal("500"), Decimal("50"), Decimal("45.00")),
        ("ورق A4 ملون", "ream", Decimal("200"), Decimal("30"), Decimal("55.00")),
        ("ورق A3 أبيض", "ream", Decimal("100"), Decimal("20"), Decimal("85.00")),
        ("ورق A3 ملون", "ream", Decimal("80"), Decimal("15"), Decimal("95.00")),
        ("غراء صنفرة", "piece", Decimal("50"), Decimal("10"), Decimal("3.50")),
        ("حبر طابعة HP", "piece", Decimal("20"), Decimal("5"), Decimal("250.00")),
        ("غلاف كرتون أبيض", "sheet", Decimal("300"), Decimal("50"), Decimal("2.00")),
        ("بلاستيك تجليد", "roll", Decimal("15"), Decimal("5"), Decimal("180.00")),
    ]
    materials_list: list[Materials] = []
    for name, unit, stock, min_alert, cost in materials_data:
        m = Materials(
            tenant_id=tenant.id,
            name=name,
            unit=unit,
            current_stock=stock,
            min_stock_alert=min_alert,
            cost_per_unit=cost,
            is_active=True,
        )
        db.add(m)
        materials_list.append(m)
    await db.flush()

    # Material transactions
    for i in range(NUM_TRANSACTIONS):
        mat = random.choice(materials_list)
        tx_type = random.choice(list(MaterialTransactionType))
        qty = Decimal(str(round(random.uniform(5, 50), 1)))
        if tx_type == MaterialTransactionType.CONSUMPTION:
            qty = -qty

        tx = MaterialTransactions(
            tenant_id=tenant.id,
            material_id=mat.id,
            quantity=qty,
            transaction_type=tx_type,
            notes=f"{tx_type.value} - {mat.name}",
            created_by=random.choice([shop_owner.id, staff.id]),
        )
        db.add(tx)

    await db.flush()
    print(f"📦 Materials: {len(materials_list)} + {NUM_TRANSACTIONS} transactions")

    # ── 13. Expenses ──────────────────────────────────────────────
    expense_data = [
        (ExpenseCategory.RENT, "إيجار المحل - يناير", rand_money(3000, 5000)),
        (ExpenseCategory.SALARIES, "مرتب موظف 1", rand_money(3000, 5000)),
        (ExpenseCategory.SALARIES, "مرتب موظف 2", rand_money(2500, 4000)),
        (ExpenseCategory.SALARIES, "مرتب موظف 3", rand_money(2500, 4000)),
        (ExpenseCategory.UTILITIES, "فاتورة كهرباء", rand_money(500, 1500)),
        (ExpenseCategory.UTILITIES, "فاتورة إنترنت", rand_money(300, 800)),
        (ExpenseCategory.SUPPLIES, "شراء ورق A4", rand_money(500, 2000)),
        (ExpenseCategory.SUPPLIES, "شراء حبر", rand_money(300, 1000)),
        (ExpenseCategory.SUPPLIES, "شراء غلافات", rand_money(200, 600)),
        (ExpenseCategory.MAINTENANCE, "صيانة طابعة", rand_money(200, 800)),
        (ExpenseCategory.MAINTENANCE, "صيانة ماكينة تجليد", rand_money(100, 400)),
        (ExpenseCategory.OTHER, "مصاريف متنوعة", rand_money(100, 500)),
    ]
    for cat, desc, amount in expense_data:
        exp = Expenses(
            tenant_id=tenant.id,
            category=cat,
            amount=amount,
            description=desc,
            expense_date=rand_date(45),
            created_by=shop_owner.id,
        )
        db.add(exp)
    await db.flush()
    print(f"📊 Expenses: {len(expense_data)}")

    # ── 15. Notifications ──────────────────────────────────────────
    notif_templates = [
        (NotificationType.ORDER, "طلب جديد", "تم استلام طلب جديد #%s من العميل %s", False),
        (NotificationType.ORDER, "تم بدء الطباعة", "بدأت طباعة الطلب #%s", False),
        (NotificationType.ORDER, "الطلب جاهز", "الطلب #%s جاهز للاستلام", True),
        (NotificationType.PAYMENT, "دفعة مستلمة", "تم استلام دفعة بقيمة %.2f جنيه", False),
        (NotificationType.PAYMENT, "دفعة مؤكدة", "تم تأكيد الدفعة للطلب #%s", True),
        (NotificationType.SYSTEM, "تحديث النظام", "تم تحديث نظام إدارة المطبعة بنجاح", True),
        (NotificationType.ALERT, "تنبيه مخزون", "مخزون %s أقل من الحد الأدنى", False),
    ]
    for i in range(NUM_NOTIFICATIONS):
        tpl = random.choice(notif_templates)
        notif = Notifications(
            tenant_id=tenant.id,
            user_id=random.choice([shop_owner.id, staff.id]),
            title=tpl[1],
            message=tpl[2],
            notification_type=tpl[0],
            is_read=tpl[3],
        )
        db.add(notif)
    await db.flush()
    print(f"🔔 Notifications: {NUM_NOTIFICATIONS}")

    # ── Commit ────────────────────────────────────────────────────
    await db.commit()
    print()
    print("=" * 60)
    print("✅ DEMO SEED COMPLETE!")
    print("=" * 60)
    print()
    print(f"📍 Login: {DEMO_SHOP_EMAIL}")
    print(f"🔑 Password: {DEMO_SHOP_PASSWORD}")
    print("👤 Customer login: customer1@demo.com")
    print(f"🔑 Customer password: {DEMO_CUSTOMER_PASSWORD}")
    print("👥 More customers: customer2@demo.com .. customer8@demo.com")
    print()
