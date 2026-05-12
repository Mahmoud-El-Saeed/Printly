import enum


class NotificationType(str, enum.Enum):
    ORDER = "order"
    PAYMENT = "payment"
    SYSTEM = "system"
    ALERT = "alert"