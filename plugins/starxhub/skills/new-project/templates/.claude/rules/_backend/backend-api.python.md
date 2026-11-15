---
paths:
  - "app/routers/**/*.py"
  - "app/api/**/*.py"
---

# 后端 API 层规范（Python FastAPI）

## 技术栈
- FastAPI + Pydantic v2 + SQLAlchemy 2.0
- 统一返回: RESTful 业务错误 raise HTTPException

## 铁律

1. **所有 handler 必须有 Pydantic v2 入参 model**（禁止裸 dict）
2. **禁止 handler 内含业务逻辑**，一律委托 service 层
3. **认证依赖注入**: `get_current_user` from `app.core.auth`
4. **分页统一**: `Page[T]` 泛型响应（items/total/page/size）

**违反后果**：入参无校验导致脏数据入库，业务逻辑散落难以测试。

## 路由结构

### 标准模板

✅ 正确
```python
# app/routers/user.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.auth import get_current_user
from app.core.database import get_db
from app.schemas.user import UserIn, UserOut, UserQuery
from app.services.user_service import UserService
from app.core.pagination import Page

router = APIRouter(prefix="/users", tags=["用户管理"])

@router.get("", response_model=Page[UserOut])
async def list_users(
    query: UserQuery = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """用户列表（分页）"""
    service = UserService(db)
    return await service.list_users(query)

@router.post("", response_model=UserOut, status_code=201)
async def create_user(
    data: UserIn,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """创建用户"""
    service = UserService(db)
    return await service.create_user(data)

@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """获取单个用户"""
    service = UserService(db)
    user = await service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user
```

❌ 错误
```python
# ❌ 裸 dict 入参，无校验
@router.post("")
async def create_user(data: dict):
    username = data["username"]  # KeyError 风险
    ...

# ❌ handler 内含业务逻辑
@router.post("")
async def create_user(data: UserIn, db: AsyncSession = Depends(get_db)):
    # 直接在 handler 写业务逻辑
    user = User(**data.dict())
    db.add(user)
    await db.commit()
    return user

# ❌ 缺少认证依赖
@router.get("")
async def list_users(db: AsyncSession = Depends(get_db)):
    ...
```

## 路由组织

### 规范
- 每个业务域一个 `app/routers/<domain>.py`
- router 级别挂载认证: `dependencies=[Depends(get_current_user)]`
- 所有路由在 `app/routers/__init__.py` 集中 include_router

✅ 正确
```python
# app/routers/__init__.py
from fastapi import APIRouter
from app.routers import user, order, auth

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(user.router)
api_router.include_router(order.router)

# main.py
from app.routers import api_router
app.include_router(api_router)
```

❌ 错误
```python
# ❌ 路由散落在多个文件，没有集中注册
# main.py
from app.routers.user import router as user_router
from app.routers.order import router as order_router
app.include_router(user_router)  # 没有统一前缀
app.include_router(order_router)
```

## Schema 定义

### 规范
- 入参: `XxxIn`（如 `UserIn`）
- 出参: `XxxOut`（如 `UserOut`）
- 查询: `XxxQuery`（如 `UserQuery`）
- 使用 Pydantic v2 的 `model_config`

✅ 正确
```python
# app/schemas/user.py
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class UserIn(BaseModel):
    """创建用户入参"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "username": "testuser",
                    "email": "test@example.com",
                    "password": "password123"
                }
            ]
        }
    }

class UserOut(BaseModel):
    """用户出参"""
    id: int
    username: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}

class UserQuery(BaseModel):
    """用户查询参数"""
    page: int = Field(default=1, ge=1)
    size: int = Field(default=10, ge=1, le=100)
    keyword: str | None = None
```

❌ 错误
```python
# ❌ 使用 Pydantic v1 语法
class UserIn(BaseModel):
    username: str

    class Config:
        orm_mode = True  # v1 语法

# ❌ 没有校验规则
class UserIn(BaseModel):
    username: str  # 没有长度限制
    email: str     # 没有邮箱格式校验
```

## 命名约定

| 类型 | 规则 | 示例 |
|------|------|------|
| 路由函数 | `{action}_{resource}` | `create_user`, `list_orders` |
| 文件 | snake_case | `user.py`, `order.py` |
| Schema In | `{Resource}In` | `UserIn`, `OrderIn` |
| Schema Out | `{Resource}Out` | `UserOut`, `OrderOut` |
| Schema Query | `{Resource}Query` | `UserQuery`, `OrderQuery` |

## 错误处理

### 状态码规范

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 400 | 参数非法 | 校验失败、业务规则不满足 |
| 401 | 未登录 | Token 缺失或过期 |
| 403 | 无权限 | 已登录但无权限 |
| 404 | 不存在 | 资源不存在 |
| 409 | 冲突 | 唯一约束冲突（如用户名已存在） |
| 500 | 系统异常 | 未捕获的异常 |

✅ 正确
```python
# 业务异常
@router.get("/{user_id}")
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    service = UserService(db)
    user = await service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user

# 唯一约束冲突
@router.post("", status_code=201)
async def create_user(data: UserIn, db: AsyncSession = Depends(get_db)):
    service = UserService(db)
    try:
        return await service.create_user(data)
    except IntegrityError:
        raise HTTPException(status_code=409, detail="用户名已存在")
```

❌ 错误
```python
# ❌ 所有错误都返回 200
@router.get("/{user_id}")
async def get_user(user_id: int):
    user = await get_user_from_db(user_id)
    if not user:
        return {"code": 404, "message": "用户不存在"}  # ❌ HTTP 状态码仍为 200

# ❌ 使用 500 表示业务错误
@router.post("")
async def create_user(data: UserIn):
    if await user_exists(data.username):
        raise HTTPException(status_code=500, detail="用户名已存在")  # ❌ 应该是 409
```

## 分页规范

### 统一分页响应

```python
# app/core/pagination.py
from typing import Generic, TypeVar, Sequence
from pydantic import BaseModel

T = TypeVar("T")

class Page(BaseModel, Generic[T]):
    """统一分页响应"""
    items: Sequence[T]
    total: int
    page: int
    size: int
```

✅ 正确
```python
@router.get("", response_model=Page[UserOut])
async def list_users(
    query: UserQuery = Depends(),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    return await service.list_users(query)
    # 返回: {"items": [...], "total": 100, "page": 1, "size": 10}
```

## 边界情况

### 例外场景
- 健康检查接口（`/health`）可省略认证
- 文件下载返回 `FileResponse`，不使用 `Page` 包装
- WebSocket 接口不使用 RESTful 规范

### 优先级裁决
当 FastAPI 默认行为与项目约定冲突时，**优先遵循项目约定**。

## 详细规范
如需更多细节，参考 @.claude/standards/topics/Python后台开发规范_v0.1/06-6.-API-设计规范.md
