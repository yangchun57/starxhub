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
- 主键: 雪花 ID（Snowflake ID），类型 `long`，禁止自增
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

## 迁移管理

### 规范
- 版本化脚本: `sql/migrations/V{三位序号}__{描述}.sql`
- 只增不改，幂等优先（`IF NOT EXISTS`）

### ✅ 正确示例
```sql
-- V001__create_users_table.sql
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    is_deleted TINYINT(1) DEFAULT 0
);


-- V002__add_user_status.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS status INT DEFAULT 1;
```

### ❌ 错误示例
```sql
-- ❌ 没有 IF NOT EXISTS，重复执行会报错
CREATE TABLE users (
);

-- ❌ 修改已执行的迁移
-- V001__create_users_table.sql 已经执行过了，不能修改
-- 应该新增 V003__alter_users_xxx.sql
```

## 雪花 ID 生成

### 规范
```csharp
// 全局雪花 ID 生成器
public static class SnowflakeIdGenerator
{
    private static readonly SnowflakeId _generator = new SnowflakeId(workerId: 1);
    
    public static long NewId() => _generator.NextId();
}

// 在实体创建时使用
public class UserService
{
    public async Task<long> CreateAsync(CreateUserRequest request)
    {
        var user = new User
        {
            Id = SnowflakeIdGenerator.NewId(),  // 雪花 ID
            Username = request.Username,
            CreatedAt = DateTime.UtcNow
        };
        await _userRepo.InsertAsync(user);
        return user.Id;
    }
}
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

## 详细规范
如需更多细节，参考：
- @.claude/standards/topics/后端开发规范/02-二、项目结构规范.md
- @.claude/standards/topics/后端开发规范/08-八、数据库操作规范.md
