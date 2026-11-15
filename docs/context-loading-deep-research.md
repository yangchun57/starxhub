# 大量规范文档如何及时准确加载到 AI 上下文 — 深度调研报告

> 基于 2025-2026 年最新文献与业界实践
> 调研日期：2026-10-10
> 文献来源：15 篇（Anthropic 官方、Martin Fowler、Codified Context 论文、Kiro/AWS、业界实践等）

---

## 一、核心矛盾

```
128K~1M token 上下文窗口  vs  10MB+ 的规范文档
         ↑                            ↑
    LLM 物理极限                   真实数据规模
         └──────── 差 1000x ─────────┘
```

**更致命的问题不是"装不下"，而是"装进去了也没用"**：

| 现象 | 文献依据 |
|------|----------|
| **上下文腐烂 (Context Rot)** | 长会话中间信息召回率下降 30%+（byteiota/Redis 研究） |
| **Lost in the Middle** | 长上下文模型对中间位置信息召回率显著低于首尾（Lost in the Middle 研究） |
| **Stuffed Prompt** | 塞太多文档导致 agent 迷失方向，指令冲突，输出错误（Sadogursky & Debois, 2026） |
| **注意力稀释** | 超过 ~200K token 后，模型性能下降 20-30%（ai-master.cc 研究） |
| **Victory Declaration Bias** | agent 声称完成但实际未验证，是头号失败模式（Faros 2026） |

**Anthropic 2026.07 的极端验证**：删除 Claude Code 自身 system prompt 的 80%，编码评测无性能损失。大部分被删内容是"旧约束变成的冲突噪音"。

**核心结论**：不是"加载越多越好"，而是"精确加载最相关的最小集合"。

---

## 二、业界方案全景：七种加载机制

来源：Anthropic 官方博客 "Steering Claude Code"（2026）

| 机制 | 何时加载 | 压缩后行为 | 上下文成本 | 适用场景 |
|------|---------|-----------|-----------|---------|
| **CLAUDE.md (根目录)** | 会话开始，始终在上下文中 | 记忆化，压缩后重新读取 | 高（每行都消耗 token） | 构建命令、目录结构、团队规范 |
| **CLAUDE.md (子目录)** | 按需，当读取该子目录文件时 | 直到再次触及该子目录 | 低（仅相关时才加载） | 子目录特定规范 |
| **Rules (.claude/rules/)** | 会话开始（无 scope）或匹配文件时（path-scoped） | 压缩后重新注入 | 中 | 特定约束（API handler 必须 Zod 校验） |
| **Skills (.claude/skills/)** | 名称+描述在会话开始加载；完整内容按需 | 按共享预算重新注入 | 低（98% 延迟到触发时） | 程序化工作流（部署、审查） |
| **Subagents (.claude/agents/)** | 名称+描述+工具列表在会话开始 | 仅最终消息返回主会话 | 极低（独立上下文窗口） | 并行工作、深度搜索 |
| **Hooks** | 生命周期事件触发 | 绕过压缩 | 低 | 确定性自动化（lint、备份） |
| **@import 引用** | CLAUDE.md 中用 `@path` 引入其他文件 | 随主文件一起 | 中（展开后计入） | 共享 AGENTS.md、跨工具复用 |

### 关键发现

1. **`@path` 引用是原生支持的**：CLAUDE.md 中可以使用 `@path/to/file`（最大深度 5 层），会在会话开始时展开加载
2. **Path-scoped rules 是最精准的自动加载机制**：只有编辑匹配文件时才注入
3. **Skills 是"懒加载"的最佳载体**：名称常驻（60 token），完整内容延迟到触发时（2500+ token）
4. **Subagents 是零成本加载**：完全独立上下文，只返回摘要

---

## 三、三种主流架构模式

### 模式 A：Codified Context 三层架构

来源：Aristidis Vasilopoulos, arXiv:2602.20478, 2026.02

一位化学家使用此架构，70 天内独自用 Claude Code 写了 108,256 行 C# 代码。

```
┌─────────────────────────────────────────────┐
│  Tier 1: Constitution（宪法层）               │
│  ~660 行 · 始终加载 · 热记忆                  │
│  编码标准 + 构建命令 + 触发路由表              │
├─────────────────────────────────────────────┤
│  Tier 2: Specialized Agents（专家层）          │
│  19 个 agent · ~9,300 行 · 触发式加载          │
│  修改网络同步文件 → 自动调用                   │
│  network-protocol-designer                   │
├─────────────────────────────────────────────┤
│  Tier 3: Knowledge Base（知识库层）            │
│  34 个 spec · ~16,250 行 · MCP 按需检索       │
│  冷记忆，不消耗上下文直到被搜索到               │
└─────────────────────────────────────────────┘
```

**关键数据**：
- 知识/代码比 = 24.2%（每 4 行代码对应 1 行上下文文档）
- 维护成本：每会话 ~5 分钟更新 spec + 每两周 30-45 分钟审查
- 283 行的存档系统 spec 经过 74 次迭代，零存档相关 bug

### 模式 B：Martin Fowler 五维决策框架

来源：Martin Fowler, "Context Engineering for Coding Agents", 2026

每个上下文加载机制在五个维度上定位：

| 维度 | 说明 |
|------|------|
| **What** | 传递什么：Guidance（指导）/ Instructions（指令）/ Documentation（文档） |
| **Who loads** | 谁决定加载：Agent Software（确定性）/ LLM（概率性）/ Human（手动） |
| **When** | 何时加载：Session start / On-demand / Triggered |
| **Compaction** | 压缩后：Preserved（保留）/ Re-injected（重新注入）/ Lost（丢失） |
| **Cost** | 上下文成本：High / Medium / Low / Zero |

**Martin Fowler 的核心建议**：
> "Allowing the LLM to decide when to load context is a prerequisite for running agents in an unsupervised way. But there always remains some uncertainty if the LLM will actually load the context when we would expect it to."
>
> "允许 LLM 自行决定何时加载上下文是无监督运行的前提。但 LLM 是否真的会在你期望时加载，始终存在不确定性。"

### 模式 C：中国四架构（指令层 + 知识层 + 检索层 + 压缩层）

来源：中国 AI 工程社区, 2026

```
┌─────────────────────────────────────────┐
│  指令层 (Instruction Layer)              │
│  静态规则：CLAUDE.md / rules / AGENTS.md  │
│  特点：确定性加载，始终或按路径             │
├─────────────────────────────────────────┤
│  知识层 (Knowledge Layer)                │
│  动态检索：MCP Server / RAG / 向量库      │
│  特点：按需检索，BM25 + 语义 + RRF 混合    │
├─────────────────────────────────────────┤
│  检索层 (Retrieval Layer)                │
│  混合搜索：结构化索引 + 语义搜索            │
│  决策规则：<100K token → RAG              │
│           >100K token → 混合              │
├─────────────────────────────────────────┤
│  压缩层 (Compression Layer)              │
│  历史压缩 + 结构化摘要                     │
│  工具输出替换为引用（metadata 指针）        │
└─────────────────────────────────────────┘
```

---

## 四、核心方法论：六大策略

### 策略 1：渐进式披露 (Progressive Disclosure)

**原则**：不在会话开始一次性灌入，而是按需、按路径、按任务加载。

```
会话开始
  │
  ├── 始终加载：CLAUDE.md (<200 行) + 无 scope 的 rules
  │
  ├── 路径触发：path-scoped rules（编辑匹配文件时）
  │
  ├── 名称常驻：Skills 的名称+描述 (~60 token/skill)
  │
  └── 按需加载：Skills 完整内容 / Standards / Knowledge Base
```

**Skills 的经济性**：
- 名称+描述常驻：~60 token
- 完整内容：~2500 token
- 98% 的成本延迟到实际触发时才支付
- 多个 Skills 共享预算，最旧的先丢弃

### 策略 2：子代理隔离 (Subagent Isolation)

**原则**：上下文消耗大的工作委托给子代理，各自维护干净上下文。

```
主会话（干净上下文）
  │
  ├── 子代理 A：深度代码搜索（消耗 50K token）
  │     └── 返回：200 token 摘要
  │
  ├── 子代理 B：日志分析（消耗 30K token）
  │     └── 返回：150 token 结论
  │
  └── 子代理 C：依赖审计（消耗 40K token）
        └── 返回：300 token 报告
```

**关键数据**：
- 子代理可嵌套 5 层深
- 动态工作流可编排数十到数百个后台代理
- 编排计划和中间结果在脚本变量中，不在上下文窗口中

### 策略 3：结构化笔记 (Structured Note-Taking)

**原则**：agent 在工作过程中将持久状态写入文件，压缩/重启后重新读取。

```
工作过程中
  │
  ├── plan.md（带 checkbox 的计划文件）
  ├── decisions.md（架构决策记录）
  ├── findings.md（发现日志）
  └── corrections.md（纠错日志）

压缩/重启后
  │
  └── 重新读取上述文件 → 完整保真度恢复
```

**这就是 Spec-Driven Development 同时也是上下文策略的原因**：spec 是 agent 可以随时重新锚定的笔记。

### 策略 4：MCP 外部化检索 (Offload + RAG)

**原则**：大文本存文件/向量库，prompt 里只放指针 + 检索片段。

```
prompt 中：
  "数据库规范详见 @standards/database-spec.md"
  "（MCP 可检索 34 个 spec 文档）"

实际使用时：
  agent 通过 MCP 搜索 → 获取相关片段 → 注入上下文
```

**Mintlify Index 实测数据**（200 次检索任务，10 个文档站点）：
- 任务完成时间下降 52.1%
- 输入 token 使用量下降 44.8%

### 策略 5：确定性 Hooks (Deterministic Automation)

**原则**：不依赖 LLM "记住"要做什么，而是用 Hooks 在生命周期事件时自动执行。

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "command": "lint-and-format.sh"
    }],
    "PreToolUse": [{
      "matcher": "Write|Edit",
      "command": "block-protected-files.sh"
    }],
    "Stop": [{
      "command": "pre-stop-verify.sh"
    }]
  }
}
```

**Hooks 绕过压缩**，是保障规范执行的最后一道防线。

### 策略 6：反馈闭环 (Correction Loop)

**原则**：每一次 agent 违规都应该永久改善 harness。

```
agent 犯错
  → 记录到 corrections.md
  → 分析根因（规则缺失？规则模糊？规则冲突？）
  → 修改对应层级的规则文件
  → 运行 drift-check 验证
  → 提交 PR, 团队 review
  → 规则永久生效
```

**Hashimoto 原则**：
> "每次发现 agent 犯了一个错误，就花时间工程化一个解决方案，让 agent 永远不再犯同样的错。"

---

## 五、对你当前项目的诊断

### 当前架构

```
.claude/
├── settings.json          # Hooks 配置 ✅
├── rules/                 # L1: 路径范围规则 ✅（已增强）
│   ├── _always/           #   trigger: always
│   ├── _backend/          #   paths: 后端文件
│   └── _frontend/         #   paths: 前端文件
├── agents/                # 20 个角色定义 ✅
├── commands/              # 11 个命令 ✅
├── hooks/                 # 2 个钩子脚本 ✅
└── standards/             # 100+ 详细规范文档 ✅
    └── topics/            #   按主题分目录
```

### 问题诊断

| 问题 | 严重度 | 说明 |
|------|--------|------|
| **standards/ 无自动加载机制** | 🔴 高 | 100+ 文档只能通过 rules 中的 `@path` 引用，但 `@path` 在 rules 中不是 Claude Code 原生支持的（只在 CLAUDE.md 中原生支持） |
| **缺少 CLAUDE.md 根文件** | 🔴 高 | 没有 L0 宪法层，缺少项目级铁律和架构地图 |
| **agents/ 未被 rules 或 skills 关联** | 🟡 中 | 20 个 agent 定义存在，但没有触发路由表 |
| **commands/ 与 skills/ 混用** | 🟡 中 | Claude Code 已弃用 commands，迁移到 skills |
| **standards 无索引/检索入口** | 🟡 中 | 没有 MCP 服务器或搜索机制让 agent 按需检索 |
| **缺少 corrections.md** | 🟡 中 | 没有纠错反馈闭环 |
| **缺少 drift-check** | 🟢 低 | 没有规范漂移检测 |

---

## 六、推荐方案：五层上下文架构

基于调研，为你的项目量身定制：

```
┌───────────────────────────────────────────────────────────┐
│  L0: 宪法层 (CLAUDE.md)                                    │
│  < 200 行 · 始终加载 · 项目铁律 + 架构地图 + 加载路由表      │
│  新增文件，放在项目根目录                                    │
├───────────────────────────────────────────────────────────┤
│  L1: 路径规则层 (.claude/rules/)                            │
│  已增强 ✅ · path-scoped 自动加载                            │
│  每个文件自包含关键约束 + 代码示例                            │
├───────────────────────────────────────────────────────────┤
│  L2: 技能层 (.claude/skills/)                               │
│  将 commands/ 迁移到 skills/                                │
│  名称常驻 + 完整内容按需加载                                  │
│  每个 skill 包含触发描述 + 执行步骤 + 引用 standards          │
├───────────────────────────────────────────────────────────┤
│  L3: 知识库层 (.claude/standards/)                          │
│  通过 CLAUDE.md 的 @import 引入索引文件                      │
│  或通过 MCP 服务器按需检索                                    │
│  agent 遇到不确定问题时主动查阅                               │
├───────────────────────────────────────────────────────────┤
│  L4: 保障层 (Hooks + Corrections + Drift Check)             │
│  Hooks: 编码后自动 lint + 保护受保护文件                      │
│  Corrections: 纠错日志 → 反馈到规则                          │
│  Drift Check: CI 集成规范漂移检测                            │
└───────────────────────────────────────────────────────────┘
```

### 具体实施步骤

#### Step 1: 创建 CLAUDE.md 根文件（L0 宪法层）

```markdown
# Project: multi-agent-scaffold

## 技术栈
- 后端: .NET 8 (SqlSugar) / Python 3.12 (FastAPI + SQLAlchemy 2.0)
- 前端: Vue 3 + Element Plus / uni-app + Vue 3
- 多租户: 所有业务表必须 tenant_id，所有查询必须租户过滤

## 命令
- 构建: `dotnet build` / `npm run build`
- 测试: `dotnet test` / `npm test`
- Lint: `dotnet format --verify-no-changes` / `npm run lint`

## 铁律
- 所有业务表必须包含 tenant_id（BIGINT, NOT NULL）
- 所有 API handler 必须有入参校验
- 禁止 Controller/handler 内含业务逻辑
- 禁止跨租户数据访问
- 数据库 schema 变更必须通过迁移脚本

## 架构地图
- API 层: Controllers/ 或 app/routers/ → 参考 .claude/rules/_backend/backend-api.*
- 领域层: Services/ 或 app/services/ → 参考 .claude/rules/_backend/backend-domain.*
- 基础设施: Models/ 或 app/models/ → 参考 .claude/rules/_backend/backend-infra.*
- 前端页面: src/views/ 或 src/pages/ → 参考 .claude/rules/_frontend/frontend-pages.*
- 前端状态: src/stores/ + src/api/ → 参考 .claude/rules/_frontend/frontend-state.*

## 规范加载路由表
| 编辑文件 | 自动加载规则 | 深度参考 |
|---------|------------|---------|
| **/*.cs (Controller) | rules/_backend/backend-api.dotnet.md | standards/topics/后端开发规范/ |
| **/*.cs (Service) | rules/_backend/backend-domain.dotnet.md | standards/topics/后端开发规范/ |
| **/*.cs (Model) | rules/_backend/backend-infra.dotnet.md | standards/topics/后端开发规范/ |
| app/routers/**/*.py | rules/_backend/backend-api.python.md | standards/topics/Python后台开发规范/ |
| app/services/**/*.py | rules/_backend/backend-domain.python.md | standards/topics/Python后台开发规范/ |
| src/views/**/*.vue | rules/_frontend/frontend-pages.vue.md | standards/topics/前端开发规范/ |
| src/pages/**/*.vue | rules/_frontend/frontend-pages.uniapp.md | standards/topics/uni-app开发规范/ |
| src/stores/**/*.ts | rules/_frontend/frontend-state.*.md | standards/topics/前端开发规范/ |

## 何时查阅 standards
当你需要了解某个主题的完整细节时，主动读取对应的 standards 文件：
- 安全编码 → standards/topics/安全编码规范/
- 认证授权 → standards/topics/后端开发规范/07-七、认证授权规范.md
- 测试规范 → standards/topics/后端开发规范/12-十二、测试规范.md
- Excel 导出 → standards/topics/Excel导出功能规范/
- 并发控制 → standards/topics/并发与资源管理规范/
- 前端健壮性 → standards/topics/前端工程健壮性规范/

## 绝对不做
- 不提交 .env 或密钥
- 不在没有测试的情况下合并
- 不自行升级依赖版本
```

#### Step 2: 将 commands/ 迁移到 skills/

```
.claude/skills/
├── code-review/SKILL.md        # 从 commands/review.md 迁移
├── new-feature/SKILL.md        # 从 commands/new-feature.md 迁移
├── fix-bug/SKILL.md            # 从 commands/fix-bug.md 迁移
├── deploy/SKILL.md             # 从 commands/deploy.md 迁移
├── gen-tests/SKILL.md          # 从 commands/gen-tests.md 迁移
└── req-review/SKILL.md         # 从 commands/req-review.md 迁移
```

每个 SKILL.md 的 description 字段是触发关键——要写清楚何时触发。

#### Step 3: 创建 standards 索引文件

```markdown
<!-- .claude/standards/INDEX.md -->
# 规范知识库索引

> 本文件是 standards/ 目录的检索入口。
> Agent 在需要了解某个主题的完整细节时，读取对应文件。

## 按场景索引
| 场景 | 读取文件 |
|------|---------|
| 设计新 API | topics/后端开发规范/06-六、API-设计规范.md |
| 数据库操作 | topics/后端开发规范/08-八、数据库操作规范.md |
| 认证授权 | topics/后端开发规范/07-七、认证授权规范.md |
| 安全编码 | topics/安全编码规范/ |
| 前端组件 | topics/前端开发规范/02-二、组件开发规范.md |
| 前端性能 | topics/前端开发规范/09-九、性能优化规范.md |
| 测试 | topics/后端开发规范/12-十二、测试规范.md |
| Excel 导出 | topics/Excel导出功能规范/ |
| 并发控制 | topics/并发与资源管理规范/ |
| 前端健壮性 | topics/前端工程健壮性规范/ |
| Python 后台 | topics/Python后台开发规范_v0.1/ |
| uni-app | topics/uni-app开发规范_v1.0/ |
| 移动端 | topics/移动端开发规范_v1.0/ |
```

#### Step 4: 创建 corrections.md

```markdown
<!-- .claude/corrections.md -->
# 纠错日志

> 每次 agent 犯错，记录并转化为规则。

## 格式
### YYYY-MM-DD: 错误描述
- 根因: 规则缺失？规则模糊？规则冲突？
- 修复: 修改了哪个文件
- 状态: ✅ 已修复 / 🔧 进行中
```

---

## 七、各方案对比总结

| 方案 | 适用规模 | 实施成本 | 可靠性 | 推荐度 |
|------|---------|---------|--------|--------|
| **CLAUDE.md + path-scoped rules** | 小-中 | 低 | 高（原生支持） | ⭐⭐⭐⭐⭐ |
| **Skills 懒加载** | 中-大 | 中 | 高（原生支持） | ⭐⭐⭐⭐⭐ |
| **Subagent 隔离** | 大 | 中 | 高（零上下文成本） | ⭐⭐⭐⭐ |
| **MCP 检索** | 大-超大 | 高 | 中（依赖检索质量） | ⭐⭐⭐ |
| **Hooks 保障** | 所有规模 | 低 | 极高（确定性） | ⭐⭐⭐⭐⭐ |
| **Corrections 闭环** | 所有规模 | 低 | 渐进增强 | ⭐⭐⭐⭐ |
| **Drift Check CI** | 中-大 | 中 | 高（自动化） | ⭐⭐⭐ |

---

## 八、参考文献

1. Anthropic. "Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents." 2026. https://claude.com/it/blog/steering-claude-code-skills-hooks-rules-subagents-and-more
2. Vasilopoulos, Aristidis. "Codified Context." arXiv:2602.20478, February 2026.
3. Fowler, Martin. "Context Engineering for Coding Agents." 2026. https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html
4. AgentWay. "CLAUDE.md & Memory." 2026. https://agentway.dev/en/claudecode/claude-md
5. ClaudeFolio. "CLAUDE.md and auto memory." 2026. https://claudefolio.com/guides/claude-md-and-auto-memory
6. Wavise. "Context Engineering Patterns for AI Agents 2026." https://openllm.wavise.com/blog/context-engineering-patterns-ai-agents
7. Wikantik. "Context Engineering for Coding Agents." 2026. https://wiki.wikantik.com/wiki/ContextEngineeringForCodingAgents
8. SkillWright. "Context Engineering for AI Coding Agents." 2026. https://skillwright.app/blog/context-engineering-ai-coding
9. TechGig. "Optimising AI Agent Context: Skills, Memory, Evals." 2026.
10. Undercode Testing. "The AI Coding Assistant Productivity Playbook." 2026.
11. AWS. "Kiro: Spec-Driven Development." https://kiro.dev
12. DEV Community. "Codified Context: A chemist wrote 100K lines of game code alone." 2026.
13. CSDN. "当 LLM 遇见大文档: 主流开源项目如何处理上下文超限." 2026.
14. AI Dynamics. "Coding Agents Excel at Processing Massive Long-Context Documents." 2026.
15. Mintlify. "8 best context engineering tools for coding agents in 2026."
