import enum


class MaterialTransactionType(str, enum.Enum):
    RESTOCK = "restock"
    CONSUMPTION = "consumption"
    ADJUSTMENT = "adjustment"
    RETURN = "return"