import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    SHOP_OWNER = "shop_owner"
    STAFF = "staff"
    CUSTOMER = "customer" 