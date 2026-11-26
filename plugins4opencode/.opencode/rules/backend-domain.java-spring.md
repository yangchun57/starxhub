# 后端领域与持久层规范（Java Spring Boot 3）

## 铁律

1. **接口/实现分离**：`XxxService` + `XxxServiceImpl`，业务编排只在 service 层。
2. **事务只加在 public service 方法**，显式 `@Transactional(rollbackFor = Exception.class)`；只读查询加 `readOnly = true`。禁止同类自调用（AOP 不生效）。
3. **实体显式 `@TableName`**，主键 `@TableId(type = IdType.ASSIGN_ID)`；逻辑删除用 `@TableLogic`，禁止手写 `WHERE deleted = 0`。
5. **禁止 `${}` 拼接 SQL 与 `SELECT *`**；动态条件用 `<where>` / `<if>`，长 SQL 放 `resources/mapper/*.xml`。
6. **事务内禁止远程调用/发消息/写文件**，需最终一致性用 `@TransactionalEventListener(AFTER_COMMIT)`。
