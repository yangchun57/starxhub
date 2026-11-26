import { Plugin } from "@opencode/plugin"
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
