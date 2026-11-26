# 前端页面与组件规范（星辰 starTech 设计系统）

## 铁律（MUST）

1. **Vue SFC 不写 `<style>`**（含 `<style scoped>`）。外观一律用 `hx-` 类名；样式唯一来源是 `src/styles/tokens.css → common.css → components.css`。
2. 业务 UI 中禁止 `#RRGGBB` / `rgb()` 字面量，颜色只走 `var(--hx-*)`；例外仅限装饰性 SVG 与横幅渐变（见规范 §4.4）。
3. 组件分四层：`layout/` 骨架、`base/` 无业务语义控件、`biz/` 业务复合件、`charts/` 纯 SVG 图表。业务视图只依赖组件名与 Props，基础件可整体替换。
4. 浮层（下拉 / 弹窗）必须 `Teleport to="body"` + `position: fixed`，层级 100 / 200；**禁止原生 `<select>` 残留**。
5. 路由用 `createWebHashHistory()`；`NAV_ITEMS` 是导航 / 面包屑 / 路由唯一配置源，每条路由带 `meta.title` + `meta.crumb`，未匹配统一重定向 `/dashboard`。
6. 命名：视图 `<模块>View.vue`，组件 `Hx` / `App` 前缀 PascalCase，CSS 类 `hx-` 前缀（变体 `--`、状态 `is-`），令牌 `--hx-<类别>-<语义>`。
7. 状态色表达业务语义（`--hx-success` / `--hx-danger`），**不得复用为行情涨跌色**；接入行情模块须按 A 股惯例另定义涨红跌绿令牌。

**违反后果**：样式双重来源、浮层被 `overflow: hidden` 裁切、长内容被静默裁掉、暗色模式白条、下拉值不同步。

## 页面骨架

```vue
<template>
  <div class="hx-page">
    <PageHeader title="页面标题" desc="一句话说明" />
    <div class="hx-card"><!-- 内容 --></div>
  </div>
</template>
<script setup lang="ts">
import PageHeader from '@/components/layout/PageHeader.vue'
</script>
```

禁止在 SFC 内出现任何 `<style>` 段落。

## 边界与流程

- `.hx-app` 锁 `100dvh`；`.hx-nav` 与 `.hx-content` 各自独立滚动，`.hx-content > *` 必须 `flex-shrink: 0`。
- **改令牌三步**：改 `src/styles/tokens.css` → `npm run sync:showcase` → 更新规范 §3 令牌表。漏第 2 步预览页会用到旧样式。
- **新增页面五步**：建视图 → 追加 `NAV_ITEMS` → 追加 `routes`（含 meta）→ 搭区块 → `npm run build` + `npm run sync:showcase`。
- 简单展示页可省略分页；设计稿与默认样式冲突时优先设计稿，通过 `components.css` 覆盖，不改 SFC。

## 详细规范

- @.claude/standards/星辰前端开发规范.md
- @.claude/standards/topics/INDEX.md
