---
name: health-check
description: 项目健康度巡检。扫描已有项目的 .claude/ 配置完整性、Agent 与技术栈匹配度、rules 覆盖度、多租户红线风险、测试覆盖率、CI 脚本存在性等，输出结构化 Markdown 报告并给出整改建议。当用户需要评估项目状态、检查配置完整性、或定期巡检时使用。
---

# 项目健康度巡检（Health Check）

## Purpose

对已有项目进行全方位健康度检查，识别配置缺失、规范违背、潜在风险，输出可执行的整改建议。

## 适用场景

- 项目交接：新团队接手前评估现状
- 定期巡检：月度/季度健康检查
- 上线前检查：发布前的最终确认
- 问题排查：定位"为什么 Agent 不工作"的根因

## 巡检维度（9 项）

| # | 维度 | 检查内容 | 严重级别 |
|---|------|---------|---------|
| 1 | .claude/ 配置完整性 | settings.json、agents/、commands/、hooks/、rules/ 是否存在 | Blocker |
| 2 | Agent 定义与技术栈匹配 | Agent 数量是否达标（24 个）、model 配置是否合理 | Major |
| 3 | rules 覆盖度 | _always 通用规则 + 后端规则 + 前端规则是否齐全 | Major |
| 4 | standards 存在性 | 技术栈相关规范是否已载入、topics 索引是否生成 | Minor |
| 5 | hooks 配置 | pre_commit_guard.py、tenant_guard.py 是否存在且可执行 | Major |
| 6 | CLAUDE.md TODO 完成度 | 项目速览、红线、技术栈等占位符是否已填写 | Blocker |
| 7 | 多租户红线扫描 | 代码中是否存在跨租户数据访问风险（SQL 无 tenant_id 过滤） | Blocker |
| 8 | 测试文件存在性 | tests/ 目录是否存在、是否有测试文件 | Minor |
| 9 | CI 脚本存在性 | scripts/ci.sh、.githooks/pre-push 是否存在且可执行 | Minor |

## 执行流程

1. **确认目标项目路径**：用户调用 `/health-check <path>` 或交互式询问
2. **运行巡检脚本**：`python scripts/health_check.py <target-dir>`
3. **生成报告**：输出 Markdown 格式报告到 `docs/health-check-report.md`
4. **解读报告**：向用户说明关键问题、严重级别、整改优先级
5. **可选：自动修复**：对可自动修复的问题（如缺失的 hooks 文件）提供一键修复

## 报告结构

```markdown
# 项目健康度巡检报告

**项目路径**：/path/to/project  
**巡检时间**：2026-10-12 15:30  
**总体评分**：72 / 100（B 级）

## 问题汇总

| 严重级别 | 数量 | 问题清单 |
|---------|------|---------|
| Blocker | 2 | CLAUDE.md TODO 未填写、多租户红线风险 |
| Major | 3 | 缺少 2 个 Agent 定义、rules 覆盖不全、hooks 不可执行 |
| Minor | 4 | standards topics 未生成、测试文件不足、CI 脚本缺失 |

## 详细检查结果

### 1. .claude/ 配置完整性 [PASS]
- [x] settings.json 存在
- [x] agents/ 目录存在（24 个 Agent）
- [x] commands/ 目录存在（11 个命令）
- [x] hooks/ 目录存在
- [x] rules/ 目录存在

### 2. Agent 定义与技术栈匹配 [WARN]
- [x] 24 个 Agent 定义完整
- [ ] backend-dev 的 model 配置为 sonnet，建议改为 opus（复杂业务逻辑）
- [ ] 缺少 db-engineer 的 SQL 审查规则

...

## 整改建议（按优先级）

### P0 - 立即修复（Blocker）
1. **CLAUDE.md TODO 未填写**
   - 问题：项目速览、红线、技术栈等关键信息仍为占位符
   - 影响：Agent 无法理解项目上下文，可能生成不符合要求的代码
   - 修复：手动填写 CLAUDE.md 中的 TODO 项，或运行 `/product-discovery` 自动生成

2. **多租户红线风险**
   - 问题：发现 3 处 SQL 查询未带 tenant_id 过滤
   - 文件：src/backend/api/Services/UserService.cs:42, 67, 89
   - 修复：添加 `.Where(x => x.TenantId == currentTenantId)` 过滤条件

### P1 - 本周修复（Major）
...

### P2 - 本月修复（Minor）
...
```

## 评分规则

| 维度 | 满分 | 扣分规则 |
|------|------|---------|
| .claude/ 配置完整性 | 15 | 缺一项 -3 |
| Agent 定义与技术栈匹配 | 15 | 缺一个 Agent -1，model 配置不当 -2 |
| rules 覆盖度 | 10 | 缺 _always 规则 -3，缺后端/前端规则 -2 |
| standards 存在性 | 5 | 缺规范文件 -2，缺 topics 索引 -1 |
| hooks 配置 | 10 | 缺文件 -5，不可执行 -3 |
| CLAUDE.md TODO 完成度 | 15 | 每个未填 TODO -3 |
| 多租户红线扫描 | 15 | 每处红线风险 -5 |
| 测试文件存在性 | 10 | 无 tests/ 目录 -5，测试文件 < 5 个 -3 |
| CI 脚本存在性 | 5 | 缺 ci.sh -3，缺 pre-push -2 |

**总分等级**：
- 90-100：A 级（优秀）
- 80-89：B 级（良好）
- 70-79：C 级（合格，需改进）
- 60-69：D 级（不合格，需立即整改）
- < 60：F 级（严重问题，项目可能无法正常运行）

## 自动修复能力

以下问题可由脚本自动修复（需用户确认）：

- [ ] 缺失的 hooks 文件（从模板复制）
- [ ] hooks 文件不可执行（chmod +x）
- [ ] 缺失的 rules 文件（按技术栈生成）
- [ ] 缺失的 CI 脚本（按技术栈生成）
- [ ] standards topics 索引未生成（运行 split-standards.py）

## Skill 布局

```
health-check/
├── SKILL.md              ← 本文件
├── .skill-metadata.yaml  ← Skill 元数据
└── scripts/
    └── health_check.py   ← 巡检脚本
```

## References

- 巡检脚本：scripts/health_check.py
- 报告输出：docs/health-check-report.md（默认）
- 相关 Skill：new-project（生成时已包含基础配置）
