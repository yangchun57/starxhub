# 数据库规范


## 迁移管理

### 规范
1. **版本化迁移脚本**：`sql/migrations/V{三位序号}__{描述}.sql`
2. **只增不改**：已执行的迁移禁止修改，只能新增迁移
3. **幂等优先**：迁移脚本应支持重复执行（使用 `IF NOT EXISTS`）
4. **禁止手工改库**：所有结构变更必须通过迁移脚本

### ✅ 正确示例
```sql
-- V001__create_users_table.sql
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

```

### ❌ 错误示例
```sql
-- ❌ 没有 IF NOT EXISTS，重复执行会报错
CREATE TABLE users (
    id BIGINT PRIMARY KEY
);

-- ❌ 修改已执行的迁移（禁止）
-- 应该新增 V002__alter_users_add_email.sql
```

## 字段命名

| 类型 | 规则 | 示例 |
|------|------|------|
| 表名 | snake_case 复数 | `users`, `order_items` |
| 字段名 | snake_case | `created_at`, `user_id` |
| 主键 | `id`（BIGINT，雪花 ID） | `id` |
| 外键 | `{关联表单数}_id` | `user_id`, `order_id` |
| 时间字段 | `created_at`, `updated_at`, `deleted_at` | `created_at` |

## ORM 使用

### 规范
- 禁止拼接原生 SQL（除复杂报表查询）
- 使用 ORM 提供的查询构建器
- 批量操作使用 `bulk_insert` / `bulk_update`
- 分页查询必须带 `LIMIT` 和 `OFFSET`

### ✅ 正确写法
```csharp
// SqlSugar 分页查询
var users = await _db.Queryable<User>()
    .ToPageListAsync(pageIndex, pageSize);
```

### ❌ 错误写法
```csharp
// ❌ 没有分页，可能返回上万条
var users = await _db.Queryable<User>()
    .ToListAsync();

// ❌ 拼接原生 SQL（除非复杂报表）
var users = _db.Ado.SqlQuery<User>("SELECT * FROM users WHERE 1=1");
```

## 索引规范

### 规则
- 单表索引数量不超过 5 个
- 避免在低基数列上建索引（如 `status`）

### ✅ 正确
```sql
-- 复合索引，高频过滤列在前
CREATE INDEX idx_status_created ON orders(status, created_at);
```

### ❌ 错误
```sql
```

## 边界情况

### 例外场景
- 报表查询可全表扫描，但需 DBA 审核


## 详细规范
如需更多细节，参考 @.claude/standards/通用开发规范.md#数据库规范
