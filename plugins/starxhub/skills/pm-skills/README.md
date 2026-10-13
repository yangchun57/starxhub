# PM Skills 产品经理技能包

## 简介

PM Skills 是一个产品经理技能包，提供 46 个 PM 框架，覆盖产品规划、需求分析、优先级决策、路线图规划等全生命周期。

## 核心理念

**ABC — Always Be Coaching**

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
└─────────────────────────────────────────────────────────┘
                          ↓ 编排
┌─────────────────────────────────────────────────────────┐
│  INTERACTIVE SKILLS（20 个）                              │
│  上下文感知推荐，AI 主动提问 3-5 个问题                   │
└─────────────────────────────────────────────────────────┘
                          ↓ 调用
┌─────────────────────────────────────────────────────────┐
│  COMPONENT SKILLS（21 个）                                │
│  单一任务模板，10-30 分钟完成                              │
└─────────────────────────────────────────────────────────┘
```

## 快速开始

### 查看所有技能

```bash
python scripts/pm_skill.py --list
```

### 使用快捷命令

```bash
# 写 PRD
python scripts/pm_skill.py prd

# 优先级排序
python scripts/pm_skill.py prioritize

# 路线图规划
python scripts/pm_skill.py roadmap

# 业务健康诊断
python scripts/pm_skill.py diagnose
```

### 在 Claude Code 中使用

```
/pm:prd          # 写 PRD
/pm:roadmap      # 规划路线图
/pm:prioritize   # 优先级排序
/pm:discover     # 用户发现流程
/pm:strategy     # 产品策略会议
/pm:story        # 写用户故事
/pm:position     # 产品定位
/pm:diagnose     # 业务健康诊断
/pm:interview    # 访谈准备
/pm:ost          # 机会方案树
```

## 技能清单

### Component Skills（20 个）

| 技能 | 用途 |
|---|---|
| `user-story` | 写用户故事（Mike Cohn 格式 + Gherkin 验收标准） |
| `positioning-statement` | 产品定位（Geoffrey Moore 模板） |
| `problem-statement` | 问题陈述（基于证据的问题框架） |
| `epic-hypothesis` | Epic 假设（可测试假设 + 成功指标） |
| `jobs-to-be-done` | JTBD 分析（客户想完成的任务） |
| `proto-persona` | 用户画像（假设驱动的画像） |
| `customer-journey-map` | 客户旅程（全触点体验映射） |
| `storyboard` | 故事板（6 帧叙事可视化） |
| `press-release` | 新闻稿（Amazon Working Backwards） |
| `pestel-analysis` | PESTEL 分析（外部因素分析） |
| `company-research` | 竞品研究（结构化竞品报告） |
| `saas-revenue-growth-metrics` | SaaS 收入指标 |
| `saas-economics-efficiency-metrics` | SaaS 单位经济学 |
| `finance-metrics-quickref` | 财务指标速查 |
| `pol-probe` | 轻量验证实验 |
| `recommendation-canvas` | AI 推荐画布 |
| `eol-message` | 下线通知 |
| `user-story-mapping` | 故事映射（Jeff Patton 框架） |
| `user-story-splitting` | 故事拆分（8 种模式） |
| `altitude-horizon-framework` | PM→Director 思维转变 |

### Interactive Skills（20 个）

| 技能 | 用途 |
|---|---|
| `prioritization-advisor` | 优先级顾问（推荐 RICE/ICE/Kano） |
| `epic-breakdown-advisor` | Epic 拆分顾问（Richard Lawrence 9 种模式） |
| `discovery-interview-prep` | 访谈准备（Mom Test 风格） |
| `opportunity-solution-tree` | 机会方案树（Teresa Torres 框架） |
| `stakeholder-identification` | 利益相关者识别 |
| `stakeholder-mapping` | 利益相关者映射 |
| `stakeholder-engagement-advisor` | 利益相关者参与策略 |
| `business-health-diagnostic` | 业务健康诊断（SaaS 健康度） |
| `organic-growth-advisor` | 有机增长顾问（McKinsey 增长金字塔） |
| `feature-investment-advisor` | 功能投资顾问（建/不建决策） |
| `pol-probe-advisor` | 验证实验顾问 |
| `director-readiness-advisor` | Director 转型顾问 |
| `vp-cpo-readiness-advisor` | VP/CPO 转型顾问 |
| `ai-shaped-readiness-advisor` | AI 产品就绪顾问 |
| `context-engineering-advisor` | 上下文工程顾问 |
| `agent-orchestration-advisor` | Agent 编排顾问 |
| `acquisition-channel-advisor` | 获客渠道顾问 |
| `customer-journey-mapping-workshop` | 客户旅程映射工作坊 |
| `positioning-workshop` | 定位工作坊 |
| `finance-based-pricing-advisor` | 定价顾问 |

### Workflow Skills（6 个）

| 技能 | 用途 | 耗时 |
|---|---|---|
| `discovery-process` | 完整发现周期 | 3-4 周 |
| `product-strategy-session` | 产品策略会议 | 2-4 周 |
| `roadmap-planning` | 路线图规划 | 1-2 周 |
| `prd-development` | PRD 开发 | 2-4 天 |
| `executive-onboarding-playbook` | 高管入职手册 | 30-60-90 天 |
| `skill-authoring-workflow` | 技能编写工作流 | 元技能 |

## 与现有 Agent 的协作

```
/pm:strategy → /pm:prd → /product-discovery（现有）→ pm（现有）→ 开发 agents
```

- **pm-skills** 负责上游：产品规划、商业决策、路线图
- **requirement-analyst** 负责中游：需求澄清、用户故事
- **pm** 负责下游：任务拆解、优先级排序
- **开发 agents** 负责实施：架构、编码、测试

## 灵感来源

本技能包灵感来源于 [deanpeters/Product-Manager-Skills](https://github.com/deanpeters/Product-Manager-Skills)（CC BY-NC-SA 4.0），并结合 Claude Code 多 Agent 开发框架的特点进行了适配和优化。

## 许可证

CC BY-NC-SA 4.0
