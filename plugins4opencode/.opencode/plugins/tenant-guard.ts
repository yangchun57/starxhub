import { Plugin } from "@opencode/plugin"

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
