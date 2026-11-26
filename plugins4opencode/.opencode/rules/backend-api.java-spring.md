# 后端 API 层规范（Java Spring Boot 3）

## 铁律

1. **所有接口返回 `R<T>`**，禁止直接返回 entity / Map / `ResponseEntity` 裸对象。
2. **入参必须 DTO + `@Valid`**，禁止裸 `Map`、`String` 接 JSON、`HttpServletRequest` 手撸参数。
3. **controller 零业务逻辑**：只做绑定、鉴权注解、调 service、包装 `R.ok(...)`；禁止注入 Mapper。
4. **业务失败抛 `BusinessException(ErrorCode.XXX)`**，由 `@RestControllerAdvice` 统一转 `R.fail`；禁止 catch 后返回 `null` 或吞异常。
5. **分页固定 `R<PageResult<T>>`**，字段 `items/total/page/pageSize`，pageSize 上限 200。
6. **entity 禁止出参**，一律经 MapStruct 转 `dto/response`，字段 camelCase。
