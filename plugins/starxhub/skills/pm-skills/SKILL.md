---
name: pm-skills
description: 产品经理技能包。提供 46 个 PM 框架（20 组件 + 20 交互 + 6 工作流），覆盖问题定义、客户发现、优先级排序、路线图规划、PRD 撰写、商业诊断、职业转型。当用户需要产品规划、需求分析、优先级决策、路线图制定、PRD 编写时使用。
---

# 产品经理技能包（PM Skills）

## Purpose

将专业产品经理的方法论打包成 AI 能直接调用的 Skill，让 Claude Code 成为产品经理的协作伙伴——AI 执行"怎么做"，PM 掌握"为什么"。

## 核心理念：ABC — Always Be Coaching

每个技能都包含：
- **框架原理解释** — 为什么这个框架有效
- **实际案例演示** — 展示思考过程，不只是最终结果
- **反模式警示** — 常见失败模式，提前识别陷阱
- **互动式引导** — 通过提问引导你发现答案

## 三层架构

```
┌─────────────────────────────────────────────────────────┐
│  WORKFLOW SKILLS（6 个）                                  │
│  完整端到端 PM 流程，耗时数天到数周                        │
│  例：产品策略会议、发现周期、路线图规划、PRD 开发            │
└─────────────────────────────────────────────────────────┘
                          ↓ 编排
┌─────────────────────────────────────────────────────────┐
│  INTERACTIVE SKILLS（20 个）                              │
│  上下文感知推荐，AI 主动提问 3-5 个问题                   │
│  例："我该用哪个优先级框架？" → 询问产品阶段/团队规模/数据  │
│      → 推荐 RICE/ICE/Kano                               │
└─────────────────────────────────────────────────────────┘
                          ↓ 调用
┌─────────────────────────────────────────────────────────┐
│  COMPONENT SKILLS（20 个）                                │
│  单一任务模板，10-30 分钟完成                              │
│  例：写用户故事、定位声明、竞品分析                        │
└─────────────────────────────────────────────────────────┘
```

## 技能清单

### Component Skills（20 个）

| 技能 | 用途 | 输出 |
|---|---|---|
| `user-story` | 写用户故事 | Mike Cohn 格式 + Gherkin 验收标准 |
| `positioning-statement` | 产品定位 | Geoffrey Moore 模板 |
| `problem-statement` | 问题陈述 | 基于证据的问题框架 |
| `epic-hypothesis` | Epic 假设 | 可测试假设 + 成功指标 |
| `jobs-to-be-done` | JTBD 分析 | 客户想完成的任务 |
| `proto-persona` | 用户画像 | 假设驱动的画像 |
| `customer-journey-map` | 客户旅程 | 全触点体验映射 |
| `storyboard` | 故事板 | 6 帧叙事可视化 |
| `press-release` | 新闻稿 | Amazon Working Backwards |
| `pestel-analysis` | PESTEL 分析 | 外部因素分析 |
| `company-research` | 竞品研究 | 结构化竞品报告 |
| `saas-revenue-growth-metrics` | SaaS 收入指标 | ARPU/MRR/ARR/流失率/NRR |
| `saas-economics-efficiency-metrics` | SaaS 单位经济学 | CAC/LTV/回收期/Rule of 40 |
| `finance-metrics-quickref` | 财务指标速查 | 32+ SaaS 指标公式 |
| `pol-probe` | 轻量验证实验 | PoL 实验文档 |
| `recommendation-canvas` | AI 推荐画布 | AI 产品推荐记录 |
| `eol-message` | 下线通知 | 产品/功能下线沟通 |
| `user-story-mapping` | 故事映射 | Jeff Patton 框架 |
| `user-story-splitting` | 故事拆分 | 8 种拆分模式 |
| `altitude-horizon-framework` |  altitude-horizon 框架 | PM→Director 思维转变 |

### Interactive Skills（20 个）

| 技能 | 用途 | 交互方式 |
|---|---|---|
| `prioritization-advisor` | 优先级顾问 | 问 3-5 个问题，推荐 RICE/ICE/Kano |
| `epic-breakdown-advisor` | Epic 拆分顾问 | Richard Lawrence 9 种模式 |
| `discovery-interview-prep` | 访谈准备 | Mom Test 风格访谈规划 |
| `opportunity-solution-tree` | 机会方案树 | Teresa Torres 框架 |
| `stakeholder-identification` | 利益相关者识别 | 全员映射 + R/P/D 标记 |
| `stakeholder-mapping` | 利益相关者映射 | 权力×兴趣 + 影响×权力 |
| `stakeholder-engagement-advisor` | 利益相关者参与 | 个性化参与策略 |
| `business-health-diagnostic` | 业务健康诊断 | SaaS 健康度诊断 |
| `organic-growth-advisor` | 有机增长顾问 | McKinsey 增长金字塔 |
| `feature-investment-advisor` | 功能投资顾问 | 建/不建决策 |
| `pol-probe-advisor` | 验证实验顾问 | 推荐原型类型 |
| `director-readiness-advisor` | Director 转型顾问 | PM→Director 教练 |
| `vp-cpo-readiness-advisor` | VP/CPO 转型顾问 | Director→VP/CPO 教练 |
| `ai-shaped-readiness-advisor` | AI 产品就绪顾问 | AI-first vs AI-shaped |
| `context-engineering-advisor` | 上下文工程顾问 | 记忆架构设计 |
| `agent-orchestration-advisor` | Agent 编排顾问 | 多 Agent 工作流设计 |
| `acquisition-channel-advisor` | 获客渠道顾问 | 渠道评估 + 单位经济学 |
| `customer-journey-mapping-workshop` | 客户旅程映射工作坊 | 引导式旅程映射 |
| `positioning-workshop` | 定位工作坊 | 引导式定位定义 |
| `finance-based-pricing-advisor` | 定价顾问 | 财务影响分析 |

### Workflow Skills（6 个）

| 技能 | 用途 | 耗时 |
|---|---|---|
| `discovery-process` | 完整发现周期 | 3-4 周 |
| `product-strategy-session` | 产品策略会议 | 2-4 周 |
| `roadmap-planning` | 路线图规划 | 1-2 周 |
| `prd-development` | PRD 开发 | 2-4 天 |
| `executive-onboarding-playbook` | 高管入职手册 | 30-60-90 天 |
| `skill-authoring-workflow` | 技能编写工作流 | 元技能 |

## 命令

| 命令 | 用途 | 对应技能 |
|---|---|---|
| `/pm:prd` | 写 PRD | prd-development |
| `/pm:roadmap` | 规划路线图 | roadmap-planning |
| `/pm:prioritize` | 优先级排序 | prioritization-advisor |
| `/pm:discover` | 用户发现流程 | discovery-process |
| `/pm:strategy` | 产品策略会议 | product-strategy-session |
| `/pm:story` | 写用户故事 | user-story |
| `/pm:position` | 产品定位 | positioning-statement |
| `/pm:diagnose` | 业务健康诊断 | business-health-diagnostic |
| `/pm:interview` | 访谈准备 | discovery-interview-prep |
| `/pm:ost` | 机会方案树 | opportunity-solution-tree |

## 与现有 Agent 的协作

```
/pm:strategy → /pm:prd → /product-discovery（现有）→ pm（现有）→ 开发 agents
```

- **pm-skills** 负责上游：产品规划、商业决策、路线图
- **requirement-analyst** 负责中游：需求澄清、用户故事
- **pm** 负责下游：任务拆解、优先级排序
- **开发 agents** 负责实施：架构、编码、测试

## 使用流程

1. **选择技能**：根据场景选择 component/interactive/workflow 技能
2. **加载技能**：`/pm:xxx` 或 `python scripts/pm_skill.py <skill-name>`
3. **补充上下文**：回答 AI 的 3-5 个问题（interactive 技能）
4. **执行技能**：AI 按技能定义执行，输出交付物
5. **学习框架**：AI 解释"为什么这样做"，PM 掌握方法论

## Skill 布局

```
pm-skills/
├── SKILL.md              ← 本文件
├── .skill-metadata.yaml  ← Skill 元数据
├── skills/
│   ├── component/        ← 21 个组件技能
│   ├── interactive/      ← 20 个交互技能
│   └── workflow/         ← 6 个工作流技能
└── scripts/
    └── pm_skill.py       ← 技能加载/执行脚本
```

## References

- 技能文件：skills/（component/interactive/workflow）
- 执行脚本：scripts/pm_skill.py
- 灵感来源：deanpeters/Product-Manager-Skills（CC BY-NC-SA 4.0）
