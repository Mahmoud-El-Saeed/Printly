from .base_crud import BaseCRUD
from app.models import RefreshTokens


class RefreshCRUD(BaseCRUD[RefreshTokens]):
    model = RefreshTokens
