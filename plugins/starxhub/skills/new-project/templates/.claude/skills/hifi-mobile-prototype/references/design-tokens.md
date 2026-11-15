# 设计令牌与视觉基线

供 `hifi-mobile-prototype` 使用。令牌以 CSS 变量三件套形式定义：主值 + `-soft`（浅底）+ `-line`（描边）。

## 字体栈

```css
--font-cn: "PingFang SC", "HarmonyOS Sans SC", "Source Han Sans SC", "Noto Sans SC",
           "Microsoft YaHei UI", "Microsoft YaHei", sans-serif;
--font-num: "Bahnschrift", "DIN Alternate", "Segoe UI Variable Display", "PingFang SC", sans-serif;
```

- 中文正文用 `--font-cn`；**数字、金额、时间、编号一律用 `--font-num`**（DIN 系等宽感强，表格与统计数值对齐后才好看）。
- 不用 Inter / Roboto / Arial 这类通用字体做正文。
- 手机屏内正文基准 `1.2 ~ 1.3rem`（= 12 ~ 13 设计 px），标题 `1.45 ~ 1.72rem`，行高 `1.5 ~ 1.7`。

## 语义色（人保红体系示例，可按品牌替换主色）

| 语义 | 主值 | soft | line | 用途 |
|---|---|---|---|---|
| 主色 · 核心动作 | `#C8201A` | `#FDECE9` | `#F3C1BA` | **只给唯一核心动作**（推送 / 发送 / 提交） |
| 主色浅阶 | `#E4523F` / `#F0705A` | — | — | 渐变、图标底色 |
| 金 · 高优先 / 临期 | `#C99433` | `#FFF8EC` | `#F0C778` | 临期徽标、优先级 |
| 绿 · 通过 | `#12885C` | `#EAF8F2` | `#BFE6D6` | 核保通过、已完成 |
| 蓝 · 进行中 | `#2A66D0` | `#E9F1FB` | `#C9DCF5` | 处理中、链接 |
| 紫罗兰 · AI 生成 | `#6A56A6` | `#F1ECFD` | `#DCCFF8` | AI 识别、自动生成内容 |
| 琥珀 · 提醒 | `#B26A12` | `#FDF3E1` | `#F2DCB2` | 温馨提示、需注意 |

墨色（**不用纯黑**）：`--ink: #241F1C` / `--ink-2: #5C534B` / `--ink-3: #8F857C`。

## 背景纵深（不可省）

纯白或纯灰平铺会让整页显得像未完成。至少叠一层渐变，再叠一层噪点：

```css
body {
  background:
    radial-gradient(50% 34% at 6% 0%,  rgba(228, 82, 63, .16) 0%, rgba(228,82,63,0) 62%),
    radial-gradient(42% 30% at 96% 4%, rgba(31, 156, 124, .15) 0%, rgba(31,156,124,0) 60%),
    linear-gradient(172deg, #FDF8F3 0%, #F7F0E8 52%, #F3E9DF 100%);
  background-attachment: fixed;
}
/* 噪点：内联 SVG feTurbulence，避免额外请求 */
body::before {
  content: ""; position: fixed; inset: 0; pointer-events: none; opacity: .05; z-index: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

注意 `%` 在 data URI 里要写成 `%25`。

## 共享样式底座的组织方式

每个模块目录一个 `*-shared.css`，内含：`:root` 令牌 → 状态栏 `html{font-size:28.8px}` → 根容器 `.screen{width:1080px;height:1920px}` → 该模块的组件。

新模块要复用既有观感时，**用 `<link>` 引既有共享 CSS + 自建补充 CSS**，不要复制一份令牌——复制会立刻产生两套会漂移的色值。反之，若模块需要独立演进，则自带一份令牌并注明来源。

## 状态栏（真机感的关键细节）

高保真屏必须有状态栏：左时间，右依次为图标组、信号制式（如 5G）、电量。红底头区用白色文字：

```css
.sbar { position: relative; z-index: 3; color: #FFF9F4;
        height: 2.4rem; padding: 0 1.5rem 0 1.9rem;
        display: flex; align-items: center; justify-content: space-between;
        font-family: var(--font-num); font-size: 1.28rem; }
```

红底头区若用 `linear-gradient`，再叠一层半透明径向高光与斜向扫光，避免大色块发闷：

```css
.rdhead { background: linear-gradient(146deg, #EC6D52 0%, #E2503A 46%, #DA3B27 100%); position: relative; }
.rdhead::before { content:""; position:absolute; inset:0;
  background: radial-gradient(58% 78% at 10% -16%, rgba(255,226,190,.42) 0%, rgba(255,226,190,0) 62%); }
.rdhead::after  { content:""; position:absolute; inset:-40% -30% 20% 32%;
  background: linear-gradient(98deg, rgba(255,255,255,0) 36%, rgba(255,232,190,.24) 50%, rgba(255,255,255,0) 64%);
  transform: rotate(-9deg); }
.rdhead > * { position: relative; z-index: 2; }   /* 让子元素自动获得正确层级 */
```

`'> *'` 这条很省事：头区里后续新增任何块（副标题等）都会自动拿到正确层级，不必逐个加 `z-index`。
