---
paths:
  - "app/services/**/*.py"
  - "app/domain/**/*.py"
---

# 后端领域层规范（Python FastAPI）

## 分层职责

| 层级 | 职责 | 包含内容 | 禁止内容 |
|------|------|----------|----------|
| **services/** | 业务逻辑、事务编排、第三方封装 | 业务方法、事务管理 | Request/Response 对象 |
| **models/** | 表结构与常量定义 | SQLAlchemy ORM 实体 | 业务方法 |
| **schemas/** | DTO 定义与校验规则 | Pydantic 模型 | 业务逻辑 |

## 铁律

1. **禁止 Service 层依赖 FastAPI 的 Request/Response 对象**
2. **禁止 Model 层包含业务方法**（纯数据映射）
3. **禁止 Schema 层包含业务逻辑**（纯校验规则）
4. **第三方 SDK 必须封装为 services/ 下的统一客户端模块**

**违反后果**：Service 层与 HTTP 框架耦合，无法在 Celery 任务或脚本中复用。

## 依赖方向

```
api → services → models
         ↓
      schemas
```

**严格单向，禁止反向依赖。**

✅ 正确
```python
# services/user_service.py
# Service 只依赖 models 和 schemas
from app.models.user import User
from app.schemas.user import UserIn, UserOut
from sqlalchemy.ext.asyncio import AsyncSession

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_user(self, data: UserIn) -> UserOut:
        user = User(**data.model_dump())
        self.db.add(user)
        await self.db.commit()
        return UserOut.model_validate(user)
```

❌ 错误
```python
# ❌ Service 依赖 FastAPI 的 Request
from fastapi import Request

class UserService:
    def __init__(self, request: Request):  # ❌
        self.request = request
    
    async def create_user(self):
        data = await self.request.json()  # ❌
        ...

# ❌ Model 包含业务方法
class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str]
    
    def can_login(self) -> bool:  # ❌
        return bool(self.username)
```

## Service 层规范

### 标准结构

✅ 正确
```python
# app/services/user_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.schemas.user import UserIn, UserOut, UserQuery
from app.core.exceptions import BusinessException
from app.core.pagination import paginate

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_user(self, user_id: int) -> UserOut | None:
        """获取单个用户"""
        user = await self.db.get(User, user_id)
        if not user:
            return None
        return UserOut.model_validate(user)
    
    async def list_users(self, query: UserQuery) -> list[UserOut]:
        """用户列表（分页）"""
        stmt = select(User)
        if query.keyword:
            stmt = stmt.where(User.username.contains(query.keyword))
        return await paginate(self.db, stmt, query.page, query.size)
    
    async def create_user(self, data: UserIn) -> UserOut:
        """创建用户"""
        # 业务验证
        stmt = select(User).where(User.username == data.username)
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            raise BusinessException("用户名已存在")
        
        # 创建实体
        user = User(**data.model_dump())
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return UserOut.model_validate(user)
```

❌ 错误
```python
# ❌ Service 函数散落在多个文件，没有统一结构
# app/user_helpers.py
async def get_user(db, user_id):
    ...

# app/user_logic.py
async def create_user(db, data):
    ...

# ❌ 直接在 router 中写业务逻辑
@router.post("")
async def create_user(data: UserIn, db: AsyncSession = Depends(get_db)):
    user = User(**data.model_dump())
    db.add(user)
    await db.commit()
    return user
```

### 事务管理

✅ 正确
```python
# 方式 1：使用 db.begin()
async def create_order(self, data: OrderIn) -> OrderOut:
    async with self.db.begin():
        order = Order(**data.model_dump())
        self.db.add(order)
        await self.db.flush()
        
        # 扣减库存
        for item in data.items:
            success = await self._deduct_inventory(item)
            if not success:
                raise BusinessException(f"商品 {item.product_id} 库存不足")
        
        return OrderOut.model_validate(order)

# 方式 2：使用装饰器
from app.core.transaction import transactional

@transactional
async def create_order(self, data: OrderIn) -> OrderOut:
    ...
```

❌ 错误
```python
# ❌ 手动管理事务，容易忘记 commit/rollback
async def create_order(self, data: OrderIn):
    order = Order(**data.model_dump())
    self.db.add(order)
    await self.db.commit()  # 如果后面失败，已经提交了
    
    for item in data.items:
        await self._deduct_inventory(item)  # 失败时订单已提交
```

## 第三方 SDK 封装

### 规范
第三方 SDK（微信支付、阿里云 OSS 等）必须封装为 services/ 下的统一客户端模块。

✅ 正确
```python
# app/services/wechat_pay_client.py
class WechatPayClient:
    """微信支付客户端封装"""
    
    def __init__(self, config: WechatPayConfig):
        self.config = config
    
    async def create_order(self, order_no: str, amount: int) -> dict:
        """创建支付订单"""
        ...
    
    async def query_order(self, order_no: str) -> dict:
        """查询订单状态"""
        ...

# 使用
@router.post("/pay")
async def create_payment(order_no: str, db: AsyncSession = Depends(get_db)):
    client = WechatPayClient(settings.WECHAT_PAY_CONFIG)
    result = await client.create_order(order_no, amount=100)
    return result
```

❌ 错误
```python
# ❌ 直接在 Service 中调用第三方 SDK
from wechatpay import WechatPay

class OrderService:
    async def create_payment(self, order_no: str):
        pay = WechatPay(app_id="xxx", ...)  # ❌ 配置散落
        result = pay.create_order(...)
```

## Schema 层规范

### 规范
- 入参: `XxxIn`（如 `UserIn`）
- 出参: `XxxOut`（如 `UserOut`）
- 使用 Pydantic v2 的 `model_config`

✅ 正确
```python
# app/schemas/user.py
from pydantic import BaseModel, EmailStr, Field

class UserIn(BaseModel):
    """创建用户入参"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserOut(BaseModel):
    """用户出参"""
    id: int
    username: str
    email: str
    
    model_config = {"from_attributes": True}
```

❌ 错误
```python
# ❌ Schema 包含业务逻辑
class UserIn(BaseModel):
    username: str
    
    def validate_username(self):
        if self.username in ["admin", "root"]:
            raise ValueError("用户名不允许")  # ❌ 应该在 Service 层验证
```

## 命名约定

| 类型 | 规则 | 示例 |
|------|------|------|
| Service 文件 | `{resource}_service.py` | `user_service.py`, `order_service.py` |
| Service 函数 | `{action}_{resource}` | `create_user`, `get_user_by_id` |
| Model 文件 | `{resource}.py` | `user.py`, `order.py` |
| Schema 文件 | `{resource}.py`（同目录） | `user.py`, `order.py` |

## 边界情况

### 例外场景
- 简单 CRUD 可使用基类 Service 减少重复代码
- 跨 Service 调用时，通过构造函数注入 db session，不注入其他 Service

### 优先级裁决
当性能优化需要跨层调用时，**优先保证分层清晰**，可通过 CQRS 模式解决。

## 详细规范
如需更多细节，参考 @.claude/standards/topics/Python后台开发规范_v0.1/05-5.-分层职责规范.md
