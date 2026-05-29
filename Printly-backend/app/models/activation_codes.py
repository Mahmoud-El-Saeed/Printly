from __future__ import annotations
from datetime import datetime
from .base import Base, generate_uuid
from sqlalchemy import String, ForeignKey, Index, DateTime, func, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid


class ActivationCodes(Base):
    __tablename__ = "activation_codes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("subscription_plans.id", ondelete="CASCADE"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    max_uses: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")
    used_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="true"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    plan: Mapped["SubscriptionPlans"] = relationship("SubscriptionPlans")

    __table_args__ = (
        Index("ix_activation_codes_plan_id", "plan_id"),
        Index("ix_activation_codes_is_active", "is_active"),
    )
