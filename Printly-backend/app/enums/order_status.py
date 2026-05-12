import enum


class OrderStatus(str, enum.Enum):
    NEW = "new"
    PRINTING = "printing"
    READY = "ready"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"