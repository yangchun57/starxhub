# 星辰 starTech 三端组件覆盖矩阵

> 版本 v1.0 ｜ 2026-11-17
> 目的：让「规范文档 ↔ 三端可运行代码」一一对应可查，避免纸面组件与代码脱节。
> 配套：`DESIGN_SPEC.md` / `MOBILE_SPEC.md`（源工程 docs/）。

---

## 0. 结论先行

星辰规范 **PC / H5 / 小程序三端齐备**，且每端都有可运行代码：

| 端 | 位置（skill 内） | 覆盖 |
|---|---|---|
| PC 端 | `assets/presets/startech/web/` | `index.html` + `components.html`（16 域）+ 源工程 `src/components/`（21 Vue SFC） |
| H5 端 | `assets/presets/startech/mobile/` | `index.html` + `components.html`（35 区） |
| 小程序端（原生） | `assets/presets/startech/miniapp/` | 27 区，99 个 `st-*` 类，WXML/WXSS/JS 全可运行 |

**三端共用纪律**：
- 令牌单一真源（源工程 `src/styles/tokens.css`）
- 样式四层：`tokens → common → components → 端样式`
- 端样式后置且加作用域前缀，不重定义组件视觉
- 小程序端：原生组件但**同名类 + 同令牌 + 同 API**

---

## 1. 星辰三端组件矩阵

规范来源：`DESIGN_SPEC.md` §9（PC）、`MOBILE_SPEC.md` §8（移动端）。

### 1.1 PC 端（`web/` + `src/components`）

| 组件域 | 规范条目 | Vue SFC | 实例页类名 |
|---|---|---|---|
| 布局 Layout | §9.1 | AppShell / AppSidebar / AppTopbar / PageHeader | `hx-app` `hx-sidebar` `hx-topbar` `hx-main` |
| 按钮 Button | §9.2 | HxButton | `hx-btn` + 5 变体 + 3 尺寸 |
| 输入 Input | §9.2 | HxInput | `hx-input` `hx-textarea` `hx-input-wrap` |
| 下拉 Select | §9.2（重点） | HxSelect | `hx-select-wrap` `hx-select-arrow` `hx-select-panel` |
| 标签 Tag | §9.2 | HxTag / StatusTag | `hx-tag` + 6 变体 |
| 卡片 Card | §9.2 | HxCard | `hx-card` `hx-side-card` |
| 分页 Pagination | §9.2 | HxPagination | `hx-pagination` `hx-summary-bar` |
| 空态 / 弹窗 | §9.2 | HxEmpty / HxModal | `hx-empty` `hx-modal` `hx-skeleton` |
| 图标 Icon | §10 | HxIcon | `hx-icon-block` `hx-icon-btn` |
| 业务组件 | §9.3 | DataTable / FilterBar / StatCard / TodoItem | `hx-table` `hx-filter` `hx-stat` `hx-todo` |
| 图表 Charts | §9.4 | HxLineChart / HxDonutChart / Sparkline | `hx-chart` `hx-stat-spark` + SVG |
| 反馈 Feedback | §9.2 | — | `hx-alert` `hx-progress` `hx-timeline` |
| 导航 Nav | §11 | — | `hx-tabs` `hx-tab` `hx-crumb` `hx-nav` |

### 1.2 H5 端（`mobile/`）

35 个组件区，覆盖 `MOBILE_SPEC.md` §8 全部 14 类 + 扩展组件：导航栏、搜索框、按钮、卡片、状态标签、筛选 Chip、列表项、TabBar、底部 Sheet、Toast、空态、骨架屏、错误态、输入框变体、下拉、日期、步进、评分、滑块、单选/多选、Tabs、Modal、通知条、结果页、图表、商品卡、倒计时、地址卡、宫格、折叠、上传、数字键盘、固定 CTA。

### 1.3 小程序端（`miniapp/` · 原生 WXML/WXSS）

| §8 组件 | WXML 区 | 小程序实现 | 关键类 |
|---|---|---|---|
| 导航栏 | 01 | `navigationStyle: custom` 自绘 | `st-appbar` `st-back` `st-capsule` |
| 搜索框 | 02 | `<input confirm-type="search">` | `st-search` `st-input` |
| 主/次/幽灵按钮 | 03 | `<button hover-class="none">` | `st-btn--primary/soft/ghost` |
| 卡片 | 04 | `<view>` | `st-card` `st-kpi` |
| 状态标签 | 05 | `<text>` | `st-tag--*` |
| 筛选 Chip | 06 | `<scroll-view scroll-x>` | `st-chip.is-active` |
| 列表项 | 07 | `wx:for` | `st-list-item` |
| 输入框 | 08 | `<input>` + 字数统计/错误态 | `st-input-wrap` `st-input-count` |
| 下拉 | 09 | 原生 `<picker>` | `st-select` `st-select-trigger` |
| 单选/多选/开关 | 10–11 | `radio-group`/`checkbox-group`/`switch` | `st-radio-item` `st-checkbox-item` |
| 步进/评分/滑块 | 12–14 | 自绘 + 原生 slider | `st-stepper` `st-rating` `slider` |
| 日期选择 | 15 | `<picker mode="date">` | `st-date-picker` |
| 上传 | 16 | `wx.chooseMedia` | `st-upload` `st-upload-item` |
| Tabs | 17 | 自绘 | `st-tabs` `st-tab.is-active` |
| TabBar | 18 | `app.json` 原生配置 | `st-tabbar` `st-tab-item` |
| 底部 Sheet / Toast / Modal | 19–21 | 自绘 + `wx.showToast` | `st-sheet` `st-toast` `st-modal` |
| 空态 / 骨架 / 错误态 | 22 | 自绘 | `st-placeholder` `st-skeleton` `st-result` |
| 通知条 / 宫格 / 折叠 | 23–25 | 自绘 | `st-notice-bar` `st-grid` `st-collapse` |
| 业务卡片 | 26 | 自绘 | `st-product-card` `st-countdown` `st-address-card` |
| 图表 | 27 | Canvas 2D / view 柱图 | `st-chart` + 原生 text 轴标签 |

---

## 2. 维护约定

1. **改规范后跑同步**：`npm run sync:skills`（机械副本自动分发）；本包 `assets/` 与 `references/COMPONENT_COVERAGE.md` 由脚本同步，其余人工文档脚本不碰。
2. **新增组件时三端同步**：规范文档加条目 → PC 实例页加示例 → H5 实例页加示例 → 小程序实例页加 WXML/WXSS 示例 → 跑 `check-classes` 确认无缺失类。
3. **类名必须真实存在**：示例页用的每个类都要在对应 CSS/WXSS 有定义。`check-classes.mjs` 会扫描未定义类。
4. **小程序端 API 一致性**：渲染层可用原生组件，但对外 API（value/options/change）与 H5 保持一致。
5. **图表禁令**：禁止 `preserveAspectRatio="none"`；轴标签放 HTML/原生 text 层固定 12px。

---

## 3. 已知边界

- **小程序图表为简化示例**：用 view + 百分比高度演示，生产环境请用 Canvas 2D 并保留轴标签文本层。
- **wx.chooseMedia / wx.uploadFile**：上传示例仅演示交互入口，未接后端。
