# Java 后台开发规范

> 适用栈：Java 17+ / Spring Boot 3.2 / MyBatis-Plus 3.5 / MySQL 8.0 / Spring Security + JWT / Lombok / MapStruct / Maven。
> 本文件是单一事实来源；`.claude/standards/topics/Java后台开发规范/` 由 `split-standards.py` 按 `## ` 自动拆分，禁止手改分片。
> 与前端 starTech 设计系统对接时，响应信封转换由前端 `src/api/http.ts` 适配层完成，**后端不得为迁就前端改写 `R<T>` 结构**。

---

## 1. 技术栈与版本基线

| 组件 | 版本 | 约束 |
|---|---|---|
| JDK | 17（LTS） | 禁止使用 8/11；`pom.xml` 里 `java.version=17` |
| Spring Boot | 3.2.x | Jakarta EE 10 命名空间（`jakarta.*`），禁止 `javax.*` |
| MyBatis-Plus | 3.5.x | 分页必须用 `PaginationInnerInterceptor`，禁止手写 `LIMIT` 分页 |
| MySQL | 8.0 | `utf8mb4` + `utf8mb4_0900_ai_ci` |
| 构建 | Maven | 单模块起步，`mvn clean package` 必须一次通过 |
| 测试 | JUnit 5 + Mockito | 集成测试用 `@SpringBootTest`，禁止依赖外部真实 DB |

依赖版本统一在 `<properties>` 管理；禁止在子模块里散落版本号。引入新依赖前先确认是否被 `spring-boot-starter-*` 间接提供，避免冲突。

---

## 2. 分层与目录结构

```text
src/main/java/<basePackage>/
├── Application.java              # 启动类，仅 @SpringBootApplication + @MapperScan
├── common/                       # R<T>、PageResult<T>、BusinessException、ErrorCode、GlobalExceptionHandler
├── config/                       # MybatisPlusConfig、SecurityConfig、OpenApiConfig、JacksonConfig
├── security/                     # JwtTokenProvider、JwtAuthenticationFilter、UserPrincipal
├── controller/                   # 仅 HTTP 语义：参数绑定、鉴权注解、调用 service、返回 R<T>
├── service/                      # 接口 + impl，业务编排与事务边界
├── mapper/                       #MyBatis-Plus BaseMapper 子接口 + 自定义 XML
├── entity/                       # 数据库实体，@TableName / @TableId / @TableField
├── dto/                          # request / response 分包，禁止把 entity 直接暴露给前端
└── converter/                    # MapStruct 映射，禁止在 controller 里手写字段搬运
```

铁律：**controller 不得出现业务逻辑，不得直接注入 Mapper；entity 不得作为出参返回**。`dto/response` 字段名统一 camelCase，与前端 `types/index.ts` 的 DTO 对齐。

---

## 3. 统一响应与异常

```java
public class R<T> implements Serializable {
    private int code;        // 0 = 成功，非 0 = 业务错误码
    private T data;
    private String message;
    public static <T> R<T> ok(T data) { ... }
    public static <T> R<T> fail(int code, String message) { ... }
}

public class PageResult<T> {
    private List<T> items;
    private long total;
    private long page;
    private long pageSize;
}
```

- 所有接口返回 `R<T>`；**禁止**在 controller 里直接 `return entity` 或 `return Map`。
- 业务失败统一 `throw new BusinessException(ErrorCode.XXX)`，由 `@RestControllerAdvice` 转成 `R.fail(code, message)`；禁止 `try-catch` 后吞异常返回 `null`。
- HTTP 状态码只表达传输层语义（200/401/403/404/500），业务码放 `R.code`。
- 分页出参固定 `items/total/page/pageSize`；数据库 `snake_case` 由 `@TableField` 映射，出参 camelCase。

**与 python 后端的差异**：本栈采用统一信封 `R<T>`；python 栈按 RESTful 使用 `HTTPException` + 裸 DTO。两者由前端适配层收敛，**不要互相改写对方的规范**。

---

## 4. Controller 层规范

```java
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "用户管理")
public class UserController {
    private final UserService userService;

    @GetMapping
    @Operation(summary = "用户列表")
    public R<PageResult<UserOut>> list(@Valid UserQuery query) {
        return R.ok(userService.list(query));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public R<UserOut> create(@Valid @RequestBody UserIn body) {
        return R.ok(userService.create(body));
    }
}
```

- 入参必须 `@Valid` + DTO，禁止裸 `Map` / `String` 接 JSON。
- 查询参数用 `@ModelAttribute` DTO（含 `page`/`pageSize` 默认值与上限校验），禁止 `HttpServletRequest` 手撸参数。
- 鉴权用 `@PreAuthorize` 或 URL 规则集中在 `SecurityConfig`，禁止每个方法里手写 token 解析。
- 禁止在 controller 里 `System.out.println`、`e.printStackTrace()`。

---

## 5. Service 层与事务

- 接口与实现分离：`UserService` / `UserServiceImpl`，实现类打 `@Service`。
- `@Transactional` 只加在 **public** 的 service 方法上，且必须显式 `rollbackFor = Exception.class`；同类内部方法自调用不生效，需拆到另一个 bean 或用 `TransactionTemplate`。
- 只读查询加 `@Transactional(readOnly = true)`。
- 禁止在事务里做远程调用、发消息、写文件等长耗时操作；需最终一致性时用事务事件 `@TransactionalEventListener(phase = AFTER_COMMIT)`。
- 业务校验失败抛 `BusinessException`，不要返回 `Optional.empty()` 让调用方猜。

---

## 6. 持久层（MyBatis-Plus）

- 实体必须 `@TableName("t_xxx")` 显式指定表名；主键 `@TableId(type = IdType.ASSIGN_ID)`（雪花 ID）。
- 逻辑删除用 `@TableLogic`，全局配置 `logic-delete-field: deleted`；**所有查询自动带删除标记，不要手写 `WHERE deleted = 0`**。
#@@TENANT_ONLY_START
- 多租户：优先 `TenantLineInnerInterceptor` 统一注入 `tenant_id`；禁止在每条 SQL 里手写租户条件（漏一条就是越权）。
#@@TENANT_ONLY_END
- 分页插件必须声明 `DbType.MYSQL` 并设 `maxLimit: 200`，防前端传超大 pageSize 打爆 DB。
- 复杂 SQL 放 `resources/mapper/*.xml`，禁止在 `@Select` 注解里拼长 SQL；动态条件用 `<where>` / `<if>`，禁止 `${}` 拼接（SQL 注入）。
- 禁止 `SELECT *`；联表超过 3 张或出现 `LIKE '%xx%'` 全表扫描时，先做执行计划评估。

---

#@@TENANT_ONLY_START
## 7. 认证授权与多租户

- JWT 放 `Authorization: Bearer <token>`，密钥与过期时间从配置读，**禁止硬编码**；`JwtAuthenticationFilter` 在 `UsernamePasswordAuthenticationFilter` 之前注册。
- 无状态：`SessionCreationPolicy.STATELESS`，禁止使用 `HttpSession`。
- 租户上下文用 `ThreadLocal` + 拦截器，在 `finally` 里 `remove()`；异步线程必须显式传递，禁止依赖 `InheritableThreadLocal` 隐式继承。
- 越权校验不能只靠前端隐藏菜单：所有按 ID 查询/修改的接口都要校验资源归属租户。
- 密码用 `BCryptPasswordEncoder`，日志里禁止打印 token、密码、身份证、手机号明文。

---
#@@TENANT_ONLY_END

## 8. 参数校验与错误码

- Bean Validation 注解写在 DTO 上（`@NotBlank` / `@Size` / `@Pattern` / `@Min`），错误信息用中文。
- `ErrorCode` 用枚举集中管理，格式 `模块_语义`（如 `USER_NOT_FOUND`），`R.code` 与枚举的数值一一对应，禁止散落魔法数字。
- `GlobalExceptionHandler` 至少覆盖：`BusinessException`、`MethodArgumentNotValidException`、`ConstraintViolationException`、`AccessDeniedException`、兜底 `Exception`（兜底只返回通用文案，不回传堆栈）。
- 4xx 用于调用方错误、5xx 用于服务端错误；禁止把业务失败一律包成 HTTP 200 + 自定义码以外的第二种混乱形态。

---

## 9. 配置与环境

- `application.yml` 只放默认值与占位；`application-dev.yml` / `application-prod.yml` 用 Spring Profile 切换。
- 所有密钥、数据库口令用环境变量占位（`${DB_PASSWORD:}`），**禁止提交真实凭据**；`.env` 必须进 `.gitignore`。
- 数据库连接池用 HikariCP，`maximumPoolSize` 不超过 20；慢 SQL 日志阈值 500ms。
- 全局 Jackson 配置：日期 `yyyy-MM-dd HH:mm:ss`、时区 `Asia/Shanghai`、`Long` 序列化为字符串（防前端精度丢失）。
- 开放接口文档用 springdoc-openapi，生产环境通过配置关闭 Swagger UI。

---

## 10. 日志与可观测性

- 使用 SLF4J + Logback，占位符 `log.info("user={}, cost={}ms", id, cost)`，禁止字符串拼接。
- 请求链路用 `traceId`（MDC）贯穿 controller → service → 日志；异常日志必须带 `traceId` 与入参摘要（脱敏后）。
- 关键写操作记录审计日志（操作人、#@@TENANT_ONLY_START租户、#@@TENANT_ONLY_END资源、前后值），审计日志与业务事务分离。
- 健康检查暴露 `/actuator/health`，生产只开放 health/info 端点。

---

## 11. 测试规范

- 单元测试：service 层用 Mockito mock mapper，不连数据库；方法命名 `should_xxx_when_yyy`。
- 集成测试：`@SpringBootTest` + Testcontainers 或 H2（注意 MySQL 方言差异），`@Transactional` 回滚保证用例互不污染。
- Controller 测试用 `MockMvc` / `WebTestClient`，断言 `R.code` 而不仅是 HTTP 200。
- 每个 `BusinessException` 分支至少一条用例；#@@TENANT_ONLY_START多租户越权场景必须有专门用例。#@@TENANT_ONLY_END
- `mvn test` 必须能在无外网、无真实 MySQL 的环境下通过。

---

## 12. 交付检查清单

- [ ] `mvn clean package` 通过，`mvn test` 全绿
- [ ] 新增接口都返回 `R<T>`，无 entity 直接出参
- [ ] 新增 DTO 都有校验注解，错误信息中文
#@@TENANT_ONLY_START
- [ ] 涉及租户数据的查询已验证 `tenant_id` 注入生效
#@@TENANT_ONLY_END
- [ ] 新增 SQL 已检查执行计划，无 `SELECT *` / `${}` 拼接
- [ ] 事务方法显式 `rollbackFor = Exception.class`
- [ ] 配置无硬编码密钥，`.env` 未入库
- [ ] 前端 `src/api/http.ts` 的 `envelope` 设为 `java-spring`，分页字段映射已联调
- [ ] OpenAPI 文档已更新，Swagger UI 生产环境关闭
