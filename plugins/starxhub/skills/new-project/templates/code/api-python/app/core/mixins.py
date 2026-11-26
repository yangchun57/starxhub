"""模型公共 Mixin：雪花 ID 主键、时间戳、软删除。

业务模型继承这些 Mixin 复用公共字段，避免每个模型重复定义。
"""
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.snowflake import generate_snowflake_id


class SnowflakeIdMixin:
    """雪花 ID 主键：19 位，禁止自增，创建时由生成器赋值。"""

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        default=generate_snowflake_id,
    )


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime, onupdate=func.now(), nullable=True
    )


class SoftDeleteMixin:
    is_deleted: Mapped[bool] = mapped_column(default=False, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
