# {{PROJECT_NAME}} · 后端 API

Java 17 + Spring Boot 3.2 + MyBatis-Plus 3.5 + MySQL 8.0，Maven 单模块。

## 启动

```bash
export DB_PASSWORD=... JWT_SECRET=...
mvn spring-boot:run
```

健康检查：`GET /api/health` → `R<Map<String,String>>`。

## 目录约定

| 包 | 职责 |
|---|---|
| `common` | `R<T>` / `PageResult<T>` / `ErrorCode` / `BusinessException` / `GlobalExceptionHandler` |
| `config` | MyBatis-Plus 插件（租户 + 分页）、Jackson、Security |
| `security` | JWT 签发校验、过滤器、租户上下文 |
| `controller` | 仅 HTTP 语义，一律返回 `R<T>` |
| `service` / `mapper` / `entity` / `dto` | 业务编排 / 持久层 / 实体 / 出入参 |

包名 `{{javaPackage}}` 由脚手架按 `--code-name` 生成；如需改为公司域名，全局替换该包名并同步移动目录。

## 与前端契约

后端统一返回 `R<T>`（`code=0` 成功，分页 `items/total/page/pageSize`）。前端 starTech 模板的
`src/api/http.ts` 已内置 `envelope: "java-spring"` 适配，无需改写后端结构。
其它后端（python FastAPI 的 RESTful 裸 DTO / .NET8 的 `ApiResult<T>`）由同一适配层收敛。

## 质量门禁

```bash
mvn clean package
mvn test
```

完整规范见项目 `.claude/standards/Java后台开发规范.md`。
