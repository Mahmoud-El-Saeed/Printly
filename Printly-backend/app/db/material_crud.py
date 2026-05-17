from .base_crud import BaseCRUD
from app.models import Materials, MaterialTransactions


class MaterialCRUD(BaseCRUD[Materials]):
    def __init__(self):
        super().__init__(Materials)


class MaterialTransactionCRUD(BaseCRUD[MaterialTransactions]):
    def __init__(self):
        super().__init__(MaterialTransactions)
