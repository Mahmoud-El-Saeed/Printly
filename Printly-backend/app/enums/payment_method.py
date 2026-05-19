import enum


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    MOBILE_WALLET = "mobile_wallet"
    BALANCE = "balance"
    OTHER = "other"