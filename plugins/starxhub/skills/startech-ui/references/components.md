# 星辰组件清单（真实类名）

> 只列类名与域，不复制完整文档。具体属性以 `assets/presets/startech/` 内 CSS / WXSS 为准。

## 1. 组件域

| 域 | 星辰 starTech（`hx-` / 小程序 `st-`） | 实现说明 |
|---|---|---|
| 布局 layout | `hx-app` `hx-sidebar` `hx-topbar` `hx-main` `hx-page-header` | 真实骨架由 `app.js` 的 `render()/sidebar()/topbar()` 渲染 |
| 基础 base | `hx-btn` `hx-input` `hx-select` `hx-textarea` `hx-tag` `hx-card` `hx-modal` `hx-pagination` `hx-empty` `hx-icon` | Web 组件类；H5 复用同一套 |
| 业务 biz | `hx-data-table` `hx-filter-bar` `hx-stat-card` `hx-status-tag` `hx-todo-item` | 独立 biz 层 |
| 图表 charts | `HxLineChart` `HxDonutChart` `Sparkline`（Vue SFC） | 纯 SVG，无第三方依赖 |
| 反馈 feedback | `hx-alert` `hx-progress` `hx-timeline` `hx-skeleton` | — |
| 导航 nav | `hx-tabs` `hx-tab` `hx-crumb` `hx-nav` | 端层只做作用域微调 |
| 小程序 miniapp | `st-appbar` `st-btn` `st-card` `st-select` `st-input` `st-tabs` `st-tabbar` `st-chart` 等 99 个 `st-*` 类 | 原生 WXML/WXSS，27 个组件区，类名与 Web 保持同类名语义 |

## 2. 图表禁令

**禁令**：`preserveAspectRatio="none"`（变形元凶）；轴文字进 SVG viewBox（字号随容器放大）；`<text>` 里放带中文的数字串（Ardot 会竖排）。轴标签统一 HTML 层 12px。

图表色板顺序固定，不调换；对比色单独令牌。

## 3. 关键交互规则

### 下拉 Select / Dropdown

- trigger 是按钮，键盘可达；Enter：展开且有高亮项 → 选中；否则开/关。
- 箭头区做成可点击按钮区：28×28 圆角，SVG chevron，左侧分隔线；展开态品牌色底 + 白色箭头朝上；触控 36×36。
- 原生 `<select>` 样式只在 `common.css` 定义一次；组件展示块若与它冲突，删展示块。
- 浮层挂到 `body` 并按触发框位置定位，下方空间不足时向上翻转（避免被卡片 `overflow:hidden` 裁切）；点击外部 / Esc 关闭。

### 文本域 Textarea

必须与 Input 六项计算样式一致：`border` / `border-radius` / `font-size` / `color` / `background` / `focus`+`error`+`disabled`。否则会退化成浏览器默认灰框方角。

### Tab

- 收敛到组件类 `hx-tab`，端层只做作用域微调。
- 端层设了 `font-weight:500` 时必须显式补 `.is-active { font-weight:600 }`，否则同优先级下端样式后加载会压掉激活态。

### 实例页布局

- 语义类控制满宽（如 `.pc-item--wide { grid-column:1/-1 }`），不用内联样式。
- 分组规则：宽内容独占一行，小控件两两成对，不允许落单。

## 4. 页面模板顺序

- **后台**：侧栏 → 顶栏 → 页头 → 指标卡 → 图表区 → 列表/表格 → 弹层。
- **H5 / 小程序**：状态栏安全区 → 导航 → 内容卡 → 底部操作区 → TabBar 安全区。

## 5. 组件类扫描

`scripts/check-classes.mjs <target-dir>` 扫描目标目录里 `hx-*` / `st-*` 的使用类与 CSS 定义，报出"用了但没定义"的类。返回 0 才算通过。注意：跨目录复制 showcase 时若只拷 HTML/JS 不拷 CSS，脚本会立刻报出大量缺失。
