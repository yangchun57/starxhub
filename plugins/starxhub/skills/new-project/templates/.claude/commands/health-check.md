---
description: 项目健康度巡检。扫描项目的 .claude/ 配置完整性、Agent 匹配度、rules 覆盖度#@@TENANT_ONLY_START、多租户红线风险#@@TENANT_ONLY_END、测试覆盖率、CI 脚本等，输出结构化报告并给出整改建议。
---

# 项目健康度巡检

对当前项目进行全方位健康度检查，识别配置缺失、规范违背、潜在风险。

## 执行步骤

1. **确认项目路径**
   - 如果用户提供了路径参数，使用该路径
   - 否则使用当前工作目录

2. **运行巡检脚本**
   ```bash
   python .claude/skills/health-check/scripts/health_check.py . --output docs/health-check-report.md
   ```

3. **读取并解读报告**
   - 读取生成的 `docs/health-check-report.md`
   - 向用户说明：
     - 总体评分和等级
     - Blocker 级问题（必须立即修复）
     - Major 级问题（本周修复）
     - Minor 级问题（本月修复）

4. **提供整改建议**
   - 对每个问题给出具体的修复方法
   - 标注哪些可以自动修复
   - 提供修复命令或代码示例

5. **可选：自动修复**
   - 如果用户同意，自动修复可修复的问题
   - 修复后重新运行巡检，验证修复效果

## 报告解读要点

### 评分等级
- **90-100（A 级）**：优秀，项目配置完整，无明显问题
- **80-89（B 级）**：良好，有少量 Minor 问题
- **70-79（C 级）**：合格，有 Major 问题需要修复
- **60-69（D 级）**：不合格，有 Blocker 问题
- **< 60（F 级）**：严重问题，项目可能无法正常运行

### 关键检查项
1. **.claude/ 配置完整性**：settings.json、agents/、commands/、hooks/、rules/ 是否齐全
2. **Agent 定义**：是否有 20 个 Agent，关键 Agent 的 model 配置是否合理
3. **rules 覆盖度**：通用规则 + 后端规则 + 前端规则是否完整
4. **CLAUDE.md TODO**：项目速览、红线、技术栈等是否已填写
#@@TENANT_ONLY_START
5. **多租户红线**：是否存在跨租户数据访问风险
#@@TENANT_ONLY_END
6. **测试覆盖率**：是否有足够的测试文件
7. **CI 脚本**：scripts/ci.sh 和 .githooks/pre-push 是否存在且可执行

## 输出格式

向用户展示报告摘要：

```
## 项目健康度巡检结果

**总体评分**：XX / 100（X 级）

### 问题汇总
- Blocker：X 个
- Major：X 个
- Minor：X 个

### 关键问题
1. [Blocker] ...
2. [Major] ...

### 整改建议
**P0 - 立即修复**
1. ...

**P1 - 本周修复**
1. ...

报告已保存到：docs/health-check-report.md
```

## 注意事项

- 巡检脚本是只读的，不会修改任何文件
#@@TENANT_ONLY_START
- 多租户红线扫描基于静态分析，可能存在误报
#@@TENANT_ONLY_END
- 评分规则可根据项目实际情况调整
- 建议定期运行巡检（每月或每次大版本发布前）
