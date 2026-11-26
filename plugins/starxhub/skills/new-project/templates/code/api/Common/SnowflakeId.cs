using SqlSugar;

namespace {{CodeName}}.Common;

/// <summary>
/// 雪花 ID 生成器（进程内单例，包装 SqlSugar.SnowFlakeSingle）。
/// <para>启动时必须调用 <see cref="Init"/> 设置 WorkId（1-30）；多实例部署时每个实例使用不同 WorkId，
/// 否则会生成重复主键。</para>
/// </summary>
public static class SnowflakeId
{
    /// <summary>设置 WorkId，进程启动时调用一次。</summary>
    public static void Init(int workId)
    {
        if (workId < 1 || workId > 30)
            throw new ArgumentOutOfRangeException(nameof(workId), "WorkId 必须在 1-30 之间");
        SnowFlakeSingle.WorkId = workId;
    }

    /// <summary>生成下一个雪花 ID（19 位）。</summary>
    public static long NewId() => SnowFlakeSingle.Instance.NextId();
}
