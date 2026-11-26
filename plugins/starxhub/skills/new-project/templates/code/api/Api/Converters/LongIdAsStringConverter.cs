using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Json.Serialization.Metadata;

namespace {{CodeName}}.Api.Converters;

/// <summary>
/// 把名为 Id / *Id 的 long 字段序列化为字符串，反序列化时接受字符串或数字。
/// <para>雪花 ID 为 19 位，超出 JS 安全整数范围；Count / Total 等普通数值字段不受影响。</para>
/// </summary>
public sealed class LongIdAsStringConverter : JsonConverter<long>
{
    public override long Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
        {
            var raw = reader.GetString();
            return long.TryParse(raw, out var value) ? value : 0;
        }
        return reader.GetInt64();
    }

    public override void Write(Utf8JsonWriter writer, long value, JsonSerializerOptions options)
        => writer.WriteStringValue(value.ToString());
}

/// <summary>把转换器挂到所有 Id / *Id 的 long 属性上。</summary>
public static class LongIdJsonModifier
{
    public static void Apply(JsonTypeInfo typeInfo)
    {
        if (typeInfo.Kind != JsonTypeInfoKind.Object) return;
        foreach (var property in typeInfo.Properties)
        {
            if (property.PropertyType == typeof(long) && IsIdProperty(property.Name))
                property.CustomConverter = new LongIdAsStringConverter();
        }
    }

    private static bool IsIdProperty(string name) =>
        name == "Id" || name.EndsWith("Id", StringComparison.Ordinal);
}
