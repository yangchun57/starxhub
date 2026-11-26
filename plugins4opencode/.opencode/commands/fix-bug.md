---
description: "修复Bug（复现→根因→最小修复→回归验证→知识沉淀）"
subagent: false
---

请修复指定 Bug，全程遵循 AGENTS.md。

参数（$ARGUMENTS）：Bug 描述、缺陷报告路径或现象说明。缺省时先向用户询问缺陷信息，不要猜测。

**编排原则**：Bug 修复是角色工作，必须启动 bug-fixer subagent 完成，不要内联在主 Agent 做；提交、审查决策、汇报留在主 Agent。

## 第一步：派发修复（启动 bug-fixer subagent）
启动 bug-fixer，任务描述中注明 Bug 现象与已知线索。它执行五步闭环：
1. 复现优先（不能复现则汇报假设清单，停下等确认）
2. 根因定位（禁止治标不治本）
3. 最小修复（遵守红线，最小 diff）
4. 回归验证（先补失败测试再修复，全量测试通过）
5. 知识沉淀（必做：回写 `docs/00-项目文档/lessons-learned.md`，规范类教训同步更新 `.claude/standards/`）

## 第二步：提交（主 Agent）
修复与测试通过后立即提交：`fix: {Bug 简述}`；若沉淀更新了规范文档，追加提交 `docs: {规范名}补充{教训点}`。

## 第三步：审查（主 Agent 按需）
