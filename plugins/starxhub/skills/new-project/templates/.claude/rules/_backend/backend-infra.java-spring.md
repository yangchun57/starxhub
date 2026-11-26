---
paths:
  - "pom.xml"
  - "src/main/resources/**"
  - "src/main/java/**/config/**/*.java"
  - "src/main/java/**/security/**/*.java"
  - "src/main/java/**/common/**/*.java"
---

# 后端基础设施规范（Java Spring Boot 3）

## 铁律

1. **JDK 17 + Spring Boot 3.2 + Jakarta 命名空间**（`jakarta.*`），禁止 `javax.*`；版本统一放 `<properties>`。
2. **密钥/口令一律环境变量占位**（`${DB_PASSWORD:}`），禁止硬编码或提交 `.env`；生产关闭 Swagger UI。
3. **无状态会话**：`SessionCreationPolicy.STATELESS` + `Authorization: Bearer`，禁止 `HttpSession`。
#@@TENANT_ONLY_START
4. **租户上下文 `ThreadLocal` 必须在 `finally` 里 `remove()`**；异步线程显式传递，禁止依赖隐式继承。
#@@TENANT_ONLY_END
5. **Jackson 全局配置**：日期 `yyyy-MM-dd HH:mm:ss`、时区 `Asia/Shanghai`、`Long` 序列化为字符串（防前端精度丢失）。
6. **`GlobalExceptionHandler` 覆盖** `BusinessException` / `MethodArgumentNotValidException` / `ConstraintViolationException` / `AccessDeniedException` / 兜底 `Exception`；兜底不回传堆栈。

违反后果：硬编码密钥直接泄漏；Long 精度丢失会让前端 ID 对不上。#@@TENANT_ONLY_START ThreadLocal 不清理会在线程池里串租户。#@@TENANT_ONLY_END

## 标准写法

✅ 正确
```yaml
# application.yml
spring:
  datasource:
    password: ${DB_PASSWORD:}
  jackson:
    time-zone: Asia/Shanghai
    date-format: yyyy-MM-dd HH:mm:ss
jwt:
  secret: ${JWT_SECRET:}
```

```java
@Configuration
public class MybatisPlusConfig {
    @Bean
    public MybatisPlusInterceptor interceptor() {
        MybatisPlusInterceptor i = new MybatisPlusInterceptor();
        i.addInnerInterceptor(new TenantLineInnerInterceptor(new TenantLineHandler() { ... }));
        PaginationInnerInterceptor p = new PaginationInnerInterceptor(DbType.MYSQL);
        p.setMaxLimit(200L);
        i.addInnerInterceptor(p);
        return i;
    }
}
```

❌ 错误
```yaml
spring.datasource.password: Root@123456     # 明文口令入库
```

```java
http.sessionManagement(s -> s.sessionCreationPolicy(STATEFUL)); // 有状态会话
```

## 主键：雪花 ID

- 主键用 MyBatis-Plus `ASSIGN_ID`（雪花 ID），类型 `Long`，**禁止 `IdType.AUTO` / 数据库自增**。
- 19 位雪花 ID 超出 JS 安全整数，Jackson 已全局把 `Long` 序列化为字符串（见铁律 5），前端类型用 `string`。
- 多实例部署必须配置不同 `worker-id`（0-31），否则生成重复主键：

```yaml
# application.yml
mybatis-plus:
  global-config:
    db-config:
      id-type: assign_id
machine:
  worker-id: ${SNOWFLAKE_WORKER_ID:1}   # 多实例用环境变量区分，0-31
```

```java
@Bean
public IdentifierGenerator identifierGenerator(
        @Value("${machine.worker-id:1}") long workerId) {
    DefaultIdentifierGenerator generator = new DefaultIdentifierGenerator(workerId);
    return generator;  // 与 MyBatis-Plus ASSIGN_ID 对齐
}
```

## 补充

- 日志用 SLF4J 占位符 + MDC `traceId`；禁止打印 token / 密码 / 手机号明文。
- HikariCP `maximumPoolSize <= 20`，慢 SQL 阈值 500ms；`/actuator/health` 生产只开放 health/info。
- 详细规范见 `@.claude/standards/topics/Java后台开发规范/`。
