"""通用 DTO：Page / PageQuery / CamelModel。"""
from typing import Generic, List, TypeVar

from pydantic import BaseModel, ConfigDict, field_validator

T = TypeVar("T")


def _to_camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


class CamelModel(BaseModel):
    """出参基类：后端 snake_case 字段 → 响应 camelCase。"""

    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True, from_attributes=True)


class SnowflakeIdModel(CamelModel):
    """雪花 ID 出参基类：把 id / *Id 字段序列化为字符串，防前端精度丢失。

    业务出参按需继承，或直接用 snowflake_id_to_str 校验器标注具体字段。
    """

    @field_validator("id", check_fields=False, mode="before")
    @classmethod
    def _id_to_str(cls, v):
        return str(v) if v is not None else v


def snowflake_id_to_str(v):
    """字段级校验器：雪花 ID → 字符串。用法：

        class UserOut(CamelModel):
            id: str
            _norm = field_validator("id", mode="before")(snowflake_id_to_str)
    """
    return str(v) if v is not None else v


class Page(BaseModel, Generic[T]):
    """统一分页信封（规范 6.2）：items / total / page / size。"""

    items: List[T]
    total: int
    page: int
    size: int


class PageQuery(BaseModel):
    page: int = 1
    size: int = 20
