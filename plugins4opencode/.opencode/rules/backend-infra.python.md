# 后端基础设施层规范（Python FastAPI）

## 数据库连接

### 技术选型
- 使用 SQLAlchemy 2.x 声明式: `DeclarativeBase` + `Mapped` + `mapped_column`
- 会话管理: `get_db()` 依赖注入，禁止手动创建 Session
- 配置: `expire_on_commit=False`，避免提交后隐式再查询

### ✅ 正确示例
```python
# app/core/database.py
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # 避免提交后隐式再查询
)

class Base(DeclarativeBase):
    pass

async def get_db():
    """FastAPI 依赖注入：数据库会话"""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
```

### ❌ 错误示例
```python
# ❌ 手动创建 Session
session = AsyncSession(engine)
await session.execute(...)

# ❌ expire_on_commit=True（默认值），提交后再访问字段会触发隐式查询
async_session = async_sessionmaker(engine, class_=AsyncSession)
# user = await session.get(User, 1)
# await session.commit()
# print(user.username)  # ❌ 触发隐查询，可能报错

# ❌ 没有 pool_recycle，长时间空闲连接会断开
engine = create_async_engine(settings.DATABASE_URL)
```

## 模型定义

### 规范
- 主键: 雪花 ID（Snowflake ID），类型 `BigInteger`，禁止自增
- 公共字段: 通过 Mixin 复用（`TimestampMixin`, `SnowflakeIdMixin`）
- 表名: snake_case 单数（`user`, `order_item`）
- 字段: snake_case（`created_at`, `user_id`）

### Mixin 定义

```python
# app/core/mixins.py
from datetime import datetime
from sqlalchemy import BigInteger, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.snowflake import generate_snowflake_id

class SnowflakeIdMixin:
    """雪花 ID 主键"""
    id: Mapped[int] = mapped_column(
        BigInteger, 
        primary_key=True, 
        default=generate_snowflake_id
    )

class TimestampMixin:
    """时间戳字段"""
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime, 
        onupdate=func.now()
    )

class SoftDeleteMixin:
    """软删除字段"""
    is_deleted: Mapped[bool] = mapped_column(default=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
```

### ✅ 正确示例
```python
# app/models/user.py
from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.core.mixins import SnowflakeIdMixin, TimestampMixin, SoftDeleteMixin

class User(SnowflakeIdMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "users"
    
    username: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(100), nullable=False)
    
```

### ❌ 错误示例
```python
# ❌ 使用自增 ID
class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

# ❌ 每个模型重复定义公共字段
class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(...)  # ❌ 应该用 Mixin
    updated_at: Mapped[datetime] = mapped_column(...)

# ❌ 表名用复数
class User(Base):
    __tablename__ = "users"  # ❌ 应该是 "user"（snake_case 单数）
```

## 迁移管理

### 规范
- 版本化脚本: `sql/migrations/V{三位序号}__{描述}.sql`
- 只增不改，幂等优先（`IF NOT EXISTS`）
- 使用 Alembic 管理迁移（可选）

### ✅ 正确示例
```sql
-- sql/migrations/V001__create_users_table.sql
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE
);


-- sql/migrations/V002__add_user_status.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS status INT DEFAULT 1;
```

### ❌ 错误示例
```sql
-- ❌ 没有 IF NOT EXISTS
CREATE TABLE users (
    id BIGINT PRIMARY KEY
);

-- ❌ 修改已执行的迁移
-- V001 已执行，不能修改，应新增 V003
```

## 雪花 ID 生成

### 规范
```python
# app/core/snowflake.py
import time

class SnowflakeGenerator:
    def __init__(self, worker_id: int = 0):
        self.worker_id = worker_id
        self.last_timestamp = -1
        self.sequence = 0
    
    def generate(self) -> int:
        timestamp = int(time.time() * 1000)
        if timestamp == self.last_timestamp:
            self.sequence = (self.sequence + 1) & 0xFFF
            if self.sequence == 0:
                while int(time.time() * 1000) <= self.last_timestamp:
                    pass
                timestamp = int(time.time() * 1000)
        else:
            self.sequence = 0
        
        self.last_timestamp = timestamp
        return (timestamp << 22) | (self.worker_id << 12) | self.sequence

_generator = SnowflakeGenerator(worker_id=1)

def generate_snowflake_id() -> int:
    return _generator.generate()
```

## 命名约定

| 类型 | 规则 | 示例 |
|------|------|------|
| 模型文件 | `{resource}.py` | `user.py`, `order.py` |
| Mixin 文件 | `mixins.py` | `app/core/mixins.py` |
| 迁移文件 | `V{序号}__{描述}.sql` | `V001__create_users_table.sql` |

## 边界情况

### 例外场景
- 关联表（如 `user_roles`）可使用复合主键，不使用雪花 ID
- 字典表/配置表可省略软删除字段

### 优先级裁决

## 详细规范
如需更多细节，参考 @.claude/standards/topics/Python后台开发规范_v0.1/04-4.-数据库与-ORM-规范.md
