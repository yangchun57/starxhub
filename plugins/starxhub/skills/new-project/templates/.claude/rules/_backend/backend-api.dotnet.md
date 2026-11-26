---
paths:
  - "**/Controllers/**/*.cs"
  - "**/Api/**/*.cs"
---

# 后端 API 层规范（.NET 8）

## 技术栈
- ASP.NET Core Web API + SqlSugar 5.x + JWT Bearer
- 统一返回: `ApiResult<T>` / `PageResult<T>`

## 铁律

1. **所有 Controller 必须使用 `[ApiController]` + `[Route("api/[controller]")]`**
2. **禁止 Controller 内含业务逻辑**，一律委托 Service 层
3. **认证**: `[Authorize]` 或 `[Authorize(Roles = "admin")]`
4. **响应**: 统一使用 `ApiResult<T>.Success(data)` / `ApiResult<T>.Fail(message, code)`

**违反后果**：代码风格混乱，无法统一拦截错误，前端解析困难。

## Controller 结构

### 标准模板

✅ 正确
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UserController> _logger;

    // 构造函数注入
    public UserController(IUserService userService, ILogger<UserController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    [HttpGet("{id}")]
    public async Task<ApiResult<UserDto>> GetById(long id)
    {
        var user = await _userService.GetByIdAsync(id);
        return ApiResult<UserDto>.Success(user);
    }

    [HttpPost]
    public async Task<ApiResult<long>> Create([FromBody] CreateUserRequest request)
    {
        var id = await _userService.CreateAsync(request);
        return ApiResult<long>.Success(id);
    }

    [HttpGet]
    public async Task<ApiResult<PageResult<UserDto>>> GetList([FromQuery] QueryUserRequest request)
    {
        var result = await _userService.GetListAsync(request);
        return ApiResult<PageResult<UserDto>>.Success(result);
    }
}
```

❌ 错误
```csharp
// ❌ 缺少 [ApiController] 和 [Route]
public class UserController
{
    [HttpGet]
    public async Task<List<User>> GetAll()
    {
        // ❌ 直接在 Controller 写业务逻辑
        var users = await _db.Queryable<User>().ToListAsync();
        return users;
    }
}
```

### 参数来源

| 场景 | 属性 | 示例 |
|------|------|------|
| 查询参数（分页、筛选） | `[FromQuery]` | `?page=1&size=10` |
| 请求体（创建、更新） | `[FromBody]` | `{ "username": "test" }` |
| 路由参数（ID） | `[FromRoute]` | `/api/users/{id}`（雪花 ID 为 19 位字符串） |
| 表单提交（文件上传） | `[FromForm]` | `multipart/form-data` |

> **雪花 ID 路由/响应约定**：主键为 19 位雪花 ID，路由参数用 `string` 接收后再转 `long`；响应中的 ID 由全局 JSON 转换器序列化为字符串（见 `backend-infra.dotnet.md`「ID 序列化」），前端类型一律 `string`。

✅ 正确
```csharp
// 分页查询
[HttpGet]
public async Task<ApiResult<PageResult<UserDto>>> GetList([FromQuery] QueryUserRequest request)
{
    // request 包含 PageIndex, PageSize, Keyword 等
    var result = await _userService.GetListAsync(request);
    return ApiResult<PageResult<UserDto>>.Success(result);
}

// 创建资源
[HttpPost]
public async Task<ApiResult<long>> Create([FromBody] CreateUserRequest request)
{
    var id = await _userService.CreateAsync(request);
    return ApiResult<long>.Success(id);
}

// 获取单个资源
[HttpGet("{id}")]
public async Task<ApiResult<UserDto>> GetById([FromRoute] long id)
{
    var user = await _userService.GetByIdAsync(id);
    return ApiResult<UserDto>.Success(user);
}
```

## 命名约定

| 类型 | 规则 | 示例 |
|------|------|------|
| Controller | `{Resource}Controller` | `UserController`, `OrderController` |
| Action | HTTP 动词 + 资源 | `GetList`, `Create`, `Update`, `Delete` |
| DTO | `{Resource}Dto` | `UserDto`, `OrderDto` |
| Request | `{Resource}{Action}Request` | `CreateUserRequest`, `QueryOrderRequest` |

✅ 正确
```csharp
// Controller 命名
public class UserController { }
public class OrderController { }

// Action 命名
[HttpGet]
public async Task<ApiResult<PageResult<UserDto>>> GetList() { }

[HttpPost]
public async Task<ApiResult<long>> Create() { }

// DTO 命名
public class UserDto { }
public class CreateUserRequest { }
public class QueryUserRequest { }
```

❌ 错误
```csharp
// ❌ Controller 命名不规范
public class UserApi { }  // 应该是 UserController

// ❌ Action 命名不规范
[HttpGet]
public async Task<List<User>> GetUserList() { }  // 应该是 GetList

// ❌ DTO 命名不规范
public class UserResponse { }  // 应该是 UserDto
```

## 错误处理

### 业务异常

✅ 正确
```csharp
// 抛出业务异常，由全局过滤器捕获
public async Task<long> CreateAsync(CreateUserRequest request)
{
    // 检查用户名是否已存在
    var exists = await _userRepo.ExistsAsync(u => u.Username == request.Username);
    if (exists)
    {
        throw new BusinessException("用户名已存在");
    }
    
    // 创建用户
    var user = request.ToEntity();
    await _userRepo.InsertAsync(user);
    return user.Id;
}
```

❌ 错误
```csharp
// ❌ 直接返回错误响应
[HttpPost]
public async Task<ApiResult<long>> Create([FromBody] CreateUserRequest request)
{
    var exists = await _userRepo.ExistsAsync(u => u.Username == request.Username);
    if (exists)
    {
        return ApiResult<long>.Fail("用户名已存在");  // ❌ 应该抛异常
    }
    
    var user = request.ToEntity();
    await _userRepo.InsertAsync(user);
    return ApiResult<long>.Success(user.Id);
}
```

### 全局异常过滤器

```csharp
// Startup.cs
services.AddMvc(options =>
{
    options.Filters.Add<GlobalExceptionFilter>();
});

// GlobalExceptionFilter.cs
public class GlobalExceptionFilter : IExceptionFilter
{
    private readonly ILogger<GlobalExceptionFilter> _logger;

    public void OnException(ExceptionContext context)
    {
        if (context.Exception is BusinessException biz)
        {
            // 业务异常：返回 200 + 错误信息
            context.Result = new JsonResult(ApiResult.Fail(biz.Message));
            context.HttpContext.Response.StatusCode = 200;
        }
        else
        {
            // 系统异常：返回 500 + 通用错误信息
            _logger.LogError(context.Exception, "系统异常");
            context.Result = new JsonResult(ApiResult.Fail("系统异常，请稍后重试"));
            context.HttpContext.Response.StatusCode = 500;
        }
    }
}
```

## DTO 映射规范

### 规则
- 使用扩展方法进行 DTO → Entity 映射
- 复杂映射可使用 Mapster（禁止 AutoMapper，过于魔法）

✅ 正确
```csharp
// 扩展方法映射
public static class UserMapper
{
    public static User ToEntity(this CreateUserRequest request)
    {
        return new User
        {
            Id = SnowflakeId.NewId(),
            Username = request.Username,
            Email = request.Email,
            CreatedAt = DateTime.UtcNow
        };
    }
    
    public static UserDto ToDto(this User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email
        };
    }
}

// 使用
var user = request.ToEntity();
var dto = user.ToDto();
```

❌ 错误
```csharp
// ❌ 手动逐字段赋值（容易遗漏）
var user = new User();
user.Username = request.Username;
user.Email = request.Email;
// 忘记设置 CreatedAt...

// ❌ 使用 AutoMapper（过于魔法，难以调试）
var user = _mapper.Map<User>(request);
```

## 版本控制

### 规则
- API 版本通过路由前缀控制：`api/v1/users`, `api/v2/users`
- 新版本不删除旧版本，保持向后兼容

✅ 正确
```csharp
[ApiController]
[Route("api/v1/[controller]")]
public class UserController : ControllerBase
{
    // v1 接口
}

[ApiController]
[Route("api/v2/[controller]")]
public class UserControllerV2 : ControllerBase
{
    // v2 接口，兼容 v1
}
```

## 边界情况

### 例外场景
- 健康检查接口（`/health`）可省略 `[Authorize]`
- 文件下载可直接返回 `FileStreamResult`，不包装 `ApiResult`
- WebSocket 接口不使用 `ApiResult` 包装

### 优先级裁决
当 RESTful 规范与项目约定冲突时，**优先遵循项目约定**（保持一致性）。

## 详细规范
如需更多细节，参考：
- @.claude/standards/topics/后端开发规范/03-三、分层架构规范.md
- @.claude/standards/topics/后端开发规范/05-五、统一响应格式.md
