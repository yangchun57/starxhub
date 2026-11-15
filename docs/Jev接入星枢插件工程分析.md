# Jev 决策模型接入星枢（starxhub）插件工程分析

> 分析日期：2026-10-11
> 目标：分析 Jev / System One 决策模型如何融入星枢插件的现有架构

---

## 一、星枢插件架构回顾

星枢是一个 Claude Code 插件，核心能力是**按技术栈生成 `.claude/` 配置**。其架构由五大组件构成：

```
starxhub/
├── .claude-plugin/marketplace.json    # 市场清单
└── plugins/starxhub/
    ├── .claude-plugin/plugin.json     # 插件清单
    └── skills/
        ├── new-project/               # 脚手架生成器
        │   ├── scripts/scaffold.py    # 主生成器（Python）
        │   └── templates/
        │       └── .claude/
        │           ├── agents/        # 24 个 Agent 定义（.md）
        │           ├── commands/      # 11 个斜杠命令（.md）
        │           ├── hooks/         # 护栏钩子（.py）
        │           ├── rules/         # 路径范围规则（.md）
        │           └── standards/     # 完整规范文档
        └── onboard-project/           # 已有项目接入
```

**五大集成机制**：

| 机制 | 形式 | 触发方式 | 现有用途 |
|------|------|----------|----------|
| **Hooks** | Python 脚本 | PreToolUse / PostToolUse 事件 | 提交前构建测试、敏感信息扫描 |
| **Agents** | Markdown 定义 | 用户/系统调度 | 24 个专职角色（architect、plan-gatekeeper 等） |
| **Commands** | Markdown 模板 | 用户 `/` 斜杠调用 | `/new-feature`、`/plan-gate` 等 11 个命令 |
| **Rules** | Markdown 规则 | `paths` glob 匹配自动加载 | 按技术栈注入编码规范 |
| **Skills** | Python 脚本 | 用户 `/` 调用 | `new-project`、`onboard-project` |

---

## 二、Jev 接入的四个切入点

### 切入点总览

```
┌───────────────────────────────────────────────────────────────┐
│                     星枢插件架构                                │
│                                                               │
│  ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌───────────┐  │
│  │  Hooks   │   │  Agents  │   │ Commands │   │  Skills   │  │
│  │  (Python)│   │  (.md)   │   │  (.md)   │   │  (.py)    │  │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └─────┬─────┘  │
│       │              │              │               │         │
│       ▼              ▼              ▼               ▼         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Decision Gateway（新增层）                   │  │
│  │         decision_client.py / decision_hook.py           │  │
│  └────────────────────────┬────────────────────────────────┘  │
│                           │                                   │
│                           ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │     Jev API / Clef-flash 本地 / Laya 本地               │  │
│  │     POST /v1/systemone                                  │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

---

## 三、切入点 1：Hooks — 决策门控钩子

### 3.1 现有 Hook 机制

星枢已有两个 hook：
- `pre_commit_guard.py`：提交前跑构建+测试
- `tenant_guard.py`：写入后扫描敏感信息

**Hook 协议**：
```python
# 输入：stdin 接收 JSON
data = json.loads(sys.stdin.read())
# data = {"tool_input": {"command": "...", "content": "..."}}

# 输出：stdout 返回 JSON 决策
# deny → 阻塞
# allow → 放行
# 无输出 → 不干预
```

### 3.2 新增：`decision_guard.py` — Jev 决策钩子

**场景**：Agent 写入文件后，Jev 快速判断内容是否合规（多租户红线、安全策略、代码质量门控）。

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PostToolUse 钩子：用 Jev 决策模型快速判断 Agent 写入内容是否合规。
比 LLM 审查快 200 倍，成本降低 400 倍。
"""
import sys, json, os, urllib.request

# ─── 配置 ───
JEV_ENDPOINT = os.environ.get(
    "JEV_ENDPOINT",
    "https://openrouter.ai/api/v1/systemone"  # 或本地 Clef-flash
)
JEV_API_KEY = os.environ.get("JEV_API_KEY", "")
JEV_MODEL = os.environ.get("JEV_MODEL", "microsoft/microsoft-decision-1")
# 置信度阈值：低于此值升级为 LLM 审查
CONFIDENCE_THRESHOLD = float(os.environ.get("JEV_CONFIDENCE_THRESHOLD", "0.85"))


def call_decision_model(state: str, questions: dict) -> dict:
    """调用 Jev / System One 决策模型"""
    payload = json.dumps({
        "model": JEV_MODEL,
        "state": state,
        "questions": questions
    }).encode("utf-8")

    req = urllib.request.Request(
        JEV_ENDPOINT,
        data=payload,
        headers={
            "Authorization": f"Bearer {JEV_API_KEY}",
            "Content-Type": "application/json"
        }
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        return json.loads(resp.read())


def main():
    try:
        data = json.loads(sys.stdin.read())
    except Exception:
        return

    # 只审查 Write/Edit 操作的内容
    content = (data.get("tool_input", {}).get("content") or "")
    if not content or len(content) < 50:
        return  # 太短，不值得决策

    # ─── 一次调用，三个决策问题 ───
    response = call_decision_model(
        state=content[:8000],  # 截断到 8K，省 tokens
        questions={
            "tenant_red_line": {
                "type": "noul",
                "instructions": "内容是否违反多租户隔离红线？"
                "如：硬编码 tenant_id、跨租户查询、缺少 TenantId 过滤",
                "criteria": {
                    "true": "存在明确的多租户隔离违规",
                    "false": "未发现多租户隔离问题"
                }
            },
            "security_risk": {
                "type": "choice",
                "instructions": "内容的安全风险等级？",
                "criteria": {
                    "none": "无安全风险",
                    "low": "低风险：如普通日志信息",
                    "medium": "中风险：如暴露内部路径或非敏感配置",
                    "high": "高风险：如硬编码密钥、token、密码"
                }
            },
            "code_quality": {
                "type": "score",
                "instructions": "代码质量评分",
                "criteria": [
                    "严重问题：逻辑错误、安全漏洞、数据丢失风险",
                    "需要改进：缺少错误处理、硬编码值、无注释",
                    "基本合格：结构清晰，有小问题",
                    "优秀：完善错误处理、类型安全、文档齐全"
                ]
            }
        }
    )

    answers = response.get("answers", {})

    # ─── 决策路由 ───
    # 1. 多租户红线 → 直接阻塞
    tenant_violation = answers.get("tenant_red_line", {}).get("noul", 0)
    if tenant_violation > CONFIDENCE_THRESHOLD:
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason":
                    f"Jev 决策：多租户红线违规（概率 {tenant_violation:.2f}），请检查 TenantId 隔离"
            }
        }))
        sys.exit(2)

    # 2. 高风险 → 阻塞
    security = answers.get("security_risk", {})
    if security.get("choice") == "high" and security.get("confidence", 0) > CONFIDENCE_THRESHOLD:
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason":
                    f"Jev 决策：高安全风险（{security.get('confidence', 0):.2f}），检测到硬编码敏感信息"
            }
        }))
        sys.exit(2)

    # 3. 中风险 + 低置信度 → 警告但不阻塞（升级为 LLM 审查）
    if security.get("choice") in ("medium", "high"):
        print(f"[Jev] 安全风险提示: {security.get('choice')} "
              f"(confidence: {security.get('confidence', 0):.2f})",
              file=sys.stderr)

    # 4. 记录决策日志（可追溯）
    quality = answers.get("code_quality", {})
    print(f"[Jev] 决策日志 | "
          f"tenant_red_line={tenant_violation:.2f} | "
          f"security={security.get('choice')}({security.get('confidence', 0):.2f}) | "
          f"quality_score={quality.get('score', 'N/A')}",
          file=sys.stderr)

    sys.exit(0)


if __name__ == "__main__":
    main()
```

### 3.3 Hook 在 settings.json 中的注册

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "command": "python .claude/hooks/decision_guard.py"
      }
    ]
  }
}
```

**优势分析**：
- 现有 `tenant_guard.py` 用关键词匹配（`password`, `secret` 等），**误报率高**
- Jev 版本做**语义判断**，能理解上下文（如 "password" 出现在注释 vs 硬编码赋值）
- 延迟 ~85ms vs LLM 审查 ~3-5s，**不阻塞开发流程**

---

## 四、切入点 2：Agents — 增强 plan-gatekeeper

### 4.1 现有 plan-gatekeeper 的痛点

当前 `plan-gatekeeper.md` 定义了一个方案放行门禁 Agent，做 C1/C2/C3 三重校验。问题：

1. **完全依赖 LLM 判断**：每次门禁需要 Claude 读 5+ 个文档，耗时 30s-2min
2. **判定一致性差**：同样的方案，不同次运行可能给出不同结论
3. **成本高**：每次门禁消耗大量 tokens

### 4.2 混合架构：Jev 做快速预筛，LLM 做深度审查

```
架构方案 + 风险扫描报告
         │
         ▼
┌─────────────────────────────┐
│  Phase 1: Jev 快速预筛       │  ~100ms, $0.00001
│  • 文档完整性检查 (choice)   │
│  • 关键章节存在性 (noul×5)   │
│  • 需求→接口覆盖率 (score)   │
│                             │
│  结果：                     │
│  ├─ 全部高置信度通过         │
│  │   → 直接 PASS（跳过LLM） │
│  ├─ 存在低置信度判断         │
│  │   → 升级给 LLM 深度审查  │
│  └─ 明确不通过              │
│      → 直接 REJECT          │
└─────────────┬───────────────┘
              │ (仅低置信度时)
              ▼
┌─────────────────────────────┐
│  Phase 2: LLM 深度审查       │  ~30-120s, $0.05
│  • C1 清晰度详细校验         │
│  • C2 完整性交叉验证         │
│  • C3 可验证性评估           │
│  • 生成详细审查报告          │
└─────────────────────────────┘
```

### 4.3 改造后的 plan-gatekeeper.md（片段）

```markdown
---
name: plan-gatekeeper
description: 方案放行门禁（Jev 增强版）。Phase 1 用 Jev 做快速预筛（~100ms），
Phase 2 仅在低置信度时升级 LLM 深度审查。
tools: Read, Glob, Grep, Bash, DecisionGateway
model: sonnet
---

你是方案放行门禁。你采用两阶段审查策略：

## Phase 1: Jev 快速预筛

在开始详细审查前，先调用 DecisionGateway 做快速预筛：

```python
# 通过 Bash 工具调用 decision_client.py
python .claude/scripts/decision_client.py pre-screen \
    --arch-doc <架构文档路径> \
    --api-doc <接口文档路径> \
    --db-doc <数据库文档路径> \
    --risk-report <风险扫描报告路径>
```

根据预筛结果决定后续动作：

| 预筛结果 | 动作 |
|----------|------|
| 所有决策 confidence ≥ 0.90 | 直接采用 Jev 结论，输出简要报告 |
| 存在 confidence < 0.90 的决策 | 对低置信度项进行 LLM 深度审查 |
| 任一决策 confidence < 0.50 | 全部升级为 LLM 深度审查 |

## Phase 2: LLM 深度审查（条件触发）

仅对 Phase 1 中低置信度的检查项进行详细审查...
```

### 4.4 效果预估

| 场景 | 当前（纯 LLM） | 改造后（Jev + LLM） |
|------|----------------|---------------------|
| 方案质量高 | 30-120s，$0.05 | 0.1s，$0.0001（Jev 直接放行） |
| 方案质量差 | 30-120s，$0.05 | 0.1s，$0.0001（Jev 直接拒绝） |
| 方案有疑点 | 30-120s，$0.05 | 30-120s，$0.05（LLM 深度审查） |

**关键洞察**：大部分方案要么明显合格要么明显不合格，Jev 可以快速处理这些"简单决策"，只在边界情况下才需要 LLM 的推理能力。

---

## 五、切入点 3：Commands — 智能命令路由

### 5.1 现有命令路由

当前用户必须手动选择命令：
```bash
/new-feature     # 新功能
/fix-bug         # 修 bug
/review          # 代码审查
/plan-gate       # 方案门禁
```

### 5.2 Jev 增强：自然语言 → 命令路由

用户输入自然语言描述，Jev 自动路由到正确的命令：

```python
# .claude/scripts/command_router.py
"""
用 Jev 做意图分类，将自然语言路由到正确的斜杠命令。
"""

def route_command(user_input: str) -> dict:
    """Jev 意图分类 → 命令路由"""
    response = call_decision_model(
        state=user_input,
        questions={
            "command": {
                "type": "choice",
                "instructions": "用户意图应该路由到哪个命令？",
                "criteria": {
                    "new-feature": "开发新功能、新增页面、添加接口",
                    "fix-bug": "修复 bug、报错、异常、不工作的功能",
                    "review": "代码审查、检查代码质量、review",
                    "plan-gate": "方案评审、架构审查、门禁检查",
                    "gen-test-cases": "生成测试用例、写测试",
                    "deploy": "部署、发布、上线",
                    "retro": "复盘、回顾、总结",
                    "req-review": "需求评审、需求审查",
                    "change-request": "变更请求、需求变更",
                    "product-discovery": "产品探索、需求发现、用户调研"
                }
            },
            "confidence_check": {
                "type": "noul",
                "instructions": "是否有足够信息确定路由？如果用户输入太模糊或"
                "者包含多个意图，返回 false"
            },
            "urgency": {
                "type": "score",
                "instructions": "任务的紧急程度",
                "criteria": [
                    "低优先级：探索性、调研性问题",
                    "中优先级：常规开发任务",
                    "高优先级：线上 bug、阻塞性问题"
                ]
            }
        }
    )
    return response["answers"]
```

### 5.3 集成方式

在 `settings.json` 中增加一个 `PreToolUse` hook，拦截用户的 `/` 命令调用：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "command",
        "command": "python .claude/hooks/command_router.py"
      }
    ]
  }
}
```

---

## 六、切入点 4：Skills — 脚手架生成器增强

### 6.1 scaffold.py 增强：生成 Jev 配置

在 `scaffold.py` 的技术栈 Profile 中增加 Jev 配置项：

```python
# scaffold.py 新增配置
JEV_CONFIG_TEMPLATE = {
    "decision_model": {
        "provider": "openrouter",  # openrouter | typesafe | local
        "model": "microsoft/microsoft-decision-1",
        "endpoint": "https://openrouter.ai/api/v1/systemone",
        "confidence_threshold": 0.85,
        "timeout_ms": 5000,
        "fallback": "llm",  # 低置信度时回退到 LLM
    }
}
```

### 6.2 生成 Decision Gateway 脚本

`scaffold.py` 在生成项目时，自动创建 `.claude/scripts/decision_client.py`：

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Decision Gateway — 星枢项目的 Jev 决策客户端。
统一管理所有决策模型的调用、缓存、降级和日志。
"""
import json, os, sys, time, hashlib
import urllib.request
from pathlib import Path

# ─── 配置加载 ───
CONFIG_PATH = Path(os.environ.get("CLAUDE_PROJECT_DIR", ".")) / ".claude" / "decision_config.json"

def load_config() -> dict:
    """加载决策模型配置"""
    if CONFIG_PATH.exists():
        return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    return {
        "provider": "openrouter",
        "model": "microsoft/microsoft-decision-1",
        "endpoint": os.environ.get("JEV_ENDPOINT", "https://openrouter.ai/api/v1/systemone"),
        "api_key": os.environ.get("JEV_API_KEY", ""),
        "confidence_threshold": 0.85,
        "timeout_ms": 5000,
        "fallback": "llm",
        "cache_ttl_seconds": 300,
        "log_decisions": True
    }

CONFIG = load_config()

# ─── 核心调用 ───
def decide(state: str | dict, questions: dict, tag: str = "") -> dict:
    """
    统一的决策调用入口。

    Args:
        state: 要评估的内容（字符串或 JSON）
        questions: Jev 问题映射 {id: {type, instructions, criteria}}
        tag: 决策标签（用于日志追踪）

    Returns:
        {
            "answers": {...},           # 决策结果
            "confidence_ok": bool,      # 是否全部高置信度
            "should_escalate": bool,    # 是否需要升级给 LLM
            "latency_ms": float,        # 延迟
            "cache_hit": bool,          # 是否命中缓存
            "tag": str                  # 决策标签
        }
    """
    # 1. 缓存检查
    cache_key = hashlib.sha256(
        json.dumps({"state": state, "questions": questions}, sort_keys=True).encode()
    ).hexdigest()[:16]
    cached = _check_cache(cache_key)
    if cached:
        cached["cache_hit"] = True
        return cached

    # 2. 调用决策模型
    start = time.time()
    try:
        payload = json.dumps({
            "model": CONFIG["model"],
            "state": state,
            "questions": questions
        }).encode("utf-8")

        req = urllib.request.Request(
            CONFIG["endpoint"],
            data=payload,
            headers={
                "Authorization": f"Bearer {CONFIG['api_key']}",
                "Content-Type": "application/json"
            }
        )
        with urllib.request.urlopen(req, timeout=CONFIG["timeout_ms"] / 1000) as resp:
            result = json.loads(resp.read())
    except Exception as e:
        # 降级策略
        if CONFIG["fallback"] == "llm":
            return {
                "answers": {},
                "confidence_ok": False,
                "should_escalate": True,
                "escalation_reason": f"决策模型不可用: {e}",
                "latency_ms": time.time() - start,
                "cache_hit": False,
                "tag": tag
            }
        raise

    latency = (time.time() - start) * 1000

    # 3. 置信度检查
    answers = result.get("answers", {})
    all_confident = True
    threshold = CONFIG["confidence_threshold"]

    for qid, answer in answers.items():
        conf = answer.get("confidence", answer.get("noul", 0))
        # noul 没有 confidence 字段，用 noul 值本身
        if answer.get("type") == "noul":
            conf = max(answer["noul"], 1 - answer["noul"])
        if conf < threshold:
            all_confident = False

    # 4. 日志记录
    if CONFIG.get("log_decisions"):
        _log_decision(tag, answers, latency, all_confident)

    # 5. 缓存写入
    result_data = {
        "answers": answers,
        "confidence_ok": all_confident,
        "should_escalate": not all_confident,
        "latency_ms": round(latency, 1),
        "cache_hit": False,
        "tag": tag
    }
    _write_cache(cache_key, result_data)

    return result_data


# ─── 预置决策模板 ───
def pre_screen_plan(arch_doc: str, api_doc: str, db_doc: str, risk_report: str) -> dict:
    """方案放行预筛"""
    state = f"""
## 架构方案
{arch_doc[:3000]}

## 接口设计
{api_doc[:2000]}

## 数据库设计
{db_doc[:2000]}

## 风险扫描报告
{risk_report[:2000]}
"""
    return decide(state, {
        "has_scope": {
            "type": "noul",
            "instructions": "架构方案是否明确定义了做什么和不做什么？"
        },
        "has_api_coverage": {
            "type": "noul",
            "instructions": "每个需求是否都有对应的接口设计？"
        },
        "has_db_coverage": {
            "type": "noul",
            "instructions": "每个接口是否都有对应的数据表设计？"
        },
        "has_test_criteria": {
            "type": "noul",
            "instructions": "是否定义了可验证的验收标准？"
        },
        "tenant_compliance": {
            "type": "noul",
            "instructions": "数据库设计是否包含 TenantId 字段和多租户隔离？"
        },
        "completeness": {
            "type": "score",
            "instructions": "方案整体完整度评分",
            "criteria": [
                "严重缺失：多个关键章节缺失，无法评审",
                "不够完整：有主要章节但缺少细节",
                "基本完整：关键章节齐全，细节基本到位",
                "完整：所有章节齐全，细节充分，可直接开发"
            ]
        }
    }, tag="plan-pre-screen")


def route_intent(user_input: str) -> dict:
    """意图路由"""
    return decide(user_input, {
        "command": {
            "type": "choice",
            "instructions": "用户意图应该路由到哪个命令？",
            "criteria": {
                "new-feature": "开发新功能、新增页面、添加接口",
                "fix-bug": "修复 bug、报错、异常",
                "review": "代码审查、检查代码质量",
                "plan-gate": "方案评审、架构审查",
                "gen-test-cases": "生成测试用例",
                "deploy": "部署、发布、上线",
                "retro": "复盘、回顾",
                "req-review": "需求评审",
                "change-request": "变更请求",
                "product-discovery": "产品探索、调研"
            }
        },
        "is_clear": {
            "type": "noul",
            "instructions": "用户输入是否足够明确，可以确定路由？"
        }
    }, tag="intent-route")


def check_tenant_compliance(code_content: str) -> dict:
    """多租户合规检查"""
    return decide(code_content[:4000], {
        "has_tenant_filter": {
            "type": "noul",
            "instructions": "数据库查询是否包含 TenantId 过滤条件？"
        },
        "has_hardcoded_tenant": {
            "type": "noul",
            "instructions": "是否存在硬编码的 tenant_id 值？"
        },
        "has_cross_tenant_risk": {
            "type": "noul",
            "instructions": "是否存在跨租户数据访问风险？"
        },
        "risk_level": {
            "type": "choice",
            "instructions": "多租户合规风险等级",
            "criteria": {
                "safe": "完全合规，有 TenantId 过滤",
                "warning": "可能存在问题，需要人工确认",
                "violation": "明确的多租户隔离违规"
            }
        }
    }, tag="tenant-compliance")


# ─── 缓存与日志 ───
_cache = {}

def _check_cache(key: str) -> dict | None:
    if key in _cache:
        entry = _cache[key]
        if time.time() - entry["_ts"] < CONFIG.get("cache_ttl_seconds", 300):
            return entry
        del _cache[key]
    return None

def _write_cache(key: str, data: dict):
    data["_ts"] = time.time()
    _cache[key] = data

def _log_decision(tag: str, answers: dict, latency_ms: float, all_confident: bool):
    log_dir = Path(os.environ.get("CLAUDE_PROJECT_DIR", ".")) / ".claude" / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_entry = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "tag": tag,
        "latency_ms": round(latency_ms, 1),
        "all_confident": all_confident,
        "answers": {k: {kk: vv for kk, vv in v.items() if kk != "type"}
                    for k, v in answers.items()}
    }
    with open(log_dir / "decisions.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")


# ─── CLI 入口 ───
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Decision Gateway CLI")
    sub = parser.add_subparsers(dest="cmd")

    pre = sub.add_parser("pre-screen", help="方案放行预筛")
    pre.add_argument("--arch-doc", required=True)
    pre.add_argument("--api-doc", default="")
    pre.add_argument("--db-doc", default="")
    pre.add_argument("--risk-report", default="")

    route = sub.add_parser("route", help="意图路由")
    route.add_argument("input")

    tenant = sub.add_parser("tenant-check", help="多租户合规检查")
    tenant.add_argument("file")

    args = parser.parse_args()

    if args.cmd == "pre-screen":
        arch = Path(args.arch_doc).read_text(encoding="utf-8") if Path(args.arch_doc).exists() else ""
        api = Path(args.api_doc).read_text(encoding="utf-8") if args.api_doc and Path(args.api_doc).exists() else ""
        db = Path(args.db_doc).read_text(encoding="utf-8") if args.db_doc and Path(args.db_doc).exists() else ""
        risk = Path(args.risk_report).read_text(encoding="utf-8") if args.risk_report and Path(args.risk_report).exists() else ""
        result = pre_screen_plan(arch, api, db, risk)
    elif args.cmd == "route":
        result = route_intent(args.input)
    elif args.cmd == "tenant-check":
        content = Path(args.file).read_text(encoding="utf-8")
        result = check_tenant_compliance(content)
    else:
        parser.print_help()
        sys.exit(1)

    print(json.dumps(result, ensure_ascii=False, indent=2))
```

### 6.3 生成的 decision_config.json

```json
{
  "provider": "openrouter",
  "model": "microsoft/microsoft-decision-1",
  "endpoint": "https://openrouter.ai/api/v1/systemone",
  "api_key": "${JEV_API_KEY}",
  "confidence_threshold": 0.85,
  "timeout_ms": 5000,
  "fallback": "llm",
  "cache_ttl_seconds": 300,
  "log_decisions": true,
  "decision_points": {
    "plan_gate": {
      "description": "方案放行预筛",
      "enabled": true,
      "escalation": "plan-gatekeeper agent"
    },
    "tenant_guard": {
      "description": "多租户合规检查",
      "enabled": true,
      "escalation": "db-engineer agent"
    },
    "intent_route": {
      "description": "命令意图路由",
      "enabled": true,
      "escalation": "ask user"
    },
    "code_review": {
      "description": "代码质量快速评估",
      "enabled": false,
      "escalation": "reviewer agent"
    }
  }
}
```

---

## 七、scaffold.py 改造清单

### 7.1 新增模板文件

```
templates/.claude/
├── scripts/
│   └── decision_client.py          # ← 新增：Decision Gateway 客户端
├── hooks/
│   ├── pre_commit_guard.py         # 现有
│   ├── tenant_guard.py             # 现有（可升级为 Jev 增强版）
│   └── decision_guard.py           # ← 新增：Jev 决策钩子
├── decision_config.json            # ← 新增：决策模型配置
└── logs/
    └── decisions.jsonl             # ← 新增：决策日志（自动生成）
```

### 7.2 scaffold.py 修改点

```python
# 1. 新增 CLI 参数
parser.add_argument("--decision-model", choices=["jev", "microsoft-decision", "clef-flash", "laya", "none"],
                    default="microsoft-decision",
                    help="决策模型选择（默认 microsoft-decision-1）")

# 2. 新增 Profile tokens
"{{DECISION_MODEL}}": "microsoft/microsoft-decision-1",
"{{DECISION_ENDPOINT}}": "https://openrouter.ai/api/v1/systemone",
"{{DECISION_PROVIDER}}": "openrouter",

# 3. 新增文件复制步骤
DECISION_FILES = [
    ("scripts/decision_client.py", ".claude/scripts/decision_client.py"),
    ("hooks/decision_guard.py", ".claude/hooks/decision_guard.py"),
    ("decision_config.json", ".claude/decision_config.json"),
]

# 4. 在 settings.json 模板中增加 hooks 注册
# 5. 在 CLAUDE.md 模板中增加决策模型使用说明
```

---

## 八、成本与收益分析

### 8.1 成本估算

| 组件 | 调用频率 | 单次成本 | 月成本（100 次/天） |
|------|----------|----------|---------------------|
| Jev 决策（OpenRouter） | 高频 | $0.00001 | ~$0.03 |
| Jev 决策（本地 Clef-flash） | 高频 | $0 | $0 |
| LLM 审查（仅升级时） | 低频（~20%） | $0.05 | ~$30 |
| **总计（混合）** | - | - | **~$30** |
| **当前（纯 LLM）** | 全量 | $0.05 | **~$150** |

**成本降低约 80%**

### 8.2 延迟对比

| 场景 | 当前 | 改造后 |
|------|------|--------|
| Hook 审查 | 0（关键词匹配） | ~100ms（Jev） |
| 方案门禁 | 30-120s | 0.1s（80%场景）/ 30-120s（20%场景） |
| 命令路由 | 0（手动选择） | ~50ms（自动路由） |
| 多租户检查 | ~200ms（关键词） | ~100ms（Jev，更准确） |

### 8.3 准确性提升

| 检查项 | 当前方式 | Jev 增强后 |
|--------|----------|------------|
| 多租户红线 | 关键词匹配（高误报） | 语义理解（低误报） |
| 安全风险 | 4 个关键词 | 上下文感知分级 |
| 方案完整性 | LLM 判断（不一致） | Jev 校准概率 + LLM 深度审查 |
| 命令路由 | 用户手动选择 | 自然语言自动路由 |

---

## 九、实施路线图

### Phase 1：基础接入（1-2 天）

- [ ] 创建 `decision_client.py` — Decision Gateway 客户端
- [ ] 创建 `decision_config.json` — 配置文件模板
- [ ] 注册 OpenRouter 账号，获取 API Key
- [ ] 验证 Jev API 调用（noul / choice / score 三种原语）

### Phase 2：Hook 集成（2-3 天）

- [ ] 创建 `decision_guard.py` — PostToolUse 决策钩子
- [ ] 升级 `tenant_guard.py` — 用 Jev 替代关键词匹配
- [ ] 在 `settings.json` 模板中注册新 hooks
- [ ] 测试 hook 的 deny/allow 逻辑

### Phase 3：Agent 增强（3-5 天）

- [ ] 改造 `plan-gatekeeper.md` — 两阶段审查
- [ ] 在 `scaffold.py` 中增加决策模型配置生成
- [ ] 创建 `command_router.py` — 意图路由脚本
- [ ] 端到端测试：`/new-feature` 完整流程

### Phase 4：本地化部署（可选，5-7 天）

- [ ] 评估 Clef-flash / Laya 本地部署
- [ ] 搭建本地推理服务（vLLM / Ollama）
- [ ] 修改 `decision_config.json` 切换到本地端点
- [ ] 性能基准测试（延迟、准确率）

---

## 十、风险与注意事项

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| OpenRouter 国内不可达 | 🔴 高 | 本地部署 Clef-flash / Laya 作为备选 |
| Jev 概率漂移（权重更新） | 🟡 中 | 定期重校阈值；或锁定模型版本 |
| 决策模型误判 | 🟡 中 | 保留 LLM 降级路径；记录所有决策日志 |
| API Key 泄露 | 🟡 中 | 环境变量注入，不写入代码；hook 扫描 |
| 额外延迟影响体验 | 🟢 低 | Jev P50 ~85ms，体感无感知；设超时降级 |
| 数据合规（数据出境） | 🟡 中 | 敏感项目用本地部署；或评估 Azure 合规 |

---

## 参考文档

- `docs/微软决策模型深度调研报告.md` — Microsoft-Decision-1 技术分析
- `docs/决策模型开源替代方案对比.md` — 9 款开源模型对比
- `docs/Jev决策模型深度调研-设计方案与架构.md` — Jev 设计哲学与 API 规范
