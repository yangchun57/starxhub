# 动效规范（motion-spec）

高保真原型动效三原则：**有目的（反馈/引导/解释层级）、有节奏（时长成体系）、可关闭（尊重系统减弱动态设置）**。

## 1. 时长令牌

| 令牌 | 值 | 适用场景 |
|---|---|---|
| `--dur-1` | 120ms | 按压缩放、颜色/边框悬停、焦点环 |
| `--dur-2` | 180ms | 主题色过渡、开关滑块、Tooltip、菜单淡入 |
| `--dur-3` | 260ms | 页面转场、弹窗缩放、Tab 面板切换、涟漪扩散 |
| `--dur-4` | 380ms | 抽屉滑入、Sheet 上滑、进度条生长、卡片悬浮 |
| `--dur-5` | 600ms | 环形图描边、大数值缓动收尾 |

经验法则：**越小越快**——小控件 ≤180ms，容器级 ≤400ms；入场比出场略慢。

## 2. 缓动令牌

| 令牌 | 曲线 | 用途 |
|---|---|---|
| `--ease-out` | cubic-bezier(.22,.8,.28,1) | 默认。入场、位移、淡入（快出缓停） |
| `--ease-in-out` | cubic-bezier(.4,0,.2,1) | 位移往返、shimmer |
| `--ease-spring` | cubic-bezier(.34,1.36,.44,1) | 弹性感：Tab 指示器、开关滑块、弹窗缩放、页面指示器 |
| `linear` | 线性 | 旋转、跑马灯 |

规则：入场用 `ease-out` 系；**弹性曲线不得用于旋转/颜色**，只用于位移与缩放。

## 3. 内置动效清单

| 动效 | 触发方式 | 实现位置 |
|---|---|---|
| 页面转场（淡入+上移 10px） | `data-goto` | `.page.is-active` |
| 弹窗缩放淡入（0.96→1） | `data-modal-open` | `.modal.open` |
| 抽屉/面板滑入 | `data-drawer-open` / `data-sheet-open` | `.drawer.open` / `.sheet.open` |
| 按钮涟漪 | 按下（pointerdown 自动） | `.ripple` |
| 按压缩放 0.972 | 按下自动 | `.btn:active` |
| 卡片悬浮抬升 -3px + 阴影 | hover | `.card-hover` / `.hover-lift` |
| Tab 指示器弹性滑动 | `[data-tabs]` 自动 | `.tab-indicator` |
| 分段滑块滑动 | `[data-seg]` 自动 | `.seg-thumb` |
| 数字滚动（ease-out cubic） | `data-count-to` | 引擎 rAF |
| 进度条生长 | 进入视口 `data-progress` | `.progress-bar` |
| 柱状图自底生长 | 页面激活 | `.chart-bar .bar` |
| 骨架 shimmer | 常驻 | `.skeleton::after` |
| 列表级联入场（40ms 间隔） | `.stagger` 父类 | 子元素 `fade-up` |
| 滚动显现（上移 18px→0） | `.reveal` + 进入视口 | IntersectionObserver |
| Toast 弹入/弹出 | `data-toast` | `.toast(.out)` |
| 心跳收藏放大 1.12 | `data-fav` hover/点击 | `.m-fav` |
| 悬浮按钮上浮 | hover | `.fab` |
| 跑马灯 | `.ticker-track` | 22s linear |
| 呼吸点 | `.pulse-dot` | 2s 循环 |

## 4. 使用规则（硬约束）

1. **一个页面同时进行的主动画 ≤1 个**；列表级联 ≤8 项，更多直接显示
2. 微交互（hover/按压）≤180ms；转场 ≤400ms；超过 600ms 的动画只允许出现在数据可视化收尾
3. 全部动效必须走 `--dur-*` / `--ease-*` 令牌，禁止裸写 `0.3s`
4. `prefers-reduced-motion: reduce` 已全局降级，无需为单个组件单独处理；但不要给核心信息（错误提示）只配动画不配静态样式
5. 破坏性操作（删除）的确认弹窗用 `--ease-out`（庄重），禁用弹性曲线
6. 数字滚动只用于"由 0 到值"的指标呈现，表格内数字禁止滚动
