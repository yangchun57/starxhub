---
paths:
  - "**/Model/**/*.cs"
  - "**/Entities/**/*.cs"
  - "**/sql/migrations/**/*.sql"
---

# 后端基础设施层规范（.NET 8）

## ORM 框架

### 技术选型
- 使用 SqlSugar 5.x（CodeFirst + DbFirst）
- 实体映射: `[SugarTable("表名")]` + `[SugarColumn(IsPrimaryKey=true)]`
- 字段映射: 数据库 snake_case → C# PascalCase（`[SugarColumn(ColumnName="...")]`）

### ✅ 正确示例
```csharp
[SugarTable("users")]
public class User : ITenantEntity, IAuditable
{
    [SugarColumn(IsPrimaryKey = true)]
    public long Id { get; set; }
    
    [SugarColumn(ColumnName = "tenant_id")]
    public long TenantId { get; set; }
    
    [SugarColumn(ColumnName = "username")]
    public string Username { get; set; }
    
    [SugarColumn(ColumnName = "created_at")]
    public DateTime CreatedAt { get; set; }
}
```

### ❌ 错误示例
```csharp
// ❌ 没有指定表名，默认用类名
public class User  // 表名变成 "User"，不符合 snake_case

// ❌ 没有映射字段名
[SugarTable("users")]
public class User
{
    public long TenantId { get; set; }  // ❌ 数据库字段是 tenant_id，没有映射
}
```

## 实体定义

### 规范
- 主键: 雪花 ID（Snowflake ID），类型 `long`，禁止自增（禁止 `IsIdentity = true`）
- **雪花 ID 是 19 位**，超出 JavaScript 安全整数范围（`2^53-1`）：后端实体用 `long`，**对前端输出时必须序列化为字符串**（见下方「ID 序列化」）
- 公共字段: 通过基类或接口复用（`ITenantEntity`, `IAuditable`）
- 表名: snake_case 复数（`users`, `order_items`）
- 字段: PascalCase（`Id`, `CreatedAt`, `UserId`）

### 公共接口

```csharp
// 多租户实体接口
public interface ITenantEntity
{
    long TenantId { get; set; }
}

// 审计字段接口
public interface IAuditable
{
    DateTime CreatedAt { get; set; }
    DateTime? UpdatedAt { get; set; }
    long? CreatedBy { get; set; }
    long? UpdatedBy { get; set; }
}

// 软删除接口
public interface ISoftDelete
{
    bool IsDeleted { get; set; }
    DateTime? DeletedAt { get; set; }
}
```

### ✅ 正确示例
```csharp
[SugarTable("orders")]
public class Order : ITenantEntity, IAuditable, ISoftDelete
{
    [SugarColumn(IsPrimaryKey = true)]
    public long Id { get; set; }
    
    [SugarColumn(ColumnName = "tenant_id")]
    public long TenantId { get; set; }
    
    [SugarColumn(ColumnName = "user_id")]
    public long UserId { get; set; }
    
    [SugarColumn(ColumnName = "total_amount")]
    public decimal TotalAmount { get; set; }
    
    [SugarColumn(ColumnName = "status")]
    public int Status { get; set; }
    
    // 审计字段
    [SugarColumn(ColumnName = "created_at")]
    public DateTime CreatedAt { get; set; }
    
    [SugarColumn(ColumnName = "updated_at")]
    public DateTime? UpdatedAt { get; set; }
    
    [SugarColumn(ColumnName = "created_by")]
    public long? CreatedBy { get; set; }
    
    // 软删除
    [SugarColumn(ColumnName = "is_deleted")]
    public bool IsDeleted { get; set; }
    
    [SugarColumn(ColumnName = "deleted_at")]
    public DateTime? DeletedAt { get; set; }
}
```

### ❌ 错误示例
```csharp
// ❌ 使用自增 ID
[SugarColumn(IsPrimaryKey = true, IsIdentity = true)]
public int Id { get; set; }

// ❌ 每个实体重复定义公共字段
public class Order
{
    public long Id { get; set; }
    public long TenantId { get; set; }  // ❌ 应该实现 ITenantEntity
    public DateTime CreatedAt { get; set; }  // ❌ 应该实现 IAuditable
}
```

#@@TENANT_ONLY_START
## 多租户隔离（红线）

### 铁律
1. 所有业务实体必须实现 `ITenantEntity`（包含 `TenantId` 属性）
2. 所有查询必须经过租户过滤器（SqlSugar 全局过滤器）
3. 索引: `TenantId` 必须作为联合索引第一列

### 全局过滤器配置

```csharp
// Program.cs 或 Startup.cs
services.AddScoped<ISqlSugarClient>(provider =>
{
    var db = new SqlSugarScope(new ConnectionConfig
    {
        ConnectionString = connectionString,
        DbType = DbType.MySql,
        IsAutoCloseConnection = true
    }, db =>
    {
        // 多租户全局过滤器
        db.QueryFilter.AddTableFilter<ITenantEntity>(it => 
            it.TenantId == CurrentUser.TenantId);
    });
    return db;
});
```

### ✅ 正确
```csharp
// 自动应用租户过滤
var orders = await _db.Queryable<Order>()
    .Where(o => o.Status == 1)
    .ToListAsync();
// 实际 SQL: SELECT * FROM orders WHERE tenant_id = @TenantId AND status = 1
```

### ❌ 错误
```csharp
// ❌ 绕过租户过滤器
var orders = await _db.Queryable<Order>()
    .ClearFilter()  // ❌ 危险！会查所有租户数据
    .ToListAsync();
```

#@@TENANT_ONLY_END
## 迁移管理

### 规范
- 版本化脚本: `sql/migrations/V{三位序号}__{描述}.sql`
- 只增不改，幂等优先（`IF NOT EXISTS`）

### ✅ 正确示例
```sql
-- V001__create_users_table.sql
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    #@@TENANT_ONLY_START
    tenant_id BIGINT NOT NULL,
    #@@TENANT_ONLY_END
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    is_deleted TINYINT(1) DEFAULT 0
);

#@@TENANT_ONLY_START
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_username ON users(tenant_id, username);
#@@TENANT_ONLY_END

-- V002__add_user_status.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS status INT DEFAULT 1;
```

### ❌ 错误示例
```sql
-- ❌ 没有 IF NOT EXISTS，重复执行会报错
CREATE TABLE users (
    id BIGINT PRIMARY KEY#@@TENANT_ONLY_START,
    tenant_id BIGINT NOT NULL#@@TENANT_ONLY_END
);

-- ❌ 修改已执行的迁移
-- V001__create_users_table.sql 已经执行过了，不能修改
-- 应该新增 V003__alter_users_xxx.sql
```

## 雪花 ID 生成

### 规范
- 进程启动时设置 WorkId（1-30），**多实例部署时每个实例必须不同**，否则生成重复主键
- 实体构造时生成 ID（保证 `ExecuteCommand()` 也带 ID）；SqlSugar 的普通 `ExecuteCommand()` **不会**自动填雪花 ID
- 只有 `ExecuteReturnSnowflakeId()` / `ExecuteReturnSnowflakeIdAsync()` 会由 ORM 生成并回填

```csharp
// 全局雪花 ID 生成器（包装 SqlSugar.SnowFlakeSingle）
public static class SnowflakeId
{
    // 进程启动时调用一次：SnowflakeId.Init(workId); workId 来自配置 Snowflake:WorkId
    public static void Init(int workId) => SnowFlakeSingle.WorkId = workId;
    public static long NewId() => SnowFlakeSingle.Instance.NextId();
}

// Program.cs 启动配置
SnowflakeId.Init(int.Parse(builder.Configuration["Snowflake:WorkId"] ?? "1"));

// appsettings.json
// "Snowflake": { "WorkId": 1 }   // 多实例用环境变量 Snowflake__WorkId 覆盖

// 实体构造时生成（配合实体里 Id 的默认值）
public class User
{
    public long Id { get; set; } = SnowflakeId.NewId();  // 禁止 IsIdentity = true
}
```

### 插入方式对照
```csharp
// ✅ 实体已带 ID，普通插入即可
var user = new User { Username = request.Username };
await _db.Insertable(user).ExecuteCommandAsync();

// ✅ 或让 ORM 生成并回填（实体 Id 会拿到返回值）
var id = await _db.Insertable(user).ExecuteReturnSnowflakeIdAsync();

// ❌ 不要再用自增回填 API
// await _db.Insertable(user).ExecuteReturnBigIdentityAsync();
```

## ID 序列化（雪花 ID 必做）

### 规范
雪花 ID 19 位，JS `number` 无法精确表示。所有 `long` 类型的 ID 字段（含 `*Id`）对前端输出为**字符串**，请求体也接受字符串形式；`Count` / `Total` 等普通数值字段不受影响。

```csharp
// Program.cs：注册 System.Text.Json 转换器
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new LongIdAsStringConverter());
    });
// LongIdAsStringConverter：把名为 Id / *Id 的 long 序列化为字符串，反序列化时接受字符串或数字
```

### ✅ 正确
```json
// 响应：ID 是字符串，前端用 string 接收
{ "id": "2125094192584724480", "tenantId": "2125094192584724001", "total": 42 }
```
```typescript
// 前端
export interface UserDto {
  id: string;
  tenantId: string;
}
```

### ❌ 错误
```json
// ❌ ID 输出为数字，前端 JSON.parse 后精度丢失，最后几位变成 0
{ "id": 2125094192584724480 }
```

## 命名约定

| 类型 | 规则 | 示例 |
|------|------|------|
| 实体文件 | `{Resource}.cs` | `User.cs`, `Order.cs` |
| 接口文件 | `I{Interface}.cs` | `ITenantEntity.cs`, `IAuditable.cs` |
| 迁移文件 | `V{序号}__{描述}.sql` | `V001__create_users_table.sql` |

## 边界情况

### 例外场景
- 关联表（如 `user_roles`）可使用复合主键，不使用雪花 ID
- 字典表/配置表可省略软删除字段

### 优先级裁决
#@@TENANT_ONLY_START
当查询性能与租户过滤器冲突时，**优先保证租户隔离**，通过索引优化性能。
#@@TENANT_ONLY_END

## 详细规范
如需更多细节，参考：
- @.claude/standards/topics/后端开发规范/02-二、项目结构规范.md
- @.claude/standards/topics/后端开发规范/08-八、数据库操作规范.md
