from .base_crud import BaseCRUD
from app.models import WalkInCustomers


class WalkInCustomerCRUD(BaseCRUD[WalkInCustomers]):
    model = WalkInCustomers