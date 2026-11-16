---
trigger: always
---

# 数据库规范

#@@TENANT_ONLY_START
## 多租户隔离（红线）

### 铁律
1. **所有业务表必须包含 `tenant_id` 字段**（BIGINT, NOT NULL）
2. **所有查询必须经过租户过滤器**：使用全局查询过滤器或中间件自动注入
3. **禁止跨租户数据访问**：任何 SQL 都必须带 `WHERE tenant_id = ?`
4. **索引要求**：`tenant_id` 必须作为联合索引的第一列

**违反后果**：数据泄露，A 租户看到 B 租户的数据，违反 SaaS SLA。

### ✅ 正确写法
```sql
-- 复合索引，tenant_id 在第一列
CREATE INDEX idx_tenant_status ON orders(tenant_id, status);

-- 查询必须带 tenant_id
SELECT * FROM orders WHERE tenant_id = 1 AND status = 'pending';
```

### ❌ 错误写法
```sql
-- tenant_id 不在第一列，无法用于租户过滤
CREATE INDEX idx_status_tenant ON orders(status, tenant_id);

-- 缺少 tenant_id 过滤，会查所有租户数据
SELECT * FROM orders WHERE status = 'pending';
```
#@@TENANT_ONLY_END

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
#@@TENANT_ONLY_START
    tenant_id BIGINT NOT NULL,
#@@TENANT_ONLY_END
    username VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

#@@TENANT_ONLY_START
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
#@@TENANT_ONLY_END
```

### ❌ 错误示例
```sql
-- ❌ 没有 IF NOT EXISTS，重复执行会报错
CREATE TABLE users (
    id BIGINT PRIMARY KEY
#@@TENANT_ONLY_START
    , tenant_id BIGINT NOT NULL
#@@TENANT_ONLY_END
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
#@@TENANT_ONLY_START
    .Where(it => it.TenantId == tenantId)
#@@TENANT_ONLY_END
    .ToPageListAsync(pageIndex, pageSize);
```

### ❌ 错误写法
```csharp
// ❌ 没有分页，可能返回上万条
var users = await _db.Queryable<User>()
#@@TENANT_ONLY_START
    .Where(it => it.TenantId == tenantId)
#@@TENANT_ONLY_END
    .ToListAsync();

// ❌ 拼接原生 SQL（除非复杂报表）
var users = _db.Ado.SqlQuery<User>("SELECT * FROM users WHERE 1=1");
```

## 索引规范

### 规则
#@@TENANT_ONLY_START
- `tenant_id` 必须作为联合索引的第一列
#@@TENANT_ONLY_END
- 单表索引数量不超过 5 个
- 避免在低基数列上建索引（如 `status`）

### ✅ 正确
```sql
-- 复合索引，高频过滤列在前
#@@TENANT_ONLY_START
CREATE INDEX idx_tenant_status ON orders(tenant_id, status);
#@@TENANT_ONLY_END
#@@SINGLE_ONLY_START
CREATE INDEX idx_status_created ON orders(status, created_at);
#@@SINGLE_ONLY_END
```

### ❌ 错误
```sql
#@@TENANT_ONLY_START
-- tenant_id 不在第一列
CREATE INDEX idx_status_tenant ON orders(status, tenant_id);
#@@TENANT_ONLY_END
```

## 边界情况

### 例外场景
#@@TENANT_ONLY_START
- 配置表（< 1000 行）可省略 `tenant_id`
#@@TENANT_ONLY_END
- 报表查询可全表扫描，但需 DBA 审核

#@@TENANT_ONLY_START
### 优先级裁决
当性能与多租户隔离冲突时，**优先保证隔离**。
#@@TENANT_ONLY_END

## 详细规范
如需更多细节，参考 @.claude/standards/通用开发规范.md#数据库规范
