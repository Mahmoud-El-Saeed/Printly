from .base_crud import BaseCRUD
from app.models import WalkInCustomers


class WalkInCustomerCRUD(BaseCRUD):
    def __init__(self):
        super().__init__(WalkInCustomers)