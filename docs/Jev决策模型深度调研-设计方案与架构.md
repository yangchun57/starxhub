# Jev 决策模型深度调研：设计方案与架构解析

> 调研日期：2026-10-11  
> 目标：深度解析 TypeSafe Jev 的设计哲学、技术架构与 API 规范，为 Cloud Code 插件接入提供理论依据

---

## 一、Jev 是什么？

### 1.1 核心定义

**Jev** 是 TypeSafe AI 于 2026 年 9 月 15 日发布的**首个 System One 模型**，专为软件自动化设计，**不生成文本**，而是返回**带校准概率的类型化决策**。

**命名来源**：取自经济学家杰文斯（Jevons），借"杰文斯悖论"表达其判断——智能成本每下降一个量级，会解锁更多数量级的新用途。

### 1.2 与传统 LLM 的本质区别

| 维度 | Jev (System One) | 传统 LLM (System Two) |
|------|------------------|----------------------|
| **输出** | 类型化决策 + 概率 | 生成文本（字符串） |
| **采样方式** | 并行，单次前向传播 | 逐 token 顺序生成 |
| **延迟** | 70–500ms | 数秒 |
| **结构化输出错误** | 设计为 0% | 非零 |
| **置信度** | 每次答案附带校准值 | 常常过度自信 |
| **成本** | $0.042/M tokens（输入） | $0.055-$1.000/M tokens |
| **幻觉风险** | 0%（结构层面） | 存在 |

**类比**：
- **LLM** = 写文章的作家（逐字生成，需要解析）
- **Jev** = 门卫拿清单（看一眼，直接返回数字）

---

## 二、设计哲学：System One 理论

### 2.1 双系统理论来源

Jev 的设计灵感来自 Daniel Kahneman 的**双系统理论**：

| 系统 | 特征 | 对应模型 |
|------|------|----------|
| **System 1** | 快速、直觉、自动 | Jev（决策模型） |
| **System 2** | 缓慢、深思熟虑、推理 | 传统 LLM |

**TypeSafe 的核心论点**：
> RLHF 将 LLM 调优成了"为人类偏好优化的聊天机器"，引入了模式丢失、过度自信和可靠性问题。但**机器对机器通信**根本不需要自然语言。Jev 专为"机器原生"决策工作负载设计——更可靠、更快、自洽、类型安全。

### 2.2 "The Bitterest Lesson"（最苦涩的教训）

TypeSafe 的运营哲学：
- **任务选择和高保真数据**比原始计算规模更重要
- "你得到你优化的东西"（You get what you optimize for）
- TypeSafe 自视为**专业数据实验室**，而非纯粹的基础模型实验室
- 即使给 10 亿美元算力预算，也**不会从头预训练基座模型**

---

## 三、技术架构：三大支柱

### 3.1 架构与采样：并行采样器

**传统 LLM**：
```
输入 → Token 1 → Token 2 → ... → Token N → JSON 解析 → 结果
延迟：~800ms
```

**Jev**：
```
输入 → 并行状态评估器 → RLCD 校准 Softmax → 结果 + 概率
延迟：~80ms
```

**关键技术**：
- **非自回归**：不逐 token 生成，单次前向传播完成所有输出
- **并行评估**：同一 state 下的所有问题相互独立、并行求值
- **批量调用**：增加第 10 个问题几乎不影响响应时间

### 3.2 RLCD：面向校准决策的强化学习

**RLCD（Reinforcement Learning for Calibrated Decisions）** 是 Jev 的核心训练方法，替代了传统的 RLHF。

#### RLHF vs RLCD 对比

| 维度 | RLHF | RLCD |
|------|------|------|
| **优化目标** | 人类偏好 | 校准决策 |
| **奖励信号** | 人类评分 | 可验证的程序化奖励 |
| **输出** | 文本生成 | 概率分布 |
| **问题** | 幻觉、谄媚、不可靠 | 无（结构保证） |
| **适用场景** | 对话、创作 | 分类、路由、评分 |

**RLCD 的核心思想**：
- 优化"认识论诚实"的概率（epistemically honest probabilities）
- 模型报告 P(correct)=0.95 时，实际正确率应接近 95%
- 通过**对比描述**学习：正确判断 vs 错误判断的对比案例
- 不模仿偏好句子，而是内化决策边界

**校准的意义**：
> 如果模型说"90% 概率"，那么在大量同类预测中，正确率应接近 90%。这使得**置信度阈值策略**在生产环境中可行。

### 3.3 类型化概率决策

**设计原则**：
- 输入：非结构化数据（文本、JSON）
- 输出：类型安全的值 + 置信度分数
- **零字符串生成** = 零幻觉（结构层面）

**类型安全保证**：
- Choice 答案始终在声明的选项内
- 结构始终遵循 schema
- 类型错误率为 0（构造性保证）

**⚠️ 重要限制**：
> "零幻觉"仅指**结构层面**：Jev 不可能生成不存在的字段或选项。但 Jev 仍可能选择错误的选项（如把 technical 工单分给 billing）。**问题不在形状，而在形状内的决策。**

---

## 四、三种决策原语（Question Primitives）

Jev 的整个 API 只有**三种问题类型**。这是设计理念，不是功能限制。

### 4.1 Noul（是/否判断）

**用途**：二元真值判断  
**返回**：0 到 1 之间的概率值（"是"的概率）  
**命名来源**：来自 Bernoulli（伯努利分布），二元结果的概率分布

**请求示例**：
```json
{
  "is_spam": {
    "type": "noul",
    "instructions": "Is this email spam?",
    "criteria": {
      "true": "The email is spam",
      "false": "The email is not spam"
    }
  }
}
```

**响应示例**：
```json
{
  "is_spam": {
    "type": "noul",
    "noul": 0.98
  }
}
```

**⚠️ 常见误读**：
> 0.5 不表示"中等"，而是表示**模型无法判断**（yes 和 no 概率相等）。如果需要光谱上的位置，应使用 Score。

### 4.2 Choice（多选一）

**用途**：从预定义选项中选择一项  
**返回**：所选选项 + 每项概率分布 + 置信度  
**限制**：最多 255 个选项

**请求示例**：
```json
{
  "department": {
    "type": "choice",
    "instructions": "Which team should handle this?",
    "criteria": {
      "billing": "Payment or subscription issues",
      "technical": "Bugs or integration problems",
      "sales": "Pricing or account questions"
    }
  }
}
```

**响应示例**：
```json
{
  "department": {
    "type": "choice",
    "choice": "technical",
    "probabilities": {
      "billing": 0.08,
      "technical": 0.85,
      "sales": 0.07
    },
    "confidence": 0.82
  }
}
```

**关键细节**：
- `choice` 字段只是 argmax（最大概率选项）
- **概率分布**才是值得行动的部分
- TypeSafe 建议给出完整列表而非短名单（选项只消耗少量 tokens）
- **始终添加"other"选项**：避免概率质量落在最不错误的选项上

### 4.3 Score（有序评分）

**用途**：在有序量表上定位  
**返回**：概率加权平均分（可落在等级之间）+ 每级概率 + 置信度  
**限制**：2 到 10 个等级

**请求示例**：
```json
{
  "frustration": {
    "type": "score",
    "instructions": "How frustrated the customer appears",
    "criteria": [
      "Calm, just stating facts",
      "Frustrated but civil",
      "Very angry, strong language"
    ]
  }
}
```

**响应示例**：
```json
{
  "frustration": {
    "type": "score",
    "score": 1.6,
    "legend": [
      "Calm, just stating facts",
      "Frustrated but civil",
      "Very angry, strong language"
    ],
    "probabilities": {
      "0": 0.05,
      "1": 0.30,
      "2": 0.65
    },
    "confidence": 0.78
  }
}
```

**关键细节**：
- `score` 是概率加权位置（3 个等级 → 范围 0-2，1.6 落在第 2 和第 3 级之间）
- `legend` 按索引回显等级（便于日志记录）
- **⚠️ 不要将 score 输出用于计算两个等级之间的精确数值**

---

## 五、API 规范

### 5.1 端点与认证

```
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

### 5.2 完整请求结构

```json
{
  "model": "jev-1.13.0",
  "state": "Hi, I've been trying to connect my Stripe account for 3 days and the integration keeps failing. I'm losing sales. Please help ASAP.",
  "questions": {
    "department": {
      "type": "choice",
      "instructions": "Which team should handle this?",
      "criteria": {
        "billing": "Payment or subscription issues",
        "technical": "Bugs or integration problems",
        "sales": "Pricing or account questions"
      }
    },
    "is_urgent": {
      "type": "noul",
      "instructions": "Does the message convey urgency or time-sensitivity?"
    },
    "frustration": {
      "type": "score",
      "instructions": "How frustrated the customer appears",
      "criteria": [
        "Calm, just stating facts",
        "Frustrated but civil",
        "Very angry, strong language"
      ]
    }
  },
  "session_id": "optional-session-id",
  "user": "optional-user-id",
  "trace": "optional-trace-id"
}
```

**字段说明**：
- `model`：模型版本（如 `jev-1.13.0`、`jev-latest`）
- `state`：要评估的内容（字符串、JSON 或文本数组）
- `questions`：问题映射（每个 key 是问题 ID）
  - `type`：`noul` | `choice` | `score`
  - `instructions`：判断指令（必需）
  - `criteria`：答案定义（choice/score 必需）
- `session_id`、`user`、`trace`：可选的观测上下文（不要放凭证）

### 5.3 完整响应结构

```json
{
  "model": "jev-1.13-20260917",
  "answers": {
    "department": {
      "type": "choice",
      "choice": "technical",
      "probabilities": {
        "billing": 0.15,
        "technical": 0.85,
        "sales": 0.00
      },
      "confidence": 0.78
    },
    "is_urgent": {
      "type": "noul",
      "noul": 0.999
    },
    "frustration": {
      "type": "score",
      "score": 1.035,
      "legend": {
        "0": "Calm, just stating facts",
        "1": "Frustrated but civil",
        "2": "Very angry, strong language"
      },
      "probabilities": {
        "0": 0.20,
        "1": 0.65,
        "2": 0.15
      },
      "confidence": 0.842
    }
  },
  "usage": {
    "input_tokens": 312,
    "output_tokens": 48
  }
}
```

**响应字段**：
- `model`：实际回答的模型版本
- `answers`：每个问题 ID 的类型化答案
- `usage`：token 使用量（输入计费，输出免费）

### 5.4 错误码

| 错误码 | 含义 |
|--------|------|
| 401 | API Key 无效 |
| 422 | 请求验证失败 |
| 429 | 速率限制 |
| 529 | 服务过载 |

---

## 六、性能与定价

### 6.1 性能指标

| 指标 | 数值 | 对比 |
|------|------|------|
| **延迟** | 70-500ms | LLM: 3-329 秒 |
| **速度** | 200x 更快 | - |
| **成本** | 444x 更便宜 | - |
| **上下文窗口** | 32,000 tokens | - |
| **准确率** | 67.8%（工作流评估） | 前沿模型: 74.1% |

**独立测试（Every）**：
- 提取任务：25x 更快，580x 更便宜

### 6.2 定价

| 项目 | 价格 |
|------|------|
| **输入** | $0.042 / 百万 tokens |
| **输出** | 免费 |
| **对比** | 约 $0.000081 / 决策 |

**成本优势**：
> 在支持工单场景中，每次决策成本约 $0.000081，而传统 LLM 约 $0.0138。

---

## 七、推荐架构模式

### 7.1 TypeSafe 推荐的三种架构

#### 架构 1：传统软件
```
大型决策树 + 简单可靠的原始语
```
**优点**：可靠、可测试  
**缺点**：无法处理非结构化输入

#### 架构 2：LLM Agent
```
LLM 读取指令 → 自主选择下一步 → 执行
```
**优点**：灵活  
**缺点**：每次循环都可能出错，需要人类监督

#### 架构 3：AI 驱动的软件（Jev 定位）
```
代码控制流程 + 确定性工作
    ↓
仅在需要常识判断时调用模型
    ↓
模型返回类型化决策
    ↓
代码组合答案并执行
```

**核心原则**：
1. **代码能做精确的事，就让代码做**
2. **将输入拆分为命名部分**
3. **将模糊判断拆分为窄问题**
4. **同时提出多个问题**
5. **在代码中组合答案**
6. **对不确定性进行路由**

### 7.2 多 Agent 编排中的 Jev

```
用户请求
    ↓
Jev: 分诊与意图分类
    ↓
├─ 概率 >= 0.90 → 快速工作者（DeepSeek V4 Flash）→ 执行动作
└─ 概率 < 0.90 → 前沿工作者（Claude Sonnet 4.6）→ 升级处理
    ↓
Jev: Schema 与输出验证
    ↓
├─ Pass → 执行动作
└─ Fail → 升级给工程师
```

**效果**：
- 系统延迟降低 ~60%
- 月度 API 支出降低高达 75%

---

## 八、适用场景与限制

### 8.1 最佳使用场景

Jev 适用于满足以下**四个条件**的问题：

1. **答案适配已知集合**  
   支持队列、文档分类、风险等级、应用处理器等可枚举的选项

2. **决策需要语义判断**  
   如果正则表达式或比较能精确解决，模型无价值。当两条不同措辞表达相同意图时，优势显现

3. **决策频率足够高**  
   成本和延迟 matters。$0.042/M tokens，输出免费

4. **需要可校准的置信度**  
   概率值与实际准确率吻合，可设置阈值自动路由

**典型场景**：
- 工单分类与路由
- 意图识别
- 内容审核
- 信息提取
- 评分与评级
- LLM 输出的护栏检查
- 实时游戏状态反应（如 Doom）
- 大规模数据标注

### 8.2 不适用场景

- **开放式任务**：需要语言模型
- **文本生成**：Jev 不生成文本
- **数学推理**：非设计目标
- **需要解释的决策**：Jev 不返回推理过程
- **答案空间开放**：无法枚举所有可能选项

### 8.3 能力边界

**"零幻觉"的真实含义**：
- ✅ 结构层面：不可能生成不存在的字段或选项
- ❌ 决策层面：仍可能选择错误的选项

**概率的解释**：
- 概率是**决策信号**，不是行动许可
- 0.5 表示"无法判断"，不是"中等"
- 不要将 score 输出用于计算两个等级之间的精确数值

---

## 九、开源生态与替代方案

### 9.1 Jev 兼容的开源模型

| 模型 | 参数量 | 延迟 | 许可证 | API 兼容 |
|------|--------|------|--------|----------|
| **Cloudflare Clef-flash** | 9B | 38.8ms | Apache 2.0 | ✅ Jev 兼容 |
| **Cloudflare Clef** | 27B | 209ms | Apache 2.0 | ✅ Jev 兼容 |
| **AWS Strands Decider 2B** | 2B | 106ms | Apache 2.0 | ✅ System One |
| **Laya** | 421M | 32.8ms | Apache 2.0 | ✅ Jev 兼容 |
| **Jeff** | 0.8B-27B | 22-28ms | Apache 2.0 | ✅ Jev 兼容 |
| **Kev** | 0.8B-27B | - | Apache 2.0 | ✅ Jev 兼容 |

### 9.2 接入渠道

| 渠道 | 端点 | 说明 |
|------|------|------|
| **TypeSafe 官方** | `POST https://api.typesafe.ai/v1/systemone` | 直接 API |
| **OpenRouter** | `POST https://openrouter.ai/api/alpha/decisions` | Decisions API |
| **Vercel AI Gateway** | 实验性 `evaluate` 端点 | 实验性 |
| **AutoJev** | `POST /api/v1/decisions` | 包装层 + 预设端点 |

---

## 十、Cloud Code 插件接入建议

### 10.1 接入策略

**推荐方案**：
1. **优先使用开源替代**（数据合规 + 成本控制）
   - Clef-flash：最低延迟（38.8ms），多模态支持
   - Laya：CPU 可跑，适合资源受限环境
   - Strands Decider 2B：完全开源，训练成本低

2. **如需托管服务**：
   - OpenRouter：无需 Azure，文档完善
   - TypeSafe 官方：早期访问，需申请

### 10.2 集成模式

**模式 1：Decision Gateway（决策网关）**
```
Cloud Code 插件
    ↓
Decision Gateway（本地服务）
    ↓
Jev / Clef-flash / Laya
    ↓
返回概率分布
    ↓
代码根据阈值路由
```

**模式 2：混合架构**
```
高频简单决策 → Jev（快速、便宜）
    ↓
低置信度 / 复杂推理 → LLM（慢、贵）
```

### 10.3 关键设计原则

1. **代码保持控制**：Jev 是工具，不是 Agent
2. **拆分问题**：将模糊判断拆分为窄问题
3. **批量调用**：一次请求多个问题，几乎不增加延迟
4. **设置阈值**：根据置信度自动路由（>= 0.9 自动执行，< 0.9 升级）
5. **记录决策**：记录模型版本、概率、请求 ID（便于调试）
6. **校准阈值**：在自有数据上校准阈值

---

## 十一、团队背景

### 11.1 创始人

**Diogo Almeida（CEO & Co-Founder）**：
- 前 OpenAI 研究员
- InstructGPT 论文共同作者
- RLHF（基于人类反馈的强化学习）核心贡献者

**Sasha Sheng（Co-Founder）**：
- 前 Meta FAIR 研究工程师
- 专长：分布式推理与表示学习

**Erik Gafni（CTO & Co-Founder）**：
- 系统架构师
- 高吞吐基础设施背景

### 11.2 研究基础

TypeSafe 的核心论点基于以下研究脉络：
- **Christiano et al. (2017)**：机器人控制中的 RLHF
- **Stiennon et al. (2020)**：摘要任务中的 RLHF
- **Ouyang et al. (2022)**：InstructGPT 框架

TypeSafe 认为后续的开发者适配（函数调用、结构化 JSON、Chain-of-Thought）都是**字符串文本预测核心上的脆弱变通方案**。

---

## 十二、总结与展望

### 12.1 Jev 的核心创新

1. **System One 模型类别**：开创"决策模型"新品类
2. **RLCD 训练方法**：优化校准概率，而非人类偏好
3. **类型化输出**：零幻觉（结构层面），零解析开销
4. **并行采样**：单次前向传播，超低延迟
5. **机器原生设计**：为代码而非人类优化

### 12.2 对 AI Agent 架构的影响

> 随着 AI Agent 框架向多 Agent 模块化架构演进，轻量级 System One 决策引擎（如 Jev）将成为生产开发者栈中的**标准基础设施**。

**架构分层**：
```
┌─────────────────────────────────────┐
│  System Two: LLM（复杂推理、生成）   │  慢、贵、灵活
├─────────────────────────────────────┤
│  System One: Jev（快速决策、路由）   │  快、便宜、可靠
├─────────────────────────────────────┤
│  代码：控制流、确定性逻辑            │  精确、可测试
└─────────────────────────────────────┘
```

### 12.3 未来趋势

- **决策模型将成为标准组件**：如同正则表达式一样普遍且隐形
- **开源生态快速演进**：已有 10+ 开源替代，性能接近或超越 Jev
- **混合架构成为主流**：System One + System Two 协同工作
- **校准概率成为标配**：所有模型都将提供可信的置信度

---

## 参考来源

- [TypeSafe AI 官方博客 - Introducing System One Models & Jev](https://typesafe.ai/blog)
- [TypeSafe AI 文档 - docs.typesafe.ai](https://docs.typesafe.ai)
- [Jev API 指南 - AutoJev](https://autojev.ai/jev-api)
- [Jev Primitives 教程 - LearnJev](https://learnjev.com/tutorials/three-primitives)
- [TypeSafe AI Jev 架构深度解析 - RankLLMs](https://rankllms.com/posts/jev-typesafe-ai-why-new-model-is-popular/)
- [Jev: The New Model Idea That Took the World by Storm - RidgeRun](https://www.ridgerun.ai/post/jev-ai-models-for-computers)
- [TypeSafe AI Launches Jev - The Next Gen Tech Insider](https://www.thenextgentechinsider.com/pulse/typesafe-ai-launches-jev-to-revolutionize-software-automation-with-system-one-models)
- [Typesafe AI Launches Jev - A Probability Model From a ChatGPT Co-Creator](https://www.gikiewicz.com/typesafe-ai-launches-jev-a-probability-model-from-a-chatgpt)
- [What Is Jev? The 2026 Complete Guide - A2A Protocol](https://a2aprotocol.ai/insights/2026-jev-system-one-model-guide)
- [Building With Jev: State, Typed Questions, and Confidence Gates - ZharfAI](https://zharf.ai/en/blog/typesafe-jev-developer-guide)
