from .base_crud import BaseCRUD
from app.models import Materials, MaterialTransactions


class MaterialCRUD(BaseCRUD[Materials]):
    model = Materials


class MaterialTransactionCRUD(BaseCRUD[MaterialTransactions]):
    model = MaterialTransactions
