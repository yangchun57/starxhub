#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 starxhub 的 Claude Code 模板转换为 OpenCode V2 配置包。

双引擎同源：技术栈映射直接复用 scaffold.py 的 BACKENDS / FRONTS / ALWAYS_RULES，
不另建一份映射表，避免"Claude 改了、OpenCode 没跟上"。

用法：
    python build.py [--out 目标项目根目录] [--backend dotnet|python|java-spring]
                    [--frontend vue|uniapp|startech] [--multi-tenant]
                    [--model-sonnet provider/model] [--model-opus provider/model]

默认输出目录为本脚本所在目录（plugins4opencode/），生成布局：
    <out>/AGENTS.md
    <out>/opencode.jsonc
    <out>/.opencode/agents|commands|plugins|rules|skills
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import re
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SCAFFOLD_PY = ROOT / "plugins/starxhub/skills/new-project/scripts/scaffold.py"
TEMPLATE_DIR = ROOT / "plugins/starxhub/skills/new-project/templates/.claude"
CLAUDE_MD = ROOT / "plugins/starxhub/skills/new-project/templates/CLAUDE.md"
PLUGIN_SKILLS = ROOT / "plugins/starxhub/skills"

TOOL_TO_ACTION = {
    "Read": "read",
    "Glob": "glob",
    "Grep": "grep",
    "Write": "edit",
    "Edit": "edit",
    "Bash": "shell",
    "WebFetch": "webfetch",
    "WebSearch": "websearch",
    "Task": "subagent",
}


def load_scaffold():
    """复用原脚手架的技术栈映射，避免维护两份常量。"""
    spec = importlib.util.spec_from_file_location("starxhub_scaffold", SCAFFOLD_PY)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"无法加载 {SCAFFOLD_PY}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def split_frontmatter(text: str):
    text = text.replace("\r\n", "\n")
    match = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.S)
    if not match:
        return {}, text
    frontmatter, body = match.group(1), match.group(2)
    fields = {}
    for line in frontmatter.splitlines():
        m = re.match(r"^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$", line)
        if m:
            fields[m.group(1)] = m.group(2).strip()
    return fields, body


def strip_frontmatter(text: str) -> str:
    _, body = split_frontmatter(text)
    return body.lstrip("\n")


def render_placeholders(text: str, mapping: dict) -> str:
    for token, value in mapping.items():
        text = text.replace(token, value)
    return text


def render_conditionals(text: str, multi_tenant: bool) -> str:
    keep = "TENANT" if multi_tenant else "SINGLE"
    lines, current = [], None
    for line in text.splitlines():
        if "#@@TENANT_ONLY_START" in line:
            current = "TENANT"
            continue
        if "#@@SINGLE_ONLY_START" in line:
            current = "SINGLE"
            continue
        if "#@@TENANT_ONLY_END" in line or "#@@SINGLE_ONLY_END" in line:
            current = None
            continue
        if current is None or current == keep:
            lines.append(line)
    return "\n".join(lines).rstrip() + "\n"


def render_text(text: str, mapping: dict, multi_tenant: bool) -> str:
    """把 Claude Code 语境改写为 OpenCode 语境。"""
    text = render_conditionals(text, multi_tenant)
    text = render_placeholders(text, mapping)
    text = text.replace("CLAUDE.md", "AGENTS.md")
    text = text.replace(".claude/agents/", ".opencode/agents/")
    text = text.replace(".claude/rules/", ".opencode/rules/")
    text = text.replace("Task 工具", "subagent 工具")
    text = text.replace("SubAgent", "subagent")
    return text


def model_for(role: str, args) -> str:
    role = (role or "").lower()
    if role == "opus":
        return args.model_opus
    if role == "haiku":
        return args.model_haiku
    return args.model_sonnet


def permissions_for(tools: str, agent_name: str) -> str:
    """把 Claude Code 的 tools 白名单翻译成 OpenCode V2 permissions 列表。"""
    requested = {t.strip() for t in tools.split(",") if t.strip()}
    actions = {TOOL_TO_ACTION[t] for t in requested if t in TOOL_TO_ACTION}

    rules = []
    if "edit" in actions:
        rules.append({"action": "edit", "resource": "*", "effect": "allow"})
    else:
        # 只读角色：显式拒绝写入，这是门禁 agent 的硬约束
        rules.append({"action": "edit", "resource": "*", "effect": "deny"})

    if "shell" in actions:
        rules.append({"action": "shell", "resource": "*", "effect": "allow"})
    else:
        rules.append({"action": "shell", "resource": "*", "effect": "deny"})

    for action in ("webfetch", "websearch"):
        if action in actions:
            rules.append({"action": action, "resource": "*", "effect": "allow"})

    # 保持现有串行编排语义：subagent 不再嵌套拉起 subagent
    rules.append({"action": "subagent", "resource": "*", "effect": "deny"})

    lines = ["permissions:"]
    for rule in rules:
        lines += [
            f"  - action: {rule['action']}",
            f'    resource: "{rule["resource"]}"',
            f"    effect: {rule['effect']}",
        ]
    return "\n".join(lines)


def write_agents(out: Path, mapping: dict, args) -> list[str]:
    src = TEMPLATE_DIR / "agents"
    dst = out / ".opencode" / "agents"
    dst.mkdir(parents=True, exist_ok=True)
    names = []
    for path in sorted(src.glob("*.md")):
        fields, body = split_frontmatter(path.read_text(encoding="utf-8"))
        name = fields.get("name") or path.stem
        description = render_text(fields.get("description", ""), mapping, args.multi_tenant).strip()
        header = "\n".join(
            [
                "---",
                f"description: {json.dumps(description, ensure_ascii=False)}",
                "mode: subagent",
                f"model: {model_for(fields.get('model'), args)}",
                permissions_for(fields.get("tools", ""), name),
                "---",
                "",
            ]
        )
        (dst / f"{name}.md").write_text(
            header + render_text(body, mapping, args.multi_tenant), encoding="utf-8"
        )
        names.append(name)
    return names


def write_commands(out: Path, mapping: dict, args) -> list[str]:
    src = TEMPLATE_DIR / "commands"
    dst = out / ".opencode" / "commands"
    dst.mkdir(parents=True, exist_ok=True)
    names = []
    for path in sorted(src.glob("*.md")):
        fields, body = split_frontmatter(path.read_text(encoding="utf-8"))
        description = render_text(fields.get("description", ""), mapping, args.multi_tenant).strip()
        header = "\n".join(
            [
                "---",
                f"description: {json.dumps(description, ensure_ascii=False)}",
                # 编排命令必须留在主会话，由它调用 subagent 工具派发角色
                "subagent: false",
                "---",
                "",
            ]
        )
        (dst / path.name).write_text(
            header + render_text(body, mapping, args.multi_tenant), encoding="utf-8"
        )
        names.append(path.stem)
    return names


def write_rules(out: Path, mapping: dict, args, module) -> tuple[list[str], list[str]]:
    src = TEMPLATE_DIR / "rules"
    dst = out / ".opencode" / "rules"
    dst.mkdir(parents=True, exist_ok=True)

    always, selected = [], []
    for group in ("_always", "_backend", "_frontend"):
        for path in sorted((src / group).glob("*.md")):
            rendered = render_text(strip_frontmatter(path.read_text(encoding="utf-8")), mapping, args.multi_tenant)
            (dst / path.name).write_text(rendered, encoding="utf-8")
            if group == "_always":
                always.append(f".opencode/rules/{path.name}")
            elif (group == "_backend" and args.backend and args.backend in path.name) or (
                group == "_frontend" and args.frontend and args.frontend in path.name
            ):
                selected.append(f".opencode/rules/{path.name}")
    return always, selected


def write_agents_md(out: Path, mapping: dict, args, instructions: list[str]) -> None:
    text = CLAUDE_MD.read_text(encoding="utf-8")
    text = render_text(text, mapping, args.multi_tenant)
    text = text.replace(
        "**路径范围规范**（`.opencode/rules/`）已按技术栈配置，编辑匹配文件时**自动注入上下文**：",
        "**规范加载**（OpenCode）：不再使用路径范围自动注入；规则由 `opencode.jsonc` 的 `instructions` 全量注入，"
        "未选中的技术栈变体只落盘、不加载。",
    )
    text += (
        "\n## OpenCode 规则索引\n\n"
        "已在 `opencode.jsonc → instructions` 中加载：\n\n"
        + "\n".join(f"- `{item}`" for item in instructions)
        + "\n\n其他技术栈变体位于 `.opencode/rules/`，需要切换技术栈时把对应文件名加入 `instructions`。\n"
        "角色位于 `.opencode/agents/`，流程命令位于 `.opencode/commands/`，护栏插件位于 `.opencode/plugins/`。\n"
    )
    (out / "AGENTS.md").write_text(text, encoding="utf-8")


def opencode_jsonc(instructions: list[str]) -> str:
    payload = {
        "$schema": "https://opencode.ai/config.json",
        "default_agent": "build",
        "instructions": instructions,
        "permission": [
            {"action": "shell", "resource": "rm -rf *", "effect": "deny"},
            {"action": "shell", "resource": "git push *", "effect": "deny"},
            {"action": "shell", "resource": "git reset --hard *", "effect": "deny"},
            {"action": "shell", "resource": "git clean -fd *", "effect": "deny"},
        ],
    }
    body = json.dumps(payload, ensure_ascii=False, indent=2)
    return (
        "// starxhub OpenCode V2 配置（由 build.py 生成，勿手改；改源模板后重跑）\n"
        "// 护栏插件由 .opencode/plugins/*.ts 自动发现；测试命令可用环境变量 OPENCODE_TEST_COMMAND 覆盖。\n"
        + body
        + "\n"
    )


TENANT_GUARD_TS = r'''import { Plugin } from "@opencode/plugin"

// 由 Claude Code 的 .claude/hooks/tenant_guard.py 移植而来。
// OpenCode V2 没有 hooks，改用 tool/permission hook。
const SECRET_PATTERNS: RegExp[] = [
  /\bpassword\s*[:=]\s*["'][^"']{3,}["']/i,
  /\bapi[_\s-]?key\s*[:=]\s*["'][^"']{8,}["']/i,
  /\bsecret\s*[:=]\s*["'][^"']{8,}["']/i,
  /\bsk-[A-Za-z0-9_-]{16,}\b/,
]

function collectText(value: unknown, out: string[]): void {
  if (typeof value === "string") {
    out.push(value)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectText(item, out)
    return
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectText(item, out)
  }
}

export default Plugin.define({
  id: "starxhub.tenant-guard",
  async setup(ctx) {
    // 写入前扫描：检测到疑似硬编码凭据时告警（V2 tool hook 无 typed rejection）
    await ctx.tool.hook("execute.before", (event) => {
      if (!["write", "edit", "patch", "apply_patch"].includes(event.tool)) return
      const parts: string[] = []
      collectText(event.input, parts)
      if (parts.some((part) => SECRET_PATTERNS.some((re) => re.test(part)))) {
        console.error("[tenant-guard] 检测到疑似硬编码敏感信息，请确认后再提交。")
      }
    })

    // 硬阻断：敏感配置文件不允许 Agent 自动改写
    await ctx.permission.hook("evaluate", (event) => {
      if (event.action !== "edit") return
      const blocked = event.resources.some(
        (resource) =>
          /(^|\/)\.env(\..+)?$/.test(resource) ||
          /(\.key|\.pem|secrets?\.(json|ya?ml))$/i.test(resource),
      )
      if (blocked) {
        event.effect = "deny"
        event.message = "[tenant-guard] 敏感配置文件禁止由 Agent 自动改写"
      }
    })
  },
})
'''

PRE_COMMIT_GUARD_TS = r'''import { Plugin } from "@opencode/plugin"
import { spawnSync } from "node:child_process"

// 由 Claude Code 的 .claude/hooks/pre_commit_guard.py 移植而来。
// git commit 前跑测试；失败则通过 permission hook 硬阻断。
type Options = {
  testCommand?: string
  backendDir?: string
}

export default Plugin.define({
  id: "starxhub.pre-commit-guard",
  async setup(ctx) {
    const options = (ctx.options ?? {}) as Options
    const testCommand =
      options.testCommand ?? process.env.OPENCODE_TEST_COMMAND ?? "dotnet test"
    const backendDir = options.backendDir ?? process.env.OPENCODE_BACKEND_DIR ?? "src/backend/api"
    const checked = new Map<string, number>()

    await ctx.permission.hook("evaluate", (event) => {
      if (event.action !== "shell") return
      const command = event.resources.join(" ").trim()
      if (!/^git\s+commit\b/.test(command)) return

      const key = `${event.sessionID}:${command}`
      const now = Date.now()
      if (now - (checked.get(key) ?? 0) < 60_000) return
      checked.set(key, now)

      console.error("[pre-commit-guard] 检测到 git commit，先运行构建和测试…")
      const [binary, ...args] = testCommand.split(/\s+/)
      const result = spawnSync(binary, args, {
        cwd: `${ctx.location.directory}/${backendDir}`,
        encoding: "utf8",
        shell: true,
      })
      if (result.status !== 0) {
        event.effect = "deny"
        event.message = `构建或测试未通过（${testCommand}）：${(result.stderr || result.stdout || "").slice(-600)}`
      }
    })
  },
})
'''


def write_plugins(out: Path) -> None:
    dst = out / ".opencode" / "plugins"
    dst.mkdir(parents=True, exist_ok=True)
    (dst / "tenant-guard.ts").write_text(TENANT_GUARD_TS, encoding="utf-8")
    (dst / "pre-commit-guard.ts").write_text(PRE_COMMIT_GUARD_TS, encoding="utf-8")


def write_skills(out: Path) -> int:
    src = PLUGIN_SKILLS / "startech-ui"
    dst = out / ".opencode" / "skills" / "startech-ui"
    if not src.exists():
        return 0
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    return sum(1 for _ in dst.rglob("*") if _.is_file())


def build(args) -> dict:
    module = load_scaffold()
    if args.backend and args.backend not in module.BACKENDS:
        raise SystemExit(f"未知后端：{args.backend}")
    if args.frontend and args.frontend not in module.FRONTS:
        raise SystemExit(f"未知前端：{args.frontend}")

    mapping = {
        "{{PROJECT_NAME}}": args.name,
        "{{PROJECT_DESC}}": args.desc or "（待填写项目简介）",
    }
    if args.backend:
        mapping.update(module.BACKENDS[args.backend]["tokens"])
    else:
        mapping.update(
            {
                "{{BACKEND_STACK}}": "待定（未指定 --backend）",
                "{{ORM}}": "待定",
                "{{ENVELOPE}}": "统一响应封装（待定）",
                "{{FIELD_MAPPING}}": "后端 PascalCase ↔ 前端 camelCase（待确认）",
                "{{BACKEND_BUILD}}": "（待填写构建命令）",
                "{{BACKEND_TEST}}": "（待填写测试命令）",
                "{{BACKEND_LINT}}": "（待填写 lint 命令）",
                "{{TEST_FRAMEWORK}}": "待定",
                "{{BACKEND_STANDARDS_FILE}}": "（待接入规范目录）",
            }
        )
    if args.frontend:
        mapping.update(module.FRONTS[args.frontend]["tokens"])
    else:
        mapping.update(
            {
                "{{FRONTEND_STACK}}": "待定（未指定 --frontend）",
                "{{UI_LIB}}": "待定",
                "{{FRONTEND_STANDARDS_FILE}}": "（待接入规范目录）",
            }
        )
    mapping["{{BACKEND_ENVELOPE}}"] = mapping.get("{{ENVELOPE}}", "统一响应封装")

    out = args.out.resolve()
    out.mkdir(parents=True, exist_ok=True)

    agents = write_agents(out, mapping, args)
    commands = write_commands(out, mapping, args)
    always, selected = write_rules(out, mapping, args, module)
    instructions = always + selected
    write_agents_md(out, mapping, args, instructions)
    (out / "opencode.jsonc").write_text(opencode_jsonc(instructions), encoding="utf-8")
    write_plugins(out)
    skill_files = write_skills(out)

    return {
        "out": str(out),
        "agents": len(agents),
        "commands": len(commands),
        "rules": len(always) + len(selected),
        "instructions": instructions,
        "skill_files": skill_files,
        "plugins": 2,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Claude Code 模板 → OpenCode V2 配置包")
    parser.add_argument("--out", type=Path, default=HERE, help="输出目录，默认 plugins4opencode/")
    parser.add_argument("--name", default="星枢项目", help="项目名称")
    parser.add_argument("--desc", default="", help="项目一句话描述")
    parser.add_argument("--backend", default=None, choices=["dotnet", "python", "java-spring"])
    parser.add_argument("--frontend", default=None, choices=["vue", "uniapp", "startech"])
    parser.add_argument("--multi-tenant", action="store_true", help="保留多租户红线条款")
    parser.add_argument("--model-sonnet", default="anthropic/claude-sonnet-5-5")
    parser.add_argument("--model-opus", default="anthropic/claude-sonnet-5-5#high")
    parser.add_argument("--model-haiku", default="anthropic/claude-haiku-4-5")
    args = parser.parse_args()

    result = build(args)
    print(f"输出目录：{result['out']}")
    print(f"agents: {result['agents']} / commands: {result['commands']} / rules: {result['rules']} / plugins: {result['plugins']} / skill files: {result['skill_files']}")
    print("instructions:")
    for item in result["instructions"]:
        print(f"  - {item}")
    leftovers = []
    for path in args.out.resolve().rglob("*.md"):
        text = path.read_text(encoding="utf-8")
        if re.search(r"\{\{[A-Z_]+\}\}", text):
            leftovers.append(path.name)
    if leftovers:
        print(f"[警告] 仍有未渲染占位符：{', '.join(sorted(set(leftovers)))}", file=sys.stderr)


if __name__ == "__main__":
    main()
