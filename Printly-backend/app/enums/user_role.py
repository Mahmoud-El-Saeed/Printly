import enum


class UserRole(str, enum.Enum):
    SHOP_OWNER = "shop_owner"
    STAFF = "staff"
    CUSTOMER = "customer"