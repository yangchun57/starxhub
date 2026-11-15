---
name: code-review
description: AI 代码审查。按 .claude/rules/ 中定义的规范自动扫描代码，检查多租户红线、API 规范、分层边界、安全漏洞、性能反模式等，输出分级问题清单（Blocker / Major / Minor）并给出修复建议。当用户需要代码审查、提交前检查、或定期质量巡检时使用。
---

# AI 代码审查（Code Review）

## Purpose

基于项目定义的 rules 规范，自动扫描代码文件，识别违规、风险、反模式，输出可执行的修复建议。

## 适用场景

- **提交前检查**：PR 合并前的自动化审查
- **定期质量巡检**：每周/每月的代码质量评估
- **新人代码审查**：帮助新成员快速了解团队规范
- **重构后验证**：确保重构没有引入新的违规

## 审查维度（8 类）

| # | 维度 | 检查内容 | 严重级别 |
|---|------|---------|---------|
| 1 | 多租户红线 | SQL 查询无 tenant_id 过滤、跨租户数据访问 | Blocker |
| 2 | 分层边界 | Controller 直接访问 DB、Service 返回 View 对象 | Major |
| 3 | API 规范 | 响应格式不统一、缺少错误处理、HTTP 方法误用 | Major |
| 4 | 安全漏洞 | SQL 注入、XSS、硬编码密钥、敏感信息泄露 | Blocker |
| 5 | 性能反模式 | N+1 查询、缺少索引、大对象序列化、内存泄漏 | Major |
| 6 | 命名规范 | 不符合团队命名约定、中英文混用、缩写不当 | Minor |
| 7 | 代码复杂度 | 函数过长（>50 行）、嵌套过深（>3 层）、圈复杂度高 | Minor |
| 8 | 测试覆盖 | 关键逻辑无测试、测试用例不完整 | Minor |

## 执行流程

1. **确认审查范围**
   - 用户调用 `/code-review [path] [--scope all|changed|staged]`
   - `all`：审查整个项目（默认）
   - `changed`：只审查最近 N 天修改的文件
   - `staged`：只审查 git 暂存区的文件

2. **加载 rules 规范**
   - 读取 `.claude/rules/` 目录下的所有 `.md` 文件
   - 解析规范中的检查规则（正则、关键词、模式）

3. **扫描代码文件**
   - 根据技术栈选择文件扩展名（.cs / .py / .ts / .vue）
   - 跳过 node_modules、bin、obj、.git 等目录
   - 对每个文件执行 8 类检查

4. **生成问题清单**
   - 按严重级别分组（Blocker / Major / Minor）
   - 每个问题包含：文件路径、行号、问题描述、修复建议

5. **输出报告**
   - Markdown 格式报告保存到 `docs/code-review-report.md`
   - 控制台输出摘要（问题总数、各级别数量）

6. **可选：自动修复**
   - 对可自动修复的问题（如格式化、命名规范）提供一键修复
   - 修复后重新扫描，验证修复效果

## 报告结构

```markdown
# 代码审查报告

**项目路径**：/path/to/project  
**审查时间**：2026-10-12 16:00  
**审查范围**：全部文件（128 个）  
**发现问题**：23 个（Blocker: 2, Major: 8, Minor: 13）

## 问题汇总

| 严重级别 | 数量 | 问题清单 |
|---------|------|---------|
| Blocker | 2 | 多租户红线风险、SQL 注入漏洞 |
| Major | 8 | 分层边界违背、API 响应不统一、N+1 查询 |
| Minor | 13 | 命名不规范、函数过长、缺少注释 |

## 详细问题清单

### Blocker 级问题

#### 1. 多租户红线：SQL 查询无 tenant_id 过滤
- **文件**：src/backend/api/Services/UserService.cs
- **行号**：42
- **代码**：
  ```csharp
  var users = await _db.Queryable<User>().Where(x => x.Status == 1).ToListAsync();
  ```
- **问题**：查询未带 tenant_id 过滤，可能访问其他租户数据
- **修复**：
  ```csharp
  var users = await _db.Queryable<User>()
      .Where(x => x.Status == 1 && x.TenantId == currentTenantId)
      .ToListAsync();
  ```

#### 2. 安全漏洞：SQL 注入风险
- **文件**：src/backend/api/Controllers/OrderController.cs
- **行号**：67
- **代码**：
  ```csharp
  var sql = $"SELECT * FROM Orders WHERE Id = {orderId}";
  ```
- **问题**：字符串拼接 SQL，存在注入风险
- **修复**：使用参数化查询或 ORM

...

### Major 级问题

#### 1. 分层边界违背：Controller 直接访问 DB
- **文件**：src/backend/api/Controllers/ProductController.cs
- **行号**：23
- **问题**：Controller 中直接使用 `_db.Queryable<Product>()`，违背分层架构
- **修复**：将数据访问逻辑移到 Service 层

...

## 修复建议（按优先级）

### P0 - 立即修复（Blocker）
1. 修复多租户红线问题（2 处）
2. 修复 SQL 注入漏洞（1 处）

### P1 - 本周修复（Major）
1. 重构 Controller 中的数据访问逻辑（3 处）
2. 统一 API 响应格式（5 处）

### P2 - 本月修复（Minor）
1. 优化过长函数（5 处）
2. 补充命名规范（8 处）

## 质量评分

| 维度 | 得分 | 说明 |
|------|------|------|
| 安全性 | 60 / 100 | 存在 SQL 注入风险 |
| 多租户隔离 | 40 / 100 | 2 处红线违规 |
| 分层架构 | 75 / 100 | 3 处边界违背 |
| API 规范 | 70 / 100 | 响应格式不统一 |
| 代码质量 | 85 / 100 | 整体良好，少量反模式 |

**综合评分**：66 / 100（D 级，需立即整改）
```

## 评分规则

| 维度 | 满分 | 扣分规则 |
|------|------|---------|
| 安全性 | 20 | 每个 Blocker -10 |
| 多租户隔离 | 20 | 每个红线违规 -10 |
| 分层架构 | 20 | 每个边界违背 -5 |
| API 规范 | 20 | 每个不规范 -2 |
| 代码质量 | 20 | 每个反模式 -2 |

## 自动修复能力

以下问题可由脚本自动修复（需用户确认）：

- [ ] 格式化问题（缩进、空格、换行）
- [ ] 命名规范（驼峰、帕斯卡）
- [ ] 缺少注释（自动生成 TODO 注释）
- [ ] 简单的分层重构（提取 Service 方法）

## Skill 布局

```
code-review/
├── SKILL.md              ← 本文件
├── .skill-metadata.yaml  ← Skill 元数据
└── scripts/
    └── code_review.py    ← 审查脚本
```

## References

- 审查脚本：scripts/code_review.py
- 报告输出：docs/code-review-report.md（默认）
- 规范来源：.claude/rules/*.md
