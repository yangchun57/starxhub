# 设计令牌参考（design-tokens）

所有令牌以 CSS 自定义属性定义在 `assets/hifi.css` 的主题块中，通过 `.app[data-theme="…"]` 切换。**禁止硬编码颜色/字号/阴影，一律引用变量。**

## 1. 四套主题速览

| 令牌 | saas（中后台·默认） | mobile（移动 App） | commerce（电商） | brand（官网·暗色） |
|---|---|---|---|---|
| 主色 `--brand-500` | `#3d5afe` 靛蓝 | `#00b578` 翡翠绿 | `#ff4d4f` 活力红 | `#7c6cf5` 星紫 |
| 渐变 `--grad-brand` | 蓝→紫 | 绿→青 | 红→橙 | 紫→青 |
| 背景 `--bg` | `#f4f6fb` | `#f5f6f8` | `#f7f5f3` | `#0a0c14` |
| 卡片 `--surface` | `#ffffff` | `#ffffff` | `#ffffff` | `#12151f` |
| 标题 `--text-1` | `#141b2e` | `#10161f` | `#241a16` | `#f2f4ff` |
| 圆角 `--radius-md/lg` | 8 / 12 | 14 / 20 | 12 / 16 | 14 / 20 |
| 页边距 `--gutter` | 24 | 16 | 16 | 32 |
| 阴影风格 | 极轻、专业 | 柔和、悬浮 | 暖色、促销 | 深色、发光 |

## 2. 颜色令牌结构

每个主题提供完整色阶与语义色，命名规则：

- **品牌色阶**：`--brand-25`（最浅底）→ `--brand-50`（浅底/选中底）→ `--brand-100`/`--brand-200`（边框/装饰）→ `--brand-300`/`--brand-400`（悬停）→ `--brand-500`（主色）→ `--brand-600`（悬停主色/深色文字）→ `--brand-700~900`（按压/深底）
- **中性色**：`--bg`（页面底）、`--bg-subtle`（分区底）、`--surface/2/3`（卡片三级）、`--surface-inset`（内嵌区）、`--border`/`--border-strong`（边框两级）、`--divider`（分割线）
- **文字四级**：`--text-1` 标题 → `--text-2` 正文 → `--text-3` 辅助 → `--text-4` 禁用/占位；`--text-inverse` 反白
- **语义色**（各带 `-bg` 淡底与 `-border` 边框）：`--success` / `--warning` / `--danger` / `--info`
- **其他**：`--on-brand`（主色上的文字）、`--accent`（辅助强调色，mobile/commerce/brand 提供）、`--mask`（遮罩）、`--glass`（毛玻璃底）、`--illus-1/2/3`（插画三色）

## 3. 字体

```css
--font-sans: -apple-system, …, "PingFang SC", "Microsoft YaHei"   /* 正文 */
--font-display: "SF Pro Display", …                               /* 大标题 */
--font-num: "SF Pro Display", "DIN Alternate"                     /* 数字（配 .num 等宽） */
--font-mono                                                       /* 代码 */
```

## 4. 字号阶梯

| 令牌 | 值 | 用途 |
|---|---|---|
| `--fs-2xs / xs` | 11 / 12 | 角标、辅助说明 |
| `--fs-sm / base` | 13 / 14 | 正文、表格 |
| `--fs-md / lg` | 15 / 17 | 卡片标题、导语 |
| `--fs-xl / 2xl` | 20 / 24 | 区块/页面标题 |
| `--fs-3xl` | 30 | H1 展示标题 |
| `--fs-4xl~6xl` | 38 / 48 / 60 | Hero 大标题（brand 主题） |

字重：`--fw-regular 400` / `--fw-medium 500` / `--fw-semibold 600` / `--fw-bold 700`。
行高：`--lh-tight 1.2`（标题）/ `--lh-snug 1.4` / `--lh-normal 1.6`（正文）/ `--lh-loose 1.8`（导语）。

## 5. 间距 / 控件高度 / 圆角

- 间距：4pt 栅格 `--sp-1`(4) → `--sp-12`(80)。常用：卡片内边距 `--sp-4`(16)、区块间距 `--sp-6`(24)、分区间距 `--sp-11`(64)
- 控件高度：`--h-xs 24` / `--h-sm 28` / `--h-md 34` / `--h-lg 40` / `--h-xl 48`（移动档整体偏大）
- 圆角：`--radius-xs`（标签/勾选框）→ `--radius-sm`（小按钮）→ `--radius-md`（按钮/输入框）→ `--radius-lg`（卡片）→ `--radius-xl`（弹窗/大卡）→ `--radius-full`（全圆）

## 6. 阴影（海拔层级）

| 令牌 | 用途 |
|---|---|
| `--shadow-1` | 静态卡片默认 |
| `--shadow-2` | 悬浮元素、开关滑块 |
| `--shadow-3` | 悬停抬升、下拉菜单 |
| `--shadow-4` | 弹窗、抽屉 |
| `--shadow-brand` | 主色按钮的品牌色投影（制造"发光"质感） |

规则：**同屏海拔不超过 3 级**；悬停用 `transform: translateY(-3px)` + `--shadow-3` 组合。

## 7. 使用规则（硬约束）

1. 颜色只允许 `var(--…)` 或 `color-mix(in srgb, var(--…), transparent)` 透明度变体
2. 间距只取 `--sp-*`；控件高度只取 `--h-*`；圆角只取 `--radius-*`
3. 一屏主色占比 ≤10%，大面积用 `--bg/--surface`，强调交给 `--brand-500` 与语义色
4. 状态色语义固定：绿=成功、黄=警告、红=危险/错误、蓝=信息，不得混用
