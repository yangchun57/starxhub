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
4. **租户上下文 `ThreadLocal` 必须在 `finally` 里 `remove()`**；异步线程显式传递，禁止依赖隐式继承。
5. **Jackson 全局配置**：日期 `yyyy-MM-dd HH:mm:ss`、时区 `Asia/Shanghai`、`Long` 序列化为字符串（防前端精度丢失）。
6. **`GlobalExceptionHandler` 覆盖** `BusinessException` / `MethodArgumentNotValidException` / `ConstraintViolationException` / `AccessDeniedException` / 兜底 `Exception`；兜底不回传堆栈。

违反后果：硬编码密钥直接泄漏；ThreadLocal 不清理会在线程池里串租户；Long 精度丢失会让前端 ID 对不上。

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

## 补充

- 日志用 SLF4J 占位符 + MDC `traceId`；禁止打印 token / 密码 / 手机号明文。
- HikariCP `maximumPoolSize <= 20`，慢 SQL 阈值 500ms；`/actuator/health` 生产只开放 health/info。
- 详细规范见 `@.claude/standards/topics/Java后台开发规范/`。
