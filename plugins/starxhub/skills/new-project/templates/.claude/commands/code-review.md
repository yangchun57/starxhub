---
description: AI 代码审查。按 .claude/rules/ 中定义的规范自动扫描代码，检查多租户红线、API 规范、分层边界、安全漏洞、性能反模式等，输出分级问题清单并给出修复建议。
---

# AI 代码审查

对当前项目进行自动化代码审查，识别违规、风险、反模式。

## 执行步骤

1. **确认审查范围**
   - 如果用户提供了路径参数，使用该路径
   - 否则使用当前工作目录
   - 确认审查范围：`all`（全部）、`changed`（最近 N 天）、`staged`（git 暂存区）

2. **运行审查脚本**
   ```bash
   python .claude/skills/code-review/scripts/code_review.py . --scope all --output docs/code-review-report.md
   ```

3. **读取并解读报告**
   - 读取生成的 `docs/code-review-report.md`
   - 向用户说明：
     - 综合评分和等级
     - Blocker 级问题（必须立即修复）
     - Major 级问题（本周修复）
     - Minor 级问题（本月修复）

4. **提供修复建议**
   - 对每个问题给出具体的修复方法
   - 标注修复优先级（P0/P1/P2）
   - 提供修复代码示例

5. **可选：自动修复**
   - 如果用户同意，自动修复可修复的问题
   - 修复后重新审查，验证修复效果

## 审查维度

### 1. 多租户红线（Blocker）
- SQL 查询无 tenant_id 过滤
- 跨租户数据访问风险

### 2. 安全漏洞（Blocker）
- SQL 注入风险
- 硬编码密钥/密码
- 敏感信息泄露

### 3. 分层边界（Major）
- Controller 直接访问 DB
- Service 返回 View 对象

### 4. API 规范（Major）
- 响应格式不统一
- 缺少错误处理
- HTTP 方法误用

### 5. 性能反模式（Major）
- N+1 查询
- 缺少索引
- 大对象序列化

### 6. 代码复杂度（Minor）
- 函数过长（>50 行）
- 嵌套过深（>3 层）

### 7. 命名规范（Minor）
- 不符合团队命名约定
- 中英文混用

## 输出格式

向用户展示报告摘要：

```
## 代码审查结果

**综合评分**：XX / 100（X 级）
**扫描文件**：XX 个
**发现问题**：XX 个（Blocker: X, Major: X, Minor: X）

### 关键问题
1. [Blocker] 多租户红线：SQL 查询无 tenant_id 过滤（UserService.cs:42）
2. [Blocker] 安全漏洞：SQL 注入风险（OrderController.cs:67）
3. [Major] 分层边界：Controller 直接访问 DB（ProductController.cs:23）

### 修复建议
**P0 - 立即修复**
1. 修复多租户红线问题（2 处）
2. 修复 SQL 注入漏洞（1 处）

**P1 - 本周修复**
1. 重构 Controller 中的数据访问逻辑（3 处）
2. 统一 API 响应格式（5 处）

报告已保存到：docs/code-review-report.md
```

## 注意事项

- 审查脚本是只读的，不会修改任何文件
- 安全漏洞扫描基于静态分析，可能存在误报
- 建议定期运行审查（每周或每次 PR 前）
- 审查规则可根据项目实际情况调整（编辑 .claude/rules/*.md）
