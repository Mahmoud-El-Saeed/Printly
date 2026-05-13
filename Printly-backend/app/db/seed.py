"""Default subscription plans — edit this file when you need to change/add plans."""

DEFAULT_PLANS = [
    {
        "name": "Free",
        "price_monthly": 0,
        "max_users": 1,
        "max_customers": 20,
        "features": {
            "orders": True,
            "materials": True,
            "pricing": True,
            "walk_in_customers": True,
            "invoices": False,
            "reports": False,
            "api": False,
        },
        "is_active": True,
    },
    {
        "name": "Basic",
        "price_monthly": 500,
        "max_users": 3,
        "max_customers": 50,
        "features": {
            "orders": True,
            "materials": True,
            "pricing": True,
            "walk_in_customers": True,
            "invoices": True,
            "reports": True,
            "api": False,
        },
        "is_active": True,
    },
    {
        "name": "Pro",
        "price_monthly": 1000,
        "max_users": 10,
        "max_customers": 500,
        "features": {
            "orders": True,
            "materials": True,
            "pricing": True,
            "walk_in_customers": True,
            "invoices": True,
            "reports": True,
            "api": True,
        },
        "is_active": True,
    },
]