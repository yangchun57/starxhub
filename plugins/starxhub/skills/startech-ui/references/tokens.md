# 星辰 starTech 令牌速查

> 前缀：`--hx-` / `hx-`。真源：`assets/presets/startech/styles/tokens.css`（完整值以 CSS 为准，本文件仅供速查）。

## 品牌定位

科技感企业后台，冷灰蓝基调，深色侧栏，科技蓝主色。适合 SaaS / 数据中台 / 运营系统。

## 关键令牌

### 品牌与语义色

| 令牌 | 值 | 用途 |
|---|---|---|
| `--hx-brand` | `#2f6df6` | 主色 |
| `--hx-brand-hover` | `#1f5ae0` | 悬停 / 按下 |
| `--hx-brand-soft` | `#e8f0ff` | 浅底强调 |
| `--hx-brand-wash` | `#f5f8ff` | 极浅底 |
| `--hx-brand-on-dark` | `#7fa8ff` | 深底上的主色 |
| `--hx-success` | `#12866e` | 成功 |
| `--hx-warning` | `#c7771f` | 警告 |
| `--hx-danger` | `#d2646a` | 危险 |
| `--hx-info` | `#5a6b85` | 信息 |

Light 共 69 个令牌；Dark 有 23 项覆盖。图表色板顺序固定：`--hx-chart-1` `#2f6df6` → `-2` `#23b794` → `-3` `#f5a33f` → `-4` `#8fa6c6`，网格 `#eef1f6`，对比 `#c9d4e8`。

### 表面 / 文本 / 侧栏

- 页面底 `#f5f7fa`，卡片 `#ffffff`，深色侧栏 `#14243c`（raised `#1e3355`）。
- 主文字 `#1b2537`，正文 `#33415a`，次级 `#7a879b`，弱 `#a6b0c0`。
- 描边 `#e8ecf2`，soft `#eef1f6`。

### 字阶（7 级）

`display 28` / `title 20` / `section 16` / `body 15` / `caption 13` / `micro 11` / `metric 28`（单位 px）。

字体族：`--hx-font-sans: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, -apple-system, sans-serif`。**无需安装 Noto Sans SC**，缺失时自动回退到系统字体，效果一致。数字族 `--hx-font-num` 走 `Geist, Inter, SF Pro Display, system-ui`。标题正文同族。

### 尺寸 / 间距 / 圆角

- 侧栏宽 236px，顶栏高 72px，控件高 44px（大号 48px）。
- 间距：4 / 8 / 12 / 16 / 24 / 32px。
- 圆角：4 / 8 / 12 / 16 / 20 / 999px；映射 `card=16` `panel=12` `control=8` `tag=4`。
- 阴影三档 `sm/md/lg`，动效 `150/200/300ms` + `cubic-bezier(0.4,0,0.2,1)`。

## 组件分层

`layout` → `base` → `biz` → `charts`。类名前缀 `hx-`。图表是 Vue SFC（`HxLineChart` / `HxDonutChart` / `Sparkline`），走纯 SVG 无第三方依赖。数据流：统一响应包装 `{ code, message, data }`，`useRequest` 组合式封装，接 .NET8 两种模式。

## 移动端

- 完整暗色覆盖（23 项），H5 与小程序触发方式不同，不要共用同一段代码。
- rpx/px 双轨换算；安全区两端分别实现。
- 静态预览 CSS 必须与 HTML 同目录，由 `sync-styles.mjs` 生成。

## 资产目录

```text
assets/presets/startech/
├── styles/     tokens / common / components / mobile.css（真源副本）
├── web/        星辰后台端静态预览（HTML + CSS + JS 自包含）
├── mobile/     星辰 H5 移动端静态预览（自包含）
└── miniapp/    星辰原生小程序工程（WXML/WXSS/JS）
```

## 禁忌

- 不要把 `--hx-brand` 换成其他品牌色。
- 不要为了"统一字体"去安装 Noto Sans SC；system-ui 回退已验证。
- 不要在后台内容区加 `max-width` 阅读宽度限制。
