using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Json.Serialization.Metadata;
using {{CodeName}}.Api.Converters;
using {{CodeName}}.Api.Filters;
using {{CodeName}}.Common;

var builder = WebApplication.CreateBuilder(args);

// 雪花 ID：启动时设置 WorkId（多实例部署务必用环境变量 Snowflake__WorkId 区分）
SnowflakeId.Init(int.Parse(builder.Configuration["Snowflake:WorkId"] ?? "1"));

// 控制器 + 全局异常过滤器
builder.Services.AddControllers(options =>
{
    options.Filters.Add<GlobalExceptionFilter>();
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    // 雪花 ID 以字符串下发，前端用 string 接收，避免 19 位精度丢失
    options.JsonSerializerOptions.NumberHandling = JsonNumberHandling.AllowReadingFromString;
    options.JsonSerializerOptions.TypeInfoResolver = new DefaultJsonTypeInfoResolver
    {
        Modifiers = { LongIdJsonModifier.Apply }
    };
});

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();
app.MapControllers();

app.Run();

// 集成测试 WebApplicationFactory<Program> 需要 Program 可见
public partial class Program { }
