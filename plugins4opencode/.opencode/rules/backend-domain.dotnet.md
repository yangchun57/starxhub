# 后端领域层规范（.NET 8）

## 分层职责

| 层级 | 职责 | 包含内容 | 禁止内容 |
|------|------|----------|----------|
| **Service/** | 业务逻辑、数据验证、事务管理 | 业务方法、事务编排 | HttpContext、Request/Response |
| **Model/** | 数据库实体映射、DTO 定义 | 实体类、DTO、枚举 | 业务逻辑方法 |
| **Common/** | 公共工具类 | JWT、Excel、统一返回格式 | 引用 Service 或 Model |

## 铁律

1. **禁止 Service 层直接操作 HttpContext**
2. **禁止 Model 层包含业务逻辑方法**（纯数据映射）
3. **禁止 Common 层引用 Service 或 Model**（只能被依赖）
4. **依赖注入**: 通过构造函数注入 `ISqlSugarClient` + `ILogger<T>`

**违反后果**：层级混乱，难以测试，无法复用。

## 依赖方向

```
Controller → Service → Model
                ↓
             Common
```

**严格单向，禁止反向依赖。**

✅ 正确
```csharp
// Service 依赖 Model 和 Common
public class UserService
{
    private readonly ISqlSugarClient _db;
    private readonly ILogger<UserService> _logger;
    
    public UserService(ISqlSugarClient db, ILogger<UserService> logger)
    {
        _db = db;
        _logger = logger;
    }
}

// Common 不依赖 Service 或 Model
public class JwtHelper
{
    public static string GenerateToken(long userId)
    {
        // 纯工具方法，不依赖业务层
    }
}
```

❌ 错误
```csharp
// ❌ Common 层引用 Service（反向依赖）
namespace Common
{
    public class JwtHelper
    {
        private readonly IUserService _userService;  // ❌ Common 不应依赖 Service
        
        public JwtHelper(IUserService userService)
        {
            _userService = userService;
        }
    }
}

// ❌ Model 层包含业务逻辑
public class User
{
    public string Username { get; set; }
    
    public bool IsValid()  // ❌ Model 不应包含业务方法
    {
        return !string.IsNullOrEmpty(Username);
    }
}
```

## Service 层规范

### 标准结构

✅ 正确
```csharp
public interface IUserService
{
    Task<UserDto> GetByIdAsync(long id);
    Task<PageResult<UserDto>> GetListAsync(QueryUserRequest request);
    Task<long> CreateAsync(CreateUserRequest request);
    Task UpdateAsync(long id, UpdateUserRequest request);
    Task DeleteAsync(long id);
}

public class UserService : IUserService
{
    private readonly ISqlSugarClient _db;
    private readonly ILogger<UserService> _logger;
    private readonly IUserRepository _userRepo;

    public UserService(
        ISqlSugarClient db, 
        ILogger<UserService> logger,
        IUserRepository userRepo)
    {
        _db = db;
        _logger = logger;
        _userRepo = userRepo;
    }

    public async Task<UserDto> GetByIdAsync(long id)
    {
        var user = await _userRepo.GetByIdAsync(id);
        if (user == null)
        {
            throw new BusinessException("用户不存在");
        }
        return user.ToDto();
    }

    public async Task<long> CreateAsync(CreateUserRequest request)
    {
        // 业务验证
        var exists = await _userRepo.ExistsAsync(u => u.Username == request.Username);
        if (exists)
        {
            throw new BusinessException("用户名已存在");
        }

        // 创建实体
        var user = request.ToEntity();
        await _userRepo.InsertAsync(user);
        
        _logger.LogInformation("创建用户: {Username}", user.Username);
        return user.Id;
    }
}
```

❌ 错误
```csharp
// ❌ Service 直接操作 HttpContext
public class UserService
{
    public async Task<long> CreateAsync(CreateUserRequest request)
    {
        var currentUserId = HttpContext.Current.User.FindFirst("sub")?.Value;  // ❌
        ...
    }
}

// ❌ 没有接口，无法测试和替换
public class UserService
{
    public async Task<long> CreateAsync(CreateUserRequest request)
    {
        ...
    }
}
```

### 事务管理

✅ 正确
```csharp
public async Task CreateOrderAsync(CreateOrderRequest request)
{
    await _db.Ado.UseTranAsync(async () =>
    {
        // 创建订单
        var order = request.ToEntity();
        await _orderRepo.InsertAsync(order);
        
        // 扣减库存
        foreach (var item in request.Items)
        {
            var success = await _inventoryRepo.DeductAsync(item.ProductId, item.Quantity);
            if (!success)
            {
                throw new BusinessException($"商品 {item.ProductId} 库存不足");
            }
        }
        
        // 创建支付记录
        var payment = new Payment
        {
            OrderId = order.Id,
            Amount = request.TotalAmount,
            Status = PaymentStatus.Pending
        };
        await _paymentRepo.InsertAsync(payment);
    });
}
```

❌ 错误
```csharp
// ❌ 没有事务，部分失败会导致数据不一致
public async Task CreateOrderAsync(CreateOrderRequest request)
{
    var order = request.ToEntity();
    await _orderRepo.InsertAsync(order);
    
    // 如果这里失败，订单已创建但库存未扣减
    foreach (var item in request.Items)
    {
        await _inventoryRepo.DeductAsync(item.ProductId, item.Quantity);
    }
}
```

## Model 层规范

### 实体定义

✅ 正确
```csharp
// 纯数据映射，不包含业务逻辑
[SugarTable("users")]
public class User : ITenantEntity, IAuditable
{
    [SugarColumn(IsPrimaryKey = true)]
    public long Id { get; set; }
    
    public long TenantId { get; set; }
    
    public string Username { get; set; }
    
    public string Email { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    public DateTime? UpdatedAt { get; set; }
}
```

❌ 错误
```csharp
// ❌ 包含业务逻辑
[SugarTable("users")]
public class User
{
    [SugarColumn(IsPrimaryKey = true)]
    public long Id { get; set; }
    
    public string Username { get; set; }
    
    // ❌ 业务方法不应在 Model 层
    public bool CanLogin()
    {
        return !string.IsNullOrEmpty(Username);
    }
    
    public void Activate()
    {
        // 业务逻辑
    }
}
```

### DTO 定义

✅ 正确
```csharp
// DTO 用于数据传输
public class UserDto
{
    public long Id { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public DateTime CreatedAt { get; set; }
}

// 创建请求
public class CreateUserRequest
{
    public string Username { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
}

// 查询请求
public class QueryUserRequest
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Keyword { get; set; }
}
```

## 命名约定

| 类型 | 规则 | 示例 |
|------|------|------|
| Service 接口 | `I{Resource}Service` | `IUserService`, `IOrderService` |
| Service 实现 | `{Resource}Service` | `UserService`, `OrderService` |
| Entity | `Sys{Resource}` 或 `{Resource}` | `SysUser`, `Order` |
| DTO | `{Resource}Dto` | `UserDto`, `OrderDto` |
| Request | `{Resource}{Action}Request` | `CreateUserRequest`, `QueryOrderRequest` |

## 边界情况

### 例外场景
- 简单 CRUD 可使用基类 Service 减少重复代码
- 跨 Service 调用时，通过接口注入，不直接依赖实现

### 优先级裁决
当性能优化需要跨层调用时，**优先保证分层清晰**，可通过 CQRS 模式解决。

## 详细规范
如需更多细节，参考 @.claude/standards/topics/后端开发规范/03-三、分层架构规范.md
