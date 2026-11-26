---
name: startech-ui
description: 星辰 starTech 单品牌 UI 规范执行器（前缀 --hx-* / hx-*，科技蓝 #2f6df6，深色侧栏企业后台）。内置令牌真源与四层样式，以及后台 Web、H5 移动端、原生微信小程序三端可运行组件示例。生成、改造或审查星辰品牌的后台管理端 / H5 / 小程序页面与组件，强制令牌单一真源、四层样式顺序（tokens→common→components→端样式）、系统无衬线字体、SVG 图表等比与三端共用类名。当用户要求按星辰 / starTech 规范做页面、修复 hx-* 样式漂移、校验令牌副本一致性、查询星辰令牌色值字阶或组件清单时使用。
license: MIT
compatibility: "claude-code, opencode, codex, cursor, and other Agent Skills compatible CLI agents"
metadata:
  version: "1.0.0"
  spec: "starTech DESIGN_SPEC v1.1 + MOBILE_SPEC v1.0"
  prefix: "hx"
  note: "startech-only lean skill; no HNU / MUJI / brand-generation"
---

# 星辰 starTech UI 规范（精简版）

## Purpose

把星辰 starTech 这一套已落地验证的 UI 体系变成可执行指令：令牌真源、四层样式、三端可运行示例。单一品牌，无需判定——所有产出统一用 `--hx-*` 令牌与 `hx-*` 类名。

## When to use

- 生成星辰品牌的后台 / H5 / 小程序页面与组件。
- 把已有页面改造成星辰规范，或审查令牌漂移、宋体残留、图表变形、布局漂移。
- 查询星辰的色值、字阶、组件清单、三端覆盖情况。

## Non-negotiable rules

1. **令牌单一真源，整份落地。** 所有颜色 / 间距 / 圆角 / 阴影 / 字号写 `var(--hx-*)`，不在组件规则里硬编码品牌色。真源是 `assets/presets/startech/styles/tokens.css`（69 Light + 23 Dark）；展示目录里的 CSS 是同步副本，禁止手改。
2. **四层顺序，永远。** `tokens → common → components → 端样式`。端样式最后引入，只在父级作用域内微调（如 `.admin-tabs .hx-tab`），禁止裸 `.hx-select` 式全局覆盖。
3. **字体零依赖、标题正文同族。** 系统无衬线 `--hx-font-sans`（含 Noto Sans SC 回退链，无需安装）。serif 令牌只是 sans 别名。拒绝 `SimSun` / `宋体` / 裸 `serif`。
4. **图表等比。** SVG 用 `viewBox`，禁用 `preserveAspectRatio="none"`；轴标签放 HTML 层固定 12px，不放进 viewBox。
5. **三端共用类名。** Web 后台与 H5 复用同一套 `hx-*` 组件类；小程序用原生组件但保持同类名、同令牌（小程序历史类为 `st-*`，见 `references/components.md`）。
6. **品牌色固定。** 主色 `--hx-brand: #2f6df6`，不得替换成其他品牌色。
7. **布局骨架同构。** `index.html` 是空壳，真实布局由 `app.js` 的 `render()/sidebar()/topbar()` 渲染；示例页第 1 节必须与其同构，改骨架后跑 `check-layout.mjs`。

## Workflow

### A. 生成新页面

1. 从 `assets/presets/startech/` 复制对应端骨架：`web/`（后台）、`mobile/`（H5）、`miniapp/`（原生小程序）。
2. 用 `hx-*` / `st-*` 类名组装页面，所有视觉量走 `var(--hx-*)`。
3. 入口按四层顺序引入样式，端样式放最后。
4. 校验：`node scripts/check-tokens.mjs`、`node scripts/check-classes.mjs <target-dir>`。

### B. 审查 / 问答

1. 只加载需要的 reference；结论必须引用具体令牌名或类名，不凭记忆写色值。
2. 令牌副本一致性跑 `check-tokens.mjs`；缺类跑 `check-classes.mjs`；布局示例与真实 `app.js` 骨架漂移跑 `check-layout.mjs`（比对同构，非硬编码断言）。

### C. 改规范后同步

本包是机械副本：`assets/presets/startech/` 由源工程 `sync-skill.mjs` 从真源自动分发。改样式 / 示例后跑 `npm run sync:skills`；references 目录下的人工文档与 `SKILL.md` 是提炼内容，脚本不碰。

## References

- `references/tokens.md` — 令牌速查（色值 / 字阶 / 尺寸 / 图表色板）。
- `references/components.md` — 三端组件清单与真实类名、关键交互规则。
- `references/mobile.md` — H5 与小程序双端规范。
- `references/pitfalls.md` — 星辰踩坑清单，宣称完成前必读。
- `references/COMPONENT_COVERAGE.md` — 三端组件覆盖矩阵，生成页面前先查组件在目标端是否有示例。

所有路径相对 `SKILL.md` 所在目录；Claude Code 可用 `${CLAUDE_SKILL_DIR}` 定位。

## Version

startech-ui v1.0.0 — 从 ui-spec-kit 的 startech preset 拆出的单品牌精简版；样式与示例由 `sync-skill.mjs` 与源工程保持机械同步。
