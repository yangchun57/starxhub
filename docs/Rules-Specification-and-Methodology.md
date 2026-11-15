# Claude Code Rules 规范与方法论

> 版本：v1.0 | 更新日期：2026-10-10

## 目录

1. [概述](#1-概述)
2. [设计原则](#2-设计原则)
3. [文件结构规范](#3-文件结构规范)
4. [内容编写方法论](#4-内容编写方法论)
5. [分类与触发机制](#5-分类与触发机制)
6. [质量标准](#6-质量标准)
7. [示例库](#7-示例库)
8. [常见问题与反模式](#8-常见问题与反模式)

---

## 1. 概述

### 1.1 什么是 Rules

Rules 是 Claude Code 的**上下文注入机制**，通过 Markdown 文件在特定条件下自动向 AI 注入项目规范、编码约定和最佳实践。

### 1.2 Rules 的作用

| 作用 | 说明 |
|------|------|
| **约束行为** | 定义"必须做"和"禁止做"的红线 |
| **统一风格** | 确保代码风格、命名、结构的一致性 |
| **传递知识** | 将项目特有的约定、架构决策传递给 AI |
| **减少歧义** | 通过示例和反例消除理解偏差 |

### 1.3 Rules vs Standards vs Agents

| 类型 | 定位 | 触发方式 | 内容特点 |
|------|------|----------|----------|
| **Rules** | 约束性规范 | 自动（基于 trigger/paths） | 简洁、可执行、有明确边界 |
| **Standards** | 详细参考文档 | 手动引用（`@path`） | 完整、教学性、含背景说明 |
| **Agents** | 角色定义 | 手动调用（`/agent`） | 职责描述、能力边界、工作流程 |

**关键区别**：Rules 是**机器可读的约束**，Standards 是**人类可读的文档**。

---

## 2. 设计原则

### 2.1 核心原则

#### P1: 自包含（Self-Contained）

**Rules 不应依赖外部引用**。Claude Code 的 rules 加载机制不保证解析 `@path` 引用。

```markdown
# ❌ 错误：依赖外部引用
## 详细规范
@.claude/standards/通用开发规范.md#数据库规范

# ✅ 正确：关键规则内联
## 索引规范
- tenant_id 必须作为联合索引的第一列
- 复合索引遵循最左前缀原则
- 单表索引数量不超过 5 个
```

#### P2: 可验证（Verifiable）

**Rules 应包含可机械检查的约束**，而非仅定性描述。

```markdown
# ❌ 模糊：无法验证
- 命名要简洁明了

# ✅ 可验证：有明确规则
- 变量名：camelCase，长度 3-30 字符
- 常量名：UPPER_SNAKE_CASE，必须为编译期常量
- 类名：PascalCase，禁止缩写（除 ID/URL/HTTP 等通用缩写）
```

#### P3: 示例驱动（Example-Driven）

**每条规则至少配一个代码示例**，优先使用"正确 vs 错误"对比。

```markdown
## 事务管理

### ✅ 正确写法
```csharp
public async Task CreateOrder(OrderDto dto)
{
    await _db.Ado.UseTranAsync(async () =>
    {
        await _orderRepo.InsertAsync(dto.ToEntity());
        await _inventoryService.DeductAsync(dto.Items);
    });
}
```

### ❌ 错误写法
```csharp
public async Task CreateOrder(OrderDto dto)
{
    // 没有事务，部分失败会导致数据不一致
    await _orderRepo.InsertAsync(dto.ToEntity());
    await _inventoryService.DeductAsync(dto.Items);
}
```
```

#### P4: 边界明确（Clear Boundaries）

**Rules 应明确适用范围**，避免过度泛化或模糊。

```markdown
# ❌ 模糊：适用范围不清
- 所有查询必须带索引

# ✅ 明确：有具体条件
- 生产环境查询必须走索引
- 开发环境允许全表扫描（仅限 < 1000 行的配置表）
- 报表查询可例外，但需 DBA 审核
```

### 2.2 辅助原则

#### A1: 优先级清晰

当规则冲突时，明确裁决顺序：

```markdown
## 优先级（从高到低）
1. **安全红线**：多租户隔离、SQL 注入防护
2. **数据一致性**：事务、并发控制
3. **性能要求**：索引、查询优化
4. **代码风格**：命名、格式
```

#### A2: 渐进式披露

**核心规则放 rules，详细说明放 standards**：

```markdown
# rules/database.md（简洁版）
## 多租户隔离
- 所有业务表必须包含 tenant_id 字段
- 所有查询必须经过租户过滤器

# standards/数据库规范.md（详细版）
## 多租户隔离实现
### 方案一：全局查询过滤器
...
### 方案二：手动注入
...
### 性能考量
...
```

---

## 3. 文件结构规范

### 3.1 Frontmatter 规范

每个 rule 文件必须包含 YAML frontmatter：

```yaml
---
# 触发方式（二选一）
trigger: always  # 始终加载
# 或
paths:           # 路径匹配时加载
  - "**/Controllers/**/*.cs"
  - "**/Api/**/*.cs"
---
```

#### trigger 类型

| 值 | 说明 | 适用场景 |
|----|------|----------|
| `always` | 始终加载 | 通用规范（Git、工作流、数据库） |
| 省略 | 基于 paths 匹配 | 技术栈特定规范（后端、前端） |

#### paths 匹配规则

```yaml
paths:
  # Glob 模式
  - "**/Controllers/**/*.cs"      # 任意层级的 Controllers 目录
  - "app/routers/**/*.py"         # 特定路径
  - "src/pages/**/*.vue"          # 前端页面
  
  # 多模式组合
  - "**/*.cs"                     # 所有 C# 文件
  - "!**/*.generated.cs"          # 排除生成文件（如支持）
```

### 3.2 内容结构

推荐的内容组织顺序：

```markdown
---
trigger: always
---

# 规范标题

## 铁律（红线）
> 不可违反的硬性约束，放在最前面

1. **第一条红线**：...
2. **第二条红线**：...

## 核心规范
> 主要规则，每条配示例

### 规则分类 1
- 规则描述
- ✅ 正确示例
- ❌ 错误示例

### 规则分类 2
...

## 命名约定
> 集中列出命名规则

| 类型 | 规则 | 示例 |
|------|------|------|
| 类名 | PascalCase | `UserController` |
| 方法名 | camelCase | `getUserById` |

## 边界情况
> 例外和特殊处理

- 当 X 与 Y 冲突时，优先 X
- 例外场景：...

## 详细参考（可选）
> 如需更多细节，参考 @path（但关键规则必须内联）
```

### 3.3 文件命名规范

```
rules/
├── _always/              # 始终加载的规则
│   ├── database.md       # 通用数据库规范
│   ├── git.md            # Git 提交规范
│   └── workflow.md       # 工作流程规范
├── _backend/             # 后端相关（按 paths 触发）
│   ├── backend-api.dotnet.md
│   ├── backend-api.python.md
│   ├── backend-domain.dotnet.md
│   └── ...
└── _frontend/            # 前端相关
    ├── frontend-pages.vue.md
    ├── frontend-state.vue.md
    └── ...
```

**命名规则**：
- 目录名：`_{category}`（下划线前缀表示分类）
- 文件名：`{layer}.{tech}.md`（如 `backend-api.dotnet.md`）
- 全小写，用连字符分隔单词

---

## 4. 内容编写方法论

### 4.1 规则表述公式

**好的规则 = 约束条件 + 验证方式 + 示例**

```markdown
## 分页查询规范

### 约束
- 所有列表接口必须分页，单页上限 100 条
- 必须带 LIMIT 和 OFFSET（或等效机制）

### 验证方式
```sql
-- 检查是否带 LIMIT
EXPLAIN SELECT * FROM users WHERE tenant_id = 1;
```

### ✅ 正确
```csharp
var users = await _db.Queryable<User>()
    .Where(it => it.TenantId == tenantId)
    .ToPageListAsync(pageIndex, pageSize);
```

### ❌ 错误
```csharp
var users = await _db.Queryable<User>()
    .Where(it => it.TenantId == tenantId)
    .ToListAsync();  // 没有分页，可能返回上万条
```
```

### 4.2 铁律（红线）表述

铁律必须满足：
1. **明确性**：无歧义，不需要解释
2. **可检测性**：可通过代码审查或工具检测
3. **后果说明**：违反会导致什么问题

```markdown
## 多租户隔离（红线）

### 铁律
1. **所有业务表必须包含 `tenant_id` 字段**（BIGINT, NOT NULL）
2. **所有查询必须经过租户过滤器**
3. **禁止跨租户数据访问**

### 违反后果
- 数据泄露：A 租户看到 B 租户的数据
- 合规风险：违反 SaaS 多租户隔离的 SLA

### 检测方式
```sql
-- 查找没有 tenant_id 的业务表
SELECT table_name 
FROM information_schema.columns 
WHERE column_name = 'tenant_id' 
GROUP BY table_name 
HAVING COUNT(*) = 0;
```
```

### 4.3 示例编写技巧

#### 技巧 1：使用真实代码，不用伪代码

```markdown
# ❌ 伪代码，无法直接参考
function saveData(data) {
    // 开启事务
    transaction.begin();
    // 保存数据
    database.save(data);
    // 提交事务
    transaction.commit();
}

# ✅ 真实代码，可直接复制
```csharp
public async Task CreateUser(CreateUserRequest request)
{
    await _db.Ado.UseTranAsync(async () =>
    {
        var user = request.ToEntity();
        await _userRepo.InsertAsync(user);
        await _auditLogRepo.InsertAsync(new AuditLog
        {
            Action = "CREATE_USER",
            EntityId = user.Id,
            CreatedAt = DateTime.UtcNow
        });
    });
}
```
```

#### 技巧 2：覆盖常见场景

```markdown
## DTO 映射规范

### 场景 1：创建请求 → 实体
```csharp
// ✅ 使用扩展方法
public static User ToEntity(this CreateUserRequest request)
{
    return new User
    {
        Id = SnowflakeIdGenerator.NewId(),
        Username = request.Username,
        Email = request.Email,
        CreatedAt = DateTime.UtcNow
    };
}

// ❌ 手动逐字段赋值（容易遗漏）
var user = new User();
user.Username = request.Username;
user.Email = request.Email;
// 忘记设置 CreatedAt...
```

### 场景 2：实体 → 响应 DTO
```csharp
// ✅ 使用 Mapster
var response = user.Adapt<UserDto>();

// ❌ 手动映射（重复代码多）
var response = new UserDto
{
    Id = user.Id,
    Username = user.Username,
    // ... 20+ 字段
};
```
```

#### 技巧 3：标注"为什么"

```markdown
## 主键规范

### 规则
- 主键使用雪花 ID（Snowflake ID），类型 `BIGINT`
- **禁止使用自增 ID**

### 为什么？
1. **分布式友好**：多数据库实例不会 ID 冲突
2. **安全性**：不暴露业务数量（自增 ID 暴露了订单量）
3. **迁移友好**：数据合并时不需要重新生成 ID

### 实现
```csharp
public class User : ITenantEntity
{
    [SugarColumn(IsPrimaryKey = true)]
    public long Id { get; set; }  // 雪花 ID
    
    public long TenantId { get; set; }
}
```
```

### 4.4 边界情况处理

**明确规则冲突时的裁决**：

```markdown
## 优先级裁决

当以下规则冲突时，按优先级从高到低执行：

1. **安全红线**（最高）
   - 多租户隔离
   - SQL 注入防护
   - 敏感数据加密

2. **数据一致性**
   - 事务完整性
   - 并发控制

3. **性能要求**
   - 索引优化
   - 查询优化

4. **代码风格**（最低）
   - 命名约定
   - 格式规范

### 示例场景
**场景**：为了性能，想跳过租户过滤器直接查询

**裁决**：❌ 禁止。安全红线 > 性能要求。必须走租户过滤器。
```

---

## 5. 分类与触发机制

### 5.1 分类体系

```
rules/
├── _always/          # 通用规范（始终加载）
│   ├── database.md   # 数据库通用规范
│   ├── git.md        # Git 规范
│   └── workflow.md   # 工作流规范
│
├── _backend/         # 后端规范（按路径触发）
│   ├── backend-api.{tech}.md      # API 层
│   ├── backend-domain.{tech}.md   # 领域层
│   └── backend-infra.{tech}.md    # 基础设施层
│
├── _frontend/        # 前端规范（按路径触发）
│   ├── frontend-pages.{tech}.md   # 页面层
│   ├── frontend-state.{tech}.md   # 状态层
│   └── frontend-components.{tech}.md  # 组件层
│
└── _testing/         # 测试规范（按路径触发）
    ├── test-unit.md
    ├── test-integration.md
    └── test-e2e.md
```

### 5.2 触发策略

#### 策略 1：始终加载（trigger: always）

**适用场景**：
- 所有文件都需要遵守的规范（Git、命名）
- 跨技术栈的通用规范（数据库、安全）

**示例**：
```yaml
---
trigger: always
---
# Git 提交规范
```

#### 策略 2：路径匹配（paths）

**适用场景**：
- 技术栈特定规范（.NET 规则不应用于 Python 项目）
- 层级特定规范（API 层规则不应用于 Service 层）

**示例**：
```yaml
---
paths:
  - "**/Controllers/**/*.cs"
  - "**/Api/**/*.cs"
---
# 后端 API 层规范（.NET）
```

#### 策略 3：组合触发

**适用场景**：
- 多条件同时满足才加载

**示例**（如支持）：
```yaml
---
paths:
  - "app/routers/**/*.py"
# 仅当文件在 app/routers/ 下且为 .py 时加载
---
# FastAPI 路由规范
```

### 5.3 触发粒度控制

**避免过度触发**：

```yaml
# ❌ 过于宽泛：所有 .cs 文件都加载后端规范
paths:
  - "**/*.cs"

# ✅ 精确匹配：仅特定层级
paths:
  - "**/Controllers/**/*.cs"
  - "**/Services/**/*.cs"
  - "**/Models/**/*.cs"
```

**避免遗漏**：

```yaml
# ❌ 可能遗漏：只匹配 Controllers
paths:
  - "**/Controllers/**/*.cs"

# ✅ 覆盖全面：Controllers + Api
paths:
  - "**/Controllers/**/*.cs"
  - "**/Api/**/*.cs"
  - "**/Handlers/**/*.cs"  # 别忘了 CQRS 的 Handler
```

---

## 6. 质量标准

### 6.1 完整性检查清单

每个 rule 文件应满足：

- [ ] **Frontmatter 正确**：trigger 或 paths 至少有一个
- [ ] **铁律前置**：红线规则放在最前面
- [ ] **每条规则有示例**：至少一个 ✅ 正确示例
- [ ] **关键规则内联**：不依赖 `@path` 引用
- [ ] **命名规则集中**：有命名约定表格
- [ ] **边界情况说明**：例外和冲突裁决
- [ ] **可验证性**：规则可通过代码审查或工具检测

### 6.2 可读性检查清单

- [ ] **标题层级清晰**：H1 → H2 → H3，不跳级
- [ ] **列表对齐**：使用有序列表（1. 2. 3.）表示步骤，无序列表表示并列
- [ ] **代码块标注语言**：```csharp、```python、```sql
- [ ] **表格对齐**：列宽一致，内容对齐
- [ ] **重点加粗**：关键约束使用 `**加粗**`

### 6.3 可维护性检查清单

- [ ] **版本标注**：文件头部标注版本号
- [ ] **变更记录**：重大变更在文件末尾记录
- [ ] **责任人明确**：有问题联系谁
- [ ] **关联文档**：相关 standards 文档的链接

### 6.4 质量评分

| 维度 | 权重 | 评分标准 |
|------|------|----------|
| **完整性** | 30% | 覆盖所有关键规则，无重大遗漏 |
| **可执行性** | 25% | 规则明确，AI 可直接遵循 |
| **示例质量** | 20% | 示例真实、覆盖常见场景 |
| **可读性** | 15% | 结构清晰，易于快速查找 |
| **可维护性** | 10% | 易于更新和扩展 |

**及格线**：70 分  
**优秀线**：85 分

---

## 7. 示例库

### 7.1 优秀的 Rule 示例

#### 示例 1：数据库规范（通用型）

```markdown
---
trigger: always
---

# 数据库规范

## 铁律（红线）

### 多租户隔离
1. **所有业务表必须包含 `tenant_id` 字段**（BIGINT, NOT NULL）
2. **所有查询必须经过租户过滤器**
3. **禁止跨租户数据访问**

违反后果：数据泄露，违反 SaaS SLA。

## 核心规范

### 表命名
- 表名：snake_case 复数（`users`, `order_items`）
- 字段名：snake_case（`created_at`, `user_id`）
- 主键：`id`（BIGINT，雪花 ID）
- 外键：`{关联表单数}_id`（`user_id`, `order_id`）

### 索引规范
- `tenant_id` 必须作为联合索引的第一列
- 单表索引数量不超过 5 个
- 避免在低基数列上建索引（如 `status`）

✅ 正确
```sql
-- 复合索引，tenant_id 在前
CREATE INDEX idx_tenant_status ON orders(tenant_id, status);
```

❌ 错误
```sql
-- tenant_id 不在第一列，无法用于租户过滤
CREATE INDEX idx_status_tenant ON orders(status, tenant_id);
```

### 迁移管理
- 版本化脚本：`sql/migrations/V{三位序号}__{描述}.sql`
- 只增不改：已执行的迁移禁止修改
- 幂等优先：使用 `IF NOT EXISTS`

✅ 正确
```sql
-- V001__create_users_table.sql
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    username VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
```

## 边界情况

### 例外场景
- 配置表（< 1000 行）可省略 `tenant_id`
- 报表查询可全表扫描，但需 DBA 审核

### 优先级裁决
当性能与多租户隔离冲突时，**优先保证隔离**。
```

#### 示例 2：后端 API 规范（技术栈特定）

```markdown
---
paths:
  - "**/Controllers/**/*.cs"
  - "**/Api/**/*.cs"
---

# 后端 API 层规范（.NET 8）

## 技术栈
- ASP.NET Core Web API + SqlSugar 5.x + JWT Bearer
- 统一返回：`ApiResult<T>` / `PageResult<T>`

## 铁律

1. **所有 Controller 必须使用 `[ApiController]` + `[Route("api/[controller]")]`**
2. **禁止 Controller 内含业务逻辑**，一律委托 Service 层
3. **认证**：`[Authorize]` 或 `[Authorize(Roles = "admin")]`
4. **响应**：统一使用 `ApiResult<T>.Success(data)` / `ApiResult<T>.Fail(message, code)`

## Controller 结构

### 标准模板

✅ 正确
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UserController> _logger;

    // 构造函数注入
    public UserController(IUserService userService, ILogger<UserController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    [HttpGet("{id}")]
    public async Task<ApiResult<UserDto>> GetById(long id)
    {
        var user = await _userService.GetByIdAsync(id);
        return ApiResult<UserDto>.Success(user);
    }

    [HttpPost]
    public async Task<ApiResult<long>> Create([FromBody] CreateUserRequest request)
    {
        var id = await _userService.CreateAsync(request);
        return ApiResult<long>.Success(id);
    }
}
```

❌ 错误
```csharp
// 缺少 [ApiController] 和 [Route]
public class UserController
{
    [HttpGet]
    public async Task<List<User>> GetAll()
    {
        // 直接在 Controller 写业务逻辑
        var users = await _db.Queryable<User>().ToListAsync();
        return users;
    }
}
```

### 参数来源
- `[FromQuery]`：查询参数（分页、筛选）
- `[FromBody]`：请求体（创建、更新）
- `[FromRoute]`：路由参数（ID）
- `[FromForm]`：表单提交（文件上传）

## 命名约定

| 类型 | 规则 | 示例 |
|------|------|------|
| Controller | `{Resource}Controller` | `UserController`, `OrderController` |
| Action | HTTP 动词 + 资源 | `GetList`, `Create`, `Update`, `Delete` |
| DTO | `{Resource}Dto` | `UserDto`, `OrderDto` |
| Request | `{Resource}{Action}Request` | `CreateUserRequest`, `QueryOrderRequest` |

## 错误处理

### 业务异常
```csharp
// ✅ 抛出自定义异常，由全局过滤器捕获
throw new BusinessException("用户名已存在");

// ❌ 直接返回错误响应
return BadRequest(new { message = "用户名已存在" });
```

### 全局异常过滤器
```csharp
// Startup.cs
services.AddMvc(options =>
{
    options.Filters.Add<GlobalExceptionFilter>();
});

// GlobalExceptionFilter.cs
public class GlobalExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        if (context.Exception is BusinessException biz)
        {
            context.Result = new JsonResult(ApiResult.Fail(biz.Message));
            context.HttpContext.Response.StatusCode = 200; // 业务错误仍返回 200
        }
    }
}
```

## 边界情况

### 例外场景
- 健康检查接口（`/health`）可省略 `[Authorize]`
- 文件下载可直接返回 `FileStreamResult`，不包装 `ApiResult`

### 优先级裁决
当 RESTful 规范与项目约定冲突时，**优先遵循项目约定**（保持一致性）。
```

### 7.2 反模式示例

#### 反模式 1：过度依赖外部引用

```markdown
# ❌ 反模式
## 详细规范
@.claude/standards/通用开发规范.md#数据库规范

# 问题
- Claude Code 可能不解析 @ 引用
- 关键规则没有内联，AI 无法获取

# ✅ 改进
## 索引规范（内联关键规则）
- tenant_id 必须作为联合索引的第一列
- 单表索引数量不超过 5 个

如需更多细节，参考 @.claude/standards/通用开发规范.md
```

#### 反模式 2：只有文字描述，没有代码示例

```markdown
# ❌ 反模式
## 事务管理
- 使用事务保证一致性
- 失败时回滚

# 问题
- 没有具体代码，AI 不知道怎么写
- 不同 ORM 语法不同，容易写错

# ✅ 改进
## 事务管理
使用 SqlSugar 的事务 API：

```csharp
await _db.Ado.UseTranAsync(async () =>
{
    await _orderRepo.InsertAsync(order);
    await _inventoryService.DeductAsync(items);
});
```
```

#### 反模式 3：规则过于宽泛

```markdown
# ❌ 反模式
## 性能优化
- 查询要快

# 问题
- 没有具体约束，无法执行
- AI 不知道"快"的标准

# ✅ 改进
## 查询性能
- 单次查询返回行数不超过 1000（超过必须分页）
- 避免 SELECT *，只查需要的字段
- 关联查询不超过 3 张表（超过考虑冗余字段）
```

---

## 8. 常见问题与反模式

### 8.1 编写阶段常见问题

#### Q1: Rules 应该多详细？

**A**: Rules 是**约束性规范**，不是教程。遵循"80/20 法则"：
- 80% 的场景：Rules 中有明确规则 + 示例
- 20% 的边界情况：指向 Standards 文档

#### Q2: 同一个规则在多个 rules 文件中重复，算冗余吗？

**A**: **不算**。Rules 的设计原则是"自包含"，宁可重复也要保证每个文件独立可用。

```markdown
# rules/database.md
- tenant_id 必须作为联合索引第一列

# rules/backend-infra.dotnet.md
- tenant_id 必须作为联合索引第一列

# 这是合理的重复，因为两个文件可能独立加载
```

#### Q3: 如何处理技术栈冲突？

**A**: 使用 `paths` 精确匹配，避免冲突：

```yaml
# ✅ .NET 规则只匹配 .cs 文件
paths:
  - "**/*.cs"

# ✅ Python 规则只匹配 .py 文件
paths:
  - "**/*.py"
```

### 8.2 维护阶段常见问题

#### Q1: 如何更新 rules 而不破坏现有项目？

**A**: 遵循"只增不改"原则：
1. 新增规则：直接添加
2. 修改规则：标注版本号和变更说明
3. 删除规则：先标注"已废弃"，下个版本再删除

#### Q2: 如何验证 rules 是否生效？

**A**: 
1. **人工检查**：让 AI 生成代码，检查是否符合 rules
2. **自动化检查**：编写脚本扫描代码库，检查是否违反 rules
3. **A/B 测试**：对比有无 rules 时 AI 生成代码的质量

### 8.3 反模式清单

| 反模式 | 问题 | 改进方案 |
|--------|------|----------|
| **过度依赖引用** | AI 无法获取关键规则 | 关键规则内联，引用仅作为补充 |
| **只有文字无示例** | AI 不知道具体怎么写 | 每条规则至少一个代码示例 |
| **规则过于宽泛** | 无法执行和验证 | 量化约束（如"不超过 5 个索引"） |
| **缺少边界说明** | 规则冲突时无法裁决 | 明确优先级和例外场景 |
| **铁律后置** | 重要规则被忽略 | 红线规则放在最前面 |
| **示例用伪代码** | 无法直接参考 | 使用真实可运行的代码 |

---

## 附录

### A. 快速参考卡片

#### Rule 文件模板

```markdown
---
trigger: always  # 或 paths: [...]
---

# {规范标题}

## 铁律（红线）
1. **第一条红线**：...
2. **第二条红线**：...

## 核心规范

### {规则分类 1}
- 规则描述

✅ 正确
```{lang}
// 代码示例
```

❌ 错误
```{lang}
// 反例
```

## 命名约定

| 类型 | 规则 | 示例 |
|------|------|------|
| ... | ... | ... |

## 边界情况
- 例外场景：...
- 优先级裁决：...
```

#### 质量检查清单

- [ ] Frontmatter 正确
- [ ] 铁律前置
- [ ] 每条规则有示例
- [ ] 关键规则内联
- [ ] 命名规则集中
- [ ] 边界情况说明
- [ ] 可验证性

### B. 相关资源

- [Claude Code 官方文档](https://docs.anthropic.com/en/docs/claude-code)
- [项目 Standards 目录](../templates/.claude/standards/)
- [项目 Agents 目录](../templates/.claude/agents/)

### C. 变更记录

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v1.0 | 2026-10-10 | 初始版本 |

---

**文档维护者**：开发团队  
**联系方式**：请参考项目 README
