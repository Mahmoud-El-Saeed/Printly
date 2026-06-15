from app.db.base_crud import BaseCRUD
from app.models.invoices import Invoices


class InvoiceCRUD(BaseCRUD[Invoices]):
    model = Invoices
