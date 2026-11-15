# Superpowers 深度调研报告

> 调研对象：`obra/superpowers`（Claude Code / 多Harness Agent 方法论插件）
> 调研日期：2026-10-15
> 数据来源：GitHub REST API 实测 + 仓库源码通读 + Issue/RELEASE-NOTES 逐版本核对 + 社区评测交叉验证
> 报告版本：V1.0

---

## 一、结论先行

**一句话定性**：Superpowers 不是一个「技能插件」，而是**用 Markdown 写的、靠提示工程强制执行的软件工程方法论 + 运行时门禁系统**。它的核心资产不是代码（306 个文件、零运行时依赖、大部分是 `.md`），而是**一套被 2000+ 次真实会话验证过的「Agent 行为矫正协议」**。

**五个关键判断**：

| # | 判断 | 依据 |
|---|------|------|
| 1 | 它的护城河是「强制力」而非「内容质量」 | 技能本身全是公开最佳实践（TDD/调试/计划），任何人都能写；差异化在于 SessionStart Hook 注入 + `<HARD-GATE>` + 「合理化反驳表」，把建议变成了门禁 |
| 2 | 它把「写技能」本身工程化了 | `writing-skills` 技能明确要求：写技能 = 对提示词文档做 TDD，必须先跑基线看 Agent 怎么违背，再针对性写规则。这是全项目最值钱的一块 |
| 3 | Token/速度成本是真实的、结构性的争议 | Issue #743（26 评论）、#1152、#512 长期未闭环；社区实测「启动即吃 22k token」「10 分钟任务变 30–45 分钟」；作者多次压缩但未能根治 |
| 4 | 多 Harness 支持是真实的、非营销 | 16 个 Harness 各自有独立 manifest + bootstrap 注入器 + 工具映射参考 + 测试套件，还写了完整的移植指南。这是极高的工程完成度 |
| 5 | 对你的价值在「元方法论」而非「直接安装」 | 它的 TDD-for-skills、rationalization table、Review 不可被上游收买、evidence-before-claims 四条规则，可以直接嫁接到你的 PRD 技能集和多 Agent 脚手架 |

**给 PM/开发者的一句决策建议**：

- 日常小修小补、单文件改动 → **别装**（流程成本远超收益）
- 3+ 文件的跨模块特性、有架构决策的绿地开发 → **值得装**
- 只想要 TDD 纪律不想付全流程代价 → 只摘取 `test-driven-development` + `verification-before-completion` 两个技能

---

## 二、项目基本面（GitHub API 实测数据）

| 指标 | 数值 | 说明 |
|------|------|------|
| 仓库 | `obra/superpowers` | MIT License |
| Star | **299,023** | 2026-10-14 采样 |
| Fork | 26,711 | |
| Watcher | 1,103 | |
| Open Issues | 347 | |
| 创建时间 | 2025-10-09 | 至今 371 天 |
| 平均增速 | **~806 Star/天** | 顶级开源项目水平，GitHub Star 数前 50 |
| 最新版本 | **v7.0.0**（2026-10-09） | Tag `bb92a777` |
| 主贡献者 | `obra` 526 commits、`arittr` 79 commits | 高度集中但有第二核心 |
| 官方上架 | Anthropic 官方插件市场（`superpowers@claude-plugins-official`） | 已被第一方背书 |
| 官方声明安装量 | 100 万+ installs（作者自述） | 来自 blog.fsck.com 个人页 |
| 作者背景 | Jesse Vincent，Prime Radiant 创始人 | K-9 Mail 作者、Perl 5.14 PM、Request Tracker 作者、Keyboardio 联创 |
| 文件规模 | 306 文件；`skills/` 74 文件 435KB，其中 Markdown 60 个 357KB | **约 82% 内容是 Markdown** |
| 运行时依赖 | **零**（`package.json` 无 dependencies） | 设计原则：zero-dependency plugin |

**关联生态仓库**：

| 仓库 | Star | 作用 |
|------|------|------|
| `obra/superpowers-marketplace` | 1,298 | 插件市场（另含 elements-of-style 等 4 个插件） |
| `obra/superpowers-lab` | 432 | 实验性技能（语义重复检测、tmux 交互控制、Windows VM） |
| `prime-radiant-inc/superpowers-evals` | 131 | Quorum 行为评测框架，驱动真实 Agent CLI 打分 |

---

## 三、架构解剖：三个部件与一条铁律

这是全项目最值得学习的设计。Superpowers 的跨平台能力来自一个极简的分层：

```
┌─────────────────────────────────────────────────────────┐
│  ① Skills（skills/*/SKILL.md）    ← 全部 Harness 共用   │
│     规则：只描述「动作」，绝不点名具体工具              │
│     "invoke a skill" 而非 "用 Skill 工具"              │
│     "dispatch a subagent" 而非 "调用 Task 工具"        │
├─────────────────────────────────────────────────────────┤
│  ② Tool Mapping（per-harness reference）                │
│     references/claude-code-tools.md                     │
│     references/codex-tools.md / gemini-tools.md ...     │
│     职责：把「动作」翻译成各 Harness 的真实工具名        │
├─────────────────────────────────────────────────────────┤
│  ③ Bootstrap（per-harness 注入器）★ 整个集成的全部       │
│     SessionStart 时把 using-superpowers 全文            │
│     用 <EXTREMELY_IMPORTANT> 包裹注入上下文             │
│     没有它，skills/ 目录就是死文件，永不被调用           │
└─────────────────────────────────────────────────────────┘
```

**移植指南里的两条硬规则**（`docs/porting-to-a-new-harness.md`）：

1. **不得修改技能正文来适配你的 Harness** —— 只允许新增工具映射文件和注入器。为「符合官方文档」而重写技能内容的 PR，项目方明确「见即拒」（94% PR 拒绝率的主因之一）。
2. **不得手改用户配置文件** —— 一切通过 Harness 自己的安装机制投递。手改 `~/.gemini/config/AGENTS.md` 被明令禁止。

**Bootstrap 的实现细节值得单独说**（`hooks/session-start`）：

- 不用 `dirname`/`cat`/`bash`（依赖 PATH），全部用 bash 内建 `${0%[/\\]*}` 与 `$(< file)` —— 因为 Claude Code 的 `SessionStart:startup` 可能在 PATH 损坏时执行（issue anthropics/claude-code#43127）
- 用 `${s//old/new}` 参数替换做 JSON 转义，比逐字符循环快几个数量级
- 用 `printf | cat` 吸收 Windows Git Bash 下的 EPIPE（否则每次启动刷错误）
- 按平台变量分发不同 JSON 字段：`CURSOR_PLUGIN_ROOT` → `additional_context`（蛇形）；`CLAUDE_PLUGIN_ROOT` → `hookSpecificOutput.additionalContext`（嵌套）；`COPILOT_CLI=1` → `additionalContext`（顶层）。因为 Claude Code 会同时读取两种字段而不去重

---

## 四、核心工作流：七道门禁

```
       ┌──────────────────────────────────────────────────┐
       │  任意会话启动 → SessionStart Hook 注入 bootstrap   │
       └────────────────────┬─────────────────────────────┘
                            ↓
   ① brainstorming ──── 小任务直接做 / 小改在聊天里定 / 项目写设计文档
       │                 ★ HARD-GATE：人类不批准，绝不动一行代码
       │                    （含脚手架、安装依赖、建项目）
       ↓
   ② using-git-worktrees ── 独立 worktree + 项目初始化 + 干净测试基线
       ↓
   ③ writing-plans ──── 拆成 2–5 分钟颗粒任务，每个任务带：
       │                 精确文件路径 / 完整签名 / 验证步骤 / Global Constraints
       │                 产出 docs/superpowers/plans/YYYY-MM-DD-<feature>.md
       ↓
       ├─────────────────────────┬────────────────────────────┐
       ↓ SDD 模式                ↓ Native 模式（成本低 50%+）
   ④ subagent-driven-        ④ executing-plans
      development                本会话自己实现全部任务，
      每任务：全新子代理         只在最后做一次全分支评审
      → 评审（双裁决：          适合中端模型
        规格符合 + 代码质量）
      → 修复轮 R≤3 resume 实现者
        R≥4 换更强模型重派
      → 5 轮熔断 → 控制器裁决
       ↓                         ↓
   ⑤ test-driven-development ── RED-GREEN-REFACTOR
       │                        先写测试 → 看着它失败 → 最小实现 → 看着它通过 → 提交
       │                        ★ 测试前写的代码一律删除
       ↓
   ⑥ requesting-code-review ── 按严重度报告，Critical 阻塞
       ↓
   ⑦ finishing-a-development-branch ── 验证测试 → 提供选项 → 清理 worktree
```

**「Rulings, not stalls」原则**（v6.3.0 引入，价值极高）：

Agent 执行计划时**不允许中途问人类「要不要继续」**。遇到冲突、歧义、计划缺陷、超出额度时，自己裁决并记账：

```
Ruling: <决定了什么> — <为什么> — <判断错了的代价是什么>
```

只有四件事允许停下来问人：① 不可逆/破坏性操作；② 安全敏感操作；③ 工作树之外的副作用（merge / push 到共享分支 / publish）；④ 计划烂到每条路都是猜。

> 背景：有一次捐献的会话被一个「Agent 本该能自己决定」的问题卡了将近 9 小时。

---

## 五、15 个技能全清单

| 分类 | 技能 | 一句话职责 | SKILL.md 体积 |
|------|------|-----------|----------------|
| 引导 | `using-superpowers` | 强制「1% 可能适用就必须调用技能」 | 3.2 KB |
| 构思 | `brainstorming` | 苏格拉底式追问 + 反复回放理解 + 三档定级 + 可视化伴侣 | 10.1 KB |
| 计划 | `writing-plans` | 面向「零项目背景的初级工程师」写可执行计划 | 10.3 KB |
| 执行 | `subagent-driven-development` | 每任务一个全新子代理 + 双裁决评审 + 5 轮熔断 | **32.6 KB** |
| 执行 | `executing-plans` | 内联执行，单上下文 + 末尾一次评审 | 20.4 KB |
| 执行 | `dispatching-parallel-agents` | 并行子代理工作流 | 6.1 KB |
| 隔离 | `using-git-worktrees` | 优先用平台原生隔离，其次 git worktree | 6.8 KB |
| 收尾 | `finishing-a-development-branch` | 验证 + 合并/PR/保留选项 + 清理 | 7.8 KB |
| 测试 | `test-driven-development` | RED-GREEN-REFACTOR + 反模式 + 好测试六原则 | 9.6 KB |
| 调试 | `systematic-debugging` | 四阶段根因分析，铁律：无根因不修 | 9.5 KB |
| 调试 | `verification-before-completion` | 铁律：无新鲜证据不宣称完成 | 3.6 KB |
| 调试 | `diagnosing-superpowers` | 读会话 transcript，定位「Superpowers 哪里错了」 | 6.9 KB |
| 评审 | `requesting-code-review` | 评审前检查清单 | 3.0 KB |
| 评审 | `receiving-code-review` | 正确接收和处理评审意见 | 6.2 KB |
| 元 | `writing-skills` | **用 TDD 写技能**（含压力测试方法论） | **26.6 KB** |

`skills/` 目录还有 59 个支撑文件：8 个 harness 工具映射参考、评审提示词模板、worktree/ledger 脚本、可视化伴侣的 WebSocket 服务器（`server.cjs`）、`find-polluter.sh` 测试污染定位器、说服原则文档等。

---

## 六、五条最值得抄的技术设计

### 6.1 Rationalization Table（合理化反驳表）—— 我认为这是本项目最大的发明

每个技能里都有一张表，左列是 Agent 心里的念头，右列是现实反驳：

| 念头 | 现实 |
|------|------|
| 「这只是个简单问题」 | 问题也是任务。查技能。 |
| 「我先探索一下代码库」 | 技能会告诉你**怎么**探索。先查。 |
| 「这不需要正式技能」 | 有技能就该用。 |
| 「技能太重了」 | 简单的事也会变复杂。用它。 |
| 「我记得这个技能」 | 技能会演进。读当前版本。 |

**为什么有效**：Skill 描述里不写「要自检」，而写「当你想到 X 时停下来 —— 你在为自己找借口」。这是**针对模型具体失败模式的定向拦截**，而不是泛泛的道德要求。

### 6.2 「技能写作本身就是 TDD」

`writing-skills`（26.6 KB）的核心映射表：

| TDD 概念 | 技能创作对应 |
|---------|-------------|
| 测试用例 | 带子代理的压力场景 |
| 生产代码 | SKILL.md 文档 |
| 测试失败（RED） | Agent 在没有该技能时的违规行为（基线） |
| 测试通过（GREEN） | Agent 在技能约束下合规 |
| 重构 | 堵住新出现的合理化借口 |

**铁律原文**：「如果你没有亲眼看着 Agent 在没有技能时失败，你就不知道这个技能是否教对了东西。」

配套还有：
- **Micro-Test Wording**：措辞定稿前，抽样跑 5 次无引导对照组，逐字人工阅读，把「运行间方差」当警报信号
- **Match the Form to the Failure**：为纪律滑坡写「禁止清单」有效，为输出**形状**问题写就反效果 —— 那种情况需要 worked example

### 6.3 说服原则的工程化应用

`writing-skills/persuasion-principles.md` 引用了 Meincke et al. (2025) 的研究（N=28,000 次 AI 对话，7 种说服原则，合规率 33% → **72%**，p<.001），把 Cialdini 原则落到技能写法：

- **权威（Authority）**：`YOU MUST` / `Never` / `No exceptions`
- **承诺一致性（Commitment）**：要求显式宣告「Using X skill to Y」+ 强制二选一 + todo 追踪
- **稀缺（Scarcity）**：时序绑定，如「完成任务后 IMMEDIATELY 请求评审」
- **社会认同（Social Proof）**：`Every time` / `W without Y = failure`

作者本人的立场（原话）：**「我不在乎它是否因为我以为的原因而有效。我只在乎它有效。」** Hacker News 上对此的争论很激烈 —— 一派认为是「巫术」，另一派认为只要可测量地改善输出，实用主义立场就足够。

### 6.4 SDD 评审机制的「防作弊」设计（v6.0.0 重写）

真实运行中发现的问题与对策：

| 发现的问题 | 对策 |
|-----------|------|
| 粘贴的 diff 会永久占据最贵的上下文 | 改为 `task-brief` / `review-package` 脚本**写文件**，子代理自己读 |
| 控制器不指定模型 → 子代理默默继承最贵模型（一次运行 26 个评审全在顶配） | 模板**强制要求**声明模型，并给出「工作允许时降档」的指引 |
| 控制器会 coaching 评审员「跳过这个发现」「最多算 Minor」 | **明令禁止**抑制发现和预判严重度；计划本身要求的缺陷也必须上报 |
| 评审员跑 `git checkout` 会孤儿化后续提交 | 评审员**只读**，不碰工作树和分支 |
| 实现者一句「我故意没抽象」说服了评审 | 评审员**怀疑一切合理化理由** |
| 每次任务两个评审员太贵 | 合并为一个 `task-reviewer-prompt.md`，一次读 diff 出双裁决 |

实测收益（作者自述的 eval）：Claude Code 和 Codex 上质量相当，**速度快约 2 倍，token 少约 50%**。

### 6.5 计划格式的两次瘦身

- **v6.0.0**：加入 `Global Constraints`（逐字抄自 spec，全局约束）和 per-task `Interfaces`（跨任务契约），解决「实现者只看到自己那个任务，不知道邻居的函数签名」
- **v6.4.2**（2026-09-25）：反向优化 —— 起因是 **Opus 5.5 在写计划时会试图把整个项目实现出来**。新规则：**「计划记录决策，不是代码的转录本」**。测试步骤只写测试名和断言；代码步骤给签名、文件路径、spec 里的值，只有算法无法由签名决定时才给函数体。改用「一个动作 + 一个可检查结果」替代「2-5 分钟」作为步骤粒度。
  - 效果：计划编写时间**降到 1/4**，token 降到**约 1/3**；对照实验 9/9 通过（与写全代码的计划同分）

---

## 七、跨平台矩阵（16 个 Harness）

| Harness | 安装方式 | Bootstrap 机制 |
|---------|---------|---------------|
| Claude Code | `/plugin install superpowers@claude-plugins-official` | `hooks.json` SessionStart（`shell:bash`） |
| Codex App / CLI | 官方 Codex 市场 | **无 Hook**（Codex 原生技能发现即足够，v6.1.0 移除） |
| Cursor | `/add-plugin superpowers` | `hooks-cursor.json`，输出 `additional_context` |
| Gemini CLI | `gemini extensions install <repo>` | 扩展 `contextFileName` |
| GitHub Copilot CLI | `copilot plugin install superpowers@superpowers-marketplace` | 输出顶层 `additionalContext` |
| Antigravity | `agy plugin install <repo>` | **无 SessionStart 事件**，靠技能 description 触发（12 次运行验证） |
| Kimi Code | `/plugins install <repo>` | `.kimi-plugin/plugin.json` |
| OpenCode 2.0.4+ | 自有 plugin 安装 | `index.js` + `plugins/superpowers.js` |
| Pi | `pi install git:github.com/obra/superpowers` | `.pi/extensions/superpowers.ts` |
| Devin CLI | `devin plugins install obra/superpowers` | `.devin-plugin/plugin.json` |
| Hermes Agent | `hermes plugins install obra/superpowers --enable` | Python 插件，`.hermes-plugin/plugin.yaml` |
| Muse | `muse plugins install ./` | `.muse-plugin/` |
| Qwen Code | `qwen extensions install obra/superpowers` | 直接吃 Claude Code 市场 |
| Factory Droid | `droid plugin install superpowers@superpowers` | `.claude-plugin/marketplace.json` |
| Grok Build CLI | xAI 官方市场 | 官方市场打包 |

> 注意：v6.1.0 因「Google EOL Gemini CLI」消息移除过 Gemini 支持，v6.2.0 又恢复（承认是过早决定）。这是该项目响应速度的一个缩影，也是「依赖平台新闻」的风险体现。

---

## 八、版本演进史（按里程碑，非穷举）

| 版本 | 日期 | 关键变化 |
|------|------|---------|
| v3.x | 2025-10~11 | 首次进入社区视野，Codex 实验支持，skills-search 工具 |
| v4.0 | 2025-12-17 | **SDO（技能发现优化）** —— 重写全部技能 description，改为只写「何时用」不写「做什么」，因为发现 v3 时代 Claude 会因 description 描述内部流程而误判技能能力 |
| v5.0 | 2026-03-09 | spec/plan 目录重构为 `docs/superpowers/`；**可视化构思伴侣**（WebSocket 本地服务器）；文档评审系统；Subagent 模式在有子代理能力的平台上强制化；Slash 命令弃用 |
| v5.1 | 2026-04-30 | 技能压缩（后被证实不足以解决问题，见争议部分） |
| v6.0 | 2026-06-16 | **SDD 评审机制重写**（双评审员合一、diff 走文件、模型强制声明、防作弊规则）；worktree 从全局目录迁到项目内 `.worktrees/`；三个新 Harness（Kimi/Pi/Antigravity）；测试体系从 `tests/` 拆出 `evals/`（drill，后改名 Quorum）；**项目方哲学与 Anthropic 官方技能文档正式分道扬镳** |
| v6.1 | 2026-06-30 | **Bootstrap 压缩以降 Token**（v6.2 提到：技能代码从 3150 行砍到 977 行）；Codex 放弃 SessionStart Hook |
| v6.2 | 2026-07-23 | **全局技能压缩战役** —— 删除所有 recap / social proof / 收益推销段落；`writing-good-tests.md` 取代 `testing-anti-patterns.md`；SDD plan-scoped workspace（防跨计划 ledger 污染）；Windows Hook 改走 Git Bash |
| v6.3 | 2026-08-12 | **构思仪式按任务规模分级**（spike / bounded / architectural）；**Rulings not stalls**（自主裁决不停顿）；小任务批量合并派发 |
| v6.4.1 | 2026-09-18 | `diagnosing-superpowers` 技能；`executing-plans` 重建为真正的 Native 模式（此前是 64 行占位，实测与不装插件无差异） |
| v6.4.2 | 2026-09-25 | **计划瘦身**（时间 1/4，token 1/3） |
| v7.0.0 | 2026-10-09 | **brainstorming 完全重建**（10KB）：先理解你要什么再提方案、200-300 字回放、明确标注「这是我的猜测」、三档定级、builder-check 替代 spec 文档评审、新增「如何实现由谁决定」追问 |

**v7.0.0 的一个细节值得注意**：新版本专门加了一条追问「平台/语言/库由你来定还是我来定」，原因是**有一次会话被要求设计 iOS App，全程没问平台，最后建了个 Web App**。补丁号级别的教训都能追溯到具体事故。

---

## 九、争议与批评（必须客观呈现）

### 9.1 Token 与速度成本

| 来源 | 具体数字 |
|------|---------|
| Issue #743（26 评论，仍未关闭） | Claude Code 启动即消耗 **22,000 token**，占 11% 上下文窗口；3–5 倍 token 增幅；原话「after 5 minutes i went from 0% to 100% quota reached」 |
| Issue #1152 | Codex 上 20 步计划，20–30 分钟耗尽 ChatGPT Plus 5 小时配额，完成 17/20 |
| Issue #743 参与者 | 原本 10 分钟的任务变 30–45 分钟；有一次 30 分钟的活儿跑了近 2 小时 |
| Simon Willison（HN） | 一个项目里 5 个子任务，每个因上下文重复消耗 50,000+ token |
| r/ClaudeCode | 「用法统计停在 1–3%，代码库没有可见变化」，且抱怨每几周就复发一次 |

**维护者 Jesse Vincent 的回应**（Issue #743）：「review 循环是 superpowers 流程的标准组成部分」，并指出 OpenAI 自身 token 限额在变化，弱模型（如 GPT-5.4 mini）产出需要返工的工作会让 review 更慢；在没看到实际计划文档前无法判断个案。

**作者的持续优化**：v6.1.0 压缩 bootstrap（因为它每个会话都要付费）、v6.2.0 全局压缩战役、v6.4.2 计划瘦身（省 2/3）、v6.3.0 小任务批量派发。**但压缩未能根治强制流程本身的开销。**

### 9.2 「让 Agent 变笨」

HN 某评论：「I personally don't like superpowers very much. My boss does. I think Claude makes more mistakes when using superpowers than when not.」

中文社区（掘金/CSDN/51CTO）大量转载的同一叙事：改个变量名从 10 秒变 5 分钟；「25 万星标的 Superpowers，正在被用户集体卸载」。**注意这些中文文章是互相转载的同一篇源稿，且部分数据（如「14 个 skill」）已过时 —— 当前 main 分支是 15 个技能、已被压缩过两轮。**

技术上这个担忧并非无据：上下文窗口有限，Agent 要在处理需求的同时兼顾十几套规则，注意力被稀释。**但缺乏 A/B 对照实验来验证** —— 这恰恰是 HN 上最普遍的批评：**没有任何一份受控研究测量过装与不装的产出质量或速度差异**。

### 9.3 「Write it down vs 真的这么做」的哲学张力

质疑核心：这和一份写好的 `CLAUDE.md`（「动手前先讨论，先写测试」）有什么区别？

作者的回答站得住：差异在**执行机制** —— Hook 注入（不是靠模型想起来读）、HARD-GATE、rationalization table、评审员防作弊规则，这些都超出静态指令的能力范围。但**差异幅度无法量化**，因为基准不存在。

### 9.4 遥测（默认开启，可关闭）

brainstorming 的可视化伴侣会从作者网站加载一张 Prime Radiant Logo，**携带版本号**。不含项目、提示词、agent 信息，不记录点击。可用 `SUPERPOWERS_DISABLE_TELEMETRY=1` 关闭，也遵守 Claude Code 的 `DISABLE_TELEMETRY`。

### 9.5 治理风险：贡献通道极窄

`AGENTS.md` 明确写着：**「This repo has a 94% PR rejection rate」**，并直言被拒的 PR「submitted by an agent that didn't read or didn't follow these guidelines」，维护者「often with public comments like 'This pull request is slop that's made of lies'」。

不接受：第三方依赖（零依赖是设计原则）、为「符合 Anthropic 官方文档」而重写技能、项目专用配置、批量刷 issue 的 PR、纯理论性修复、领域专用技能、fork 专属改动。**README 也直接写明「we don't generally accept contributions of new skills」。**

**这意味着**：Superpowers 的方法论虽开源，但**演化通道基本由维护者独占**。想用它的理念，得自己另建插件。

### 9.6 结构性脆弱

依赖 LLM「自觉遵守」提示词，而非状态机。真实案例：编排器偷懒自己实现任务而不派子代理；无视铁律先写实现再补测试。技能文档里为此专门设了 Red Flags，但**本质上这是软约束**。

另有维护者自己承认的坑：`.superpowers/sdd/` 是 git-ignored 暂存区，`git clean -fdx` 会删掉进度 ledger（只能从 git log 恢复）。

### 9.7 最新未闭环问题（截至 2026-10-15）

| Issue | 评论 | 问题 |
|-------|------|------|
| #429 | 23 | Claude Code Agent Teams 支持（TeammateTool / SendMessage / TaskList）—— 你正在做的多 Agent 方向 |
| #641 | 6 | OpenClaw 平台支持 |
| #2309 | 8 | writing-plans 自审漏掉任务的 DAG 闭合性 |
| #2332 | 8 | 工作流有一流的 spec/plan，但**缺持久化的 QA/验收产物层** |
| #2186 | 7 | verification-before-completion 缺工具失效分类 |
| #2372 | 5 | Codex Desktop 读完 brainstorming 技能后仍跳过审批门 |

---

## 十、竞品对比

| 维度 | **Superpowers** | **ECC**（affaan-m） | **fable-skills**（轻量派） | **Anthropic 官方 Skills** |
|------|----------------|--------------------|--------------------------|----------------------|
| 定位 | **强观点方法论** | 广谱基础设施工具箱 | 轻量纪律引导 | 第一方能力集 |
| 技能数 | 15（v7 已压缩过） | 150–250+ | 6–35 | 数十个专项 |
| 流程约束 | **强制**（HARD-GATE） | 半强制，模块可选 | **不强制，只在关键节点轻推** | 无 |
| 核心卖点 | TDD 强制 + worktree 隔离 + 双层评审 | 跨会话记忆 + AgentShield 安全扫描 + 多语言规则 | 「6 个就够了」 | 第一方信任 |
| Token 优化 | ❌（最大争议点） | ✅（核心卖点之一） | ✅ | ✅（几乎无开销） |
| 跨 Harness | ✅ 16 个 | ✅ 7+ | 部分 | 仅 Claude Code |
| 上手成本 | 极低（两条命令） | 高（需选 profile 和语言） | 极低 | 极低 |
| 适合 | 中大型项目、团队、弱模型兜底 | 重度 Agent 用户、多技术栈 | 个人快速原型 | 需要单点第一方能力 |

**两个补充观察**：

1. `adamentwistle/fable-skills` 提出一个反向主张：**Sonnet 5 加载这 35 条技能后，打败了裸跑的 Opus 4.8** —— 即「纪律注入 > 模型升级」。
2. 反 Superpowers 派的核心论点是：**Agent 不是不听话的小孩，是需要适度引导的成年人。给一份员工手册就够了，不需要派一个监工 24 小时盯着。**

---

## 十一、对你的项目的可迁移价值

结合你现有的 PRD 技能集（5 skills + prd-reviewer）和 multi-agent-scaffold 脚手架，以下五条**可以直接嫁接**：

| # | 借鉴点 | 落地建议 |
|---|-------|---------|
| 1 | **Skill 写作的 TDD 纪律** | 你的 `prd-*` 系列技能目前没有「先跑基线看 Agent 怎么违背」这一步。参照 `writing-skills`：为 `prd-lint` 设计压力场景（如「用户说『写得专业点』」），先记录基线失败模式，再针对性补规则 |
| 2 | **Rationalization Table** | 这是提升技能触发率与遵从率的**低成本高收益**手段。你的 `prd-acceptance` / `prd-ears` 可加「Agent 心里会想 → 现实是」表 |
| 3 | **Skill description 只写「何时用」** | v4.0 的关键发现：description 描述内部流程会导致模型误判能力。检查你的技能 description 是否混入了「做什么」 |
| 4 | **Evidence before claims** | `verification-before-completion` 的「Common Failures」表可直接用于你的「文档交付前自检」：『测试通过 → 需要测试命令输出 0 失败，而不是上次的结果』 |
| 5 | **Review 员不可被上游收买** | v6.0 的防作弊规则（禁止「跳过这个发现」「最多算 Minor」、计划本身要求的缺陷也必须上报）适用于你的 `draft-reviewer` / `prd-reviewer` 设计 |

**不建议照搬的**：HARD-GATE 全流程强制。你的场景（PM 文档撰写、快速原型）恰恰是 Superpowers 争议最大的「小任务被强制完整流程」的重灾区。

---

## 十二、参考资料

**[1]** obra. Superpowers [EB/OL]. GitHub, 2025-10-09~2026-10-10. https://github.com/obra/superpowers （本文数据基准，2026-10-15 经 GitHub REST API 实测）

**[2]** obra. Superpowers Release Notes v3.0.0~v7.0.0 [EB/OL]. https://github.com/obra/superpowers/blob/main/RELEASE-NOTES.md （1523 行，本文逐版本核对）

**[3]** obra. Using Git Worktrees / Writing Plans / Subagent-Driven Development / Brainstorming 等 15 个 SKILL.md 源文件 [EB/OL]. https://github.com/obra/superpowers/tree/main/skills （本文通读）

**[4]** obra. Porting Superpowers to a New Harness [EB/OL]. https://github.com/obra/superpowers/blob/main/docs/porting-to-a-new-harness.md

**[5]** obra. Superpowers Evals（Quorum 行为评测框架）[EB/OL]. https://github.com/prime-radiant-inc/superpowers-evals

**[6]** VINCENT J. AGENTS.md（贡献者守则，含 94% PR 拒绝率声明）[EB/OL]. https://github.com/obra/superpowers/blob/main/AGENTS.md

**[7]** VINCENT J. Superpowers 发布公告 [EB/OL]. 2025-10-09. https://blog.fsck.com/2025/10/09/superpowers/

**[8]** VINCENT J. Latent Space Engineering [EB/OL]. 2026-01-30. https://blog.fsck.com/2026/01/30/Latent-Space-Engineering

**[9]** DEWHURST D. Superpowers: the Claude Code plugin that enforces what you already know you should do [EB/OL]. https://ddewhurst.com/blog/superpowers-claude-code-plugin-enforces-what-you-should-do

**[10]** THETERMINAL. Superpowers Passes 290,000 GitHub Stars as Token Costs Draw Fire [EB/OL]. 2026-09. https://theterminal.space/software/superpowers-github-stars-token-cost

**[11]** obra. obra/superpowers Issue #743: Im seeing slowness in responses since using the skill [EB/OL]. https://github.com/obra/superpowers/issues/743

**[12]** obra. obra/superpowers Issue #1152: Codex 实现 20 步计划耗尽 5 小时 token 配额 [EB/OL]. https://github.com/obra/superpowers/issues/1152

**[13]** obra. obra/superpowers Issue #512: brainstorming/writing-plans SKILL efficiency [EB/OL]. https://github.com/obra/superpowers/issues/512

**[14]** BSWEN. Is Everything Claude Code Worth It? ECC vs Superpowers [EB/OL]. 2026-09-07. https://docs.bswen.com/blog/2026-09-07-is-everything-claude-code-worth-it

**[15]** HeavyBit. Ep. #36 Managing AI Coding Agents with Jesse Vincent [EB/OL/音频]. https://www.heavybit.com/library/podcasts/open-source-ready/ep-36-managing-ai-coding-agents-with-jesse-vincent

**[16]** 曾经人手一个的 Superpowers，为什么现在都在卸 [EB/OL]. 掘金, 2026. https://juejin.cn/post/7662691781214437412 （中文社区批评的代表性转载源稿；数据部分已过时，本文已交叉核对）

---

*报告完成时间：2026-10-15 | 所有 GitHub 数据经 API 实测，版本信息经 RELEASE-NOTES 与 tag 双向核对*