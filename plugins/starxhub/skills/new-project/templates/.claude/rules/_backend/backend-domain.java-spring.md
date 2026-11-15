---
paths:
  - "src/main/java/**/service/**/*.java"
  - "src/main/java/**/entity/**/*.java"
  - "src/main/java/**/mapper/**/*.java"
  - "src/main/resources/mapper/**/*.xml"
---

# 后端领域与持久层规范（Java Spring Boot 3）

## 铁律

1. **接口/实现分离**：`XxxService` + `XxxServiceImpl`，业务编排只在 service 层。
2. **事务只加在 public service 方法**，显式 `@Transactional(rollbackFor = Exception.class)`；只读查询加 `readOnly = true`。禁止同类自调用（AOP 不生效）。
3. **实体显式 `@TableName`**，主键 `@TableId(type = IdType.ASSIGN_ID)`；逻辑删除用 `@TableLogic`，禁止手写 `WHERE deleted = 0`。
4. **多租户用 `TenantLineInnerInterceptor` 统一注入 `tenant_id`**，禁止每条 SQL 手写租户条件；按 ID 操作必须校验资源归属租户。
5. **禁止 `${}` 拼接 SQL 与 `SELECT *`**；动态条件用 `<where>` / `<if>`，长 SQL 放 `resources/mapper/*.xml`。
6. **事务内禁止远程调用/发消息/写文件**，需最终一致性用 `@TransactionalEventListener(AFTER_COMMIT)`。

违反后果：漏一条租户条件即越权；事务边界错会造成半提交与连接池耗尽。

## 标准写法

✅ 正确
```java
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserMapper userMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserOut create(UserIn body) {
        User entity = UserConverter.INSTANCE.toEntity(body);
        userMapper.insert(entity);            // tenant_id 由拦截器注入
        return UserConverter.INSTANCE.toOut(entity);
    }
}
```

❌ 错误
```java
@Transactional                                   // 未写 rollbackFor，受检异常不回滚
private UserOut create(UserIn body) { ... }        // private + 自调用，事务完全不生效

@Select("SELECT * FROM t_user WHERE name = '${name}'")  // SQL 注入 + 全列
List<User> find(String name);
```

## 补充

- 分页插件声明 `DbType.MYSQL` + `maxLimit: 200`；联表超 3 张先评估执行计划。
- DTO ↔ entity 用 MapStruct，禁止在 controller 手写字段搬运。
- 详细规范见 `@.claude/standards/topics/Java后台开发规范/`。
