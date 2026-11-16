---
paths:
  - "src/main/java/**/controller/**/*.java"
  - "**/*Controller.java"
  - "src/main/java/**/dto/**/*.java"
---

# 后端 API 层规范（Java Spring Boot 3）

## 铁律

1. **所有接口返回 `R<T>`**，禁止直接返回 entity / Map / `ResponseEntity` 裸对象。
2. **入参必须 DTO + `@Valid`**，禁止裸 `Map`、`String` 接 JSON、`HttpServletRequest` 手撸参数。
3. **controller 零业务逻辑**：只做绑定、鉴权注解、调 service、包装 `R.ok(...)`；禁止注入 Mapper。
4. **业务失败抛 `BusinessException(ErrorCode.XXX)`**，由 `@RestControllerAdvice` 统一转 `R.fail`；禁止 catch 后返回 `null` 或吞异常。
5. **分页固定 `R<PageResult<T>>`**，字段 `items/total/page/pageSize`，pageSize 上限 200。
6. **entity 禁止出参**，一律经 MapStruct 转 `dto/response`，字段 camelCase。

违反后果：响应形态不一致会让前端 `src/api/http.ts` 适配层失效；entity 直出会泄漏#@@TENANT_ONLY_START租户字段与#@@TENANT_ONLY_END内部列。

## 标准写法

✅ 正确
```java
@GetMapping
public R<PageResult<UserOut>> list(@Valid UserQuery query) {
    return R.ok(userService.list(query));
}

@PostMapping
@ResponseStatus(HttpStatus.CREATED)
public R<UserOut> create(@Valid @RequestBody UserIn body) {
    return R.ok(userService.create(body));
}
```

❌ 错误
```java
@GetMapping
public List<User> list(Integer page) { return userMapper.selectList(null); } // 裸 entity + 无分页 + 直连 Mapper

@PostMapping
public R<UserOut> create(@RequestBody Map<String, Object> body) { ... }       // 无校验、无 DTO

@GetMapping("/{id}")
public R<UserOut> get(@PathVariable Long id) {
    try { return R.ok(service.get(id)); } catch (Exception e) { return null; }  // 吞异常
}
```

## 补充

- 鉴权用 `@PreAuthorize` / `SecurityConfig` 集中规则，禁止方法内解析 JWT。
- 错误码用 `ErrorCode` 枚举集中管理，禁止魔法数字；兜底异常不回传堆栈。
- 详细规范见 `@.claude/standards/topics/Java后台开发规范/`（先读 INDEX.md 定位主题）。
