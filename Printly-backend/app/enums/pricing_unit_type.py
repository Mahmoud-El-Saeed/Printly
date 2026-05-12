import enum


class PricingUnitType(str, enum.Enum):
    PER_PAGE = "per_page"
    PER_UNIT = "per_unit"