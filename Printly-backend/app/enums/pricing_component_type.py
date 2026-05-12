import enum


class PricingComponentType(str, enum.Enum):
    PAGE_PRINT = "page_print"
    COVER = "cover"
    BINDING = "binding"
    LAMINATION = "lamination"
    EXTRA_SERVICE = "extra_service"