# 后端基础设施规范（Java Spring Boot 3）

## 铁律

1. **JDK 17 + Spring Boot 3.2 + Jakarta 命名空间**（`jakarta.*`），禁止 `javax.*`；版本统一放 `<properties>`。
2. **密钥/口令一律环境变量占位**（`${DB_PASSWORD:}`），禁止硬编码或提交 `.env`；生产关闭 Swagger UI。
3. **无状态会话**：`SessionCreationPolicy.STATELESS` + `Authorization: Bearer`，禁止 `HttpSession`。
5. **Jackson 全局配置**：日期 `yyyy-MM-dd HH:mm:ss`、时区 `Asia/Shanghai`、`Long` 序列化为字符串（防前端精度丢失）。
6. **`GlobalExceptionHandler` 覆盖** `BusinessException` / `MethodArgumentNotValidException` / `ConstraintViolationException` / `AccessDeniedException` / 兜底 `Exception`；兜底不回传堆栈。
