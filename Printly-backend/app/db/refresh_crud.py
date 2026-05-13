from .base_crud import BaseCRUD
from app.models import RefreshTokens


class RefreshCRUD(BaseCRUD[RefreshTokens]):
    def __init__(self):
        super().__init__(RefreshTokens)
