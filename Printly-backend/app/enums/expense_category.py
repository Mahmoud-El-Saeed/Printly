import enum


class ExpenseCategory(str, enum.Enum):
    RENT = "rent"
    SALARIES = "salaries"
    MAINTENANCE = "maintenance"
    UTILITIES = "utilities"
    SUPPLIES = "supplies"
    OTHER = "other"