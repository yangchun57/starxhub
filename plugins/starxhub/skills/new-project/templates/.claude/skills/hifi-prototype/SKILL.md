---
name: hifi-prototype
icon: assets/icon.png
display_name: 高保真原型设计
display_name_en: Hi-Fi Prototype Designer
description: 以资深产品设计师视角产出可交互产品原型：单文件 HTML，高保真与线框（wireframe）双模式一键切换，四套内置设计系统（企业中后台/移动App/电商消费/品牌官网暗色）、完整组件库与六态、微交互与转场动效、三档设备自适应、纯 CSS/SVG 零外部依赖。当用户要求高保真原型、视觉稿、Hi-Fi mockup、UI 设计稿、线框图、可点击 Demo、给老板/投资人演示的产品原型，或要把 PRD 变成接近真实产品的界面时使用。
description_zh: 以资深产品设计师视角产出可交互产品原型：单文件 HTML 交付，高保真与线框（黑白灰结构稿）双模式一键切换，内置四套完整设计系统（企业中后台 / 移动 App / 电商消费 / 品牌官网暗色）、完整组件库与六种交互状态、微交互与页面转场动效、桌面/平板/手机三档自适应、纯 CSS 与 SVG 实现零外部依赖、内置设计令牌与组件规范活文档。当用户要求画高保真原型、视觉稿、Hi-Fi mockup、UI 设计稿、线框图、可点击 Demo、给老板或投资人演示的产品原型，或希望把 PRD 与需求描述变成接近真实产品效果的界面时使用。
description_en: Produce interactive product prototypes as a senior product designer. Delivers a single self-contained HTML file with a one-click toggle between high-fidelity and wireframe (grayscale structural) modes, four built-in design systems (enterprise SaaS back-office, mobile app, e-commerce, dark brand/marketing), a complete component library with six interaction states, micro-interactions and page transitions, desktop/tablet/mobile responsiveness, and a zero-dependency pure CSS/SVG asset pipeline. Use when the user asks for a high-fidelity prototype, visual mockup, hi-fi UI design, wireframe, clickable demo, investor-ready product prototype, or wants to turn a PRD into interfaces that look like a real product.
agent_created: true
version: 1.1.0
author: ding
tags:
  - 原型
  - 高保真
  - 线框图
  - wireframe
  - UI设计
  - 设计系统
  - prototype
  - hifi
  - mockup
  - 产品设计
---

# 高保真原型设计（Hi-Fi Prototype）

站在资深产品设计师的立场：**高保真原型的目标是让看的人"以为这就是上线产品"**——真实的内容与数据、完整的视觉层级、可信的微交互。它与低保真线稿（`lofi-prototype`）分工：线稿验证信息架构，本 skill 交付视觉与体验决策。

## 双模式：高保真 ⇄ 线框

同一套页面结构支持两种呈现模式，舞台条「高保真 / 线框」一键切换，也可脚手架时用 `--mode wireframe` 直接以线框起步：

| 模式 | 用途 | 视觉规则 |
|---|---|---|
| `hifi`（默认） | 演示汇报、视觉决策 | 完整主题色彩、阴影、动效 |
| `wireframe` | 评审信息架构与布局、先定结构再上视觉 | 黑白灰令牌覆盖：全组件去色（grayscale）、卡片/统计卡描边化、阴影清零、标签虚线化、`.ph` 占位变斜线纹理+叉线、骨架屏退化灰块 |

实现机制：`.app` 上叠加 `data-mode="wireframe"`，hifi.css 末尾的令牌覆盖块（§10）在同特异性下后声明生效，任一主题都可叠加。**页面结构与交互 API 两种模式完全一致**，切换模式不丢内容——适合「线框评审通过 → 切回高保真继续细化」的工作流。

## 触发条件

出现以下任一意图即启用本 skill：

- 关键词：高保真 / 视觉稿 / Hi-Fi / hifi mockup / UI 设计稿 / 线框图 / wireframe / 可点击 Demo / 演示原型 / 还原设计
- 已有低保真线稿或 PRD，要求「做成高保真」「加上视觉」「做成能给老板看的」
- 要求特定产品形态：中后台、移动 App、商城、官网落地页

若用户明确要**黑白线稿评审流程**，转用 `lofi-prototype`；若两者都要，先线稿后本 skill。

## 参数

| 参数 | 默认 | 说明 |
|---|---|---|
| `--pages` | 由需求推导 | `P1:登录:lock,P2:看板:chart`（图标可省略） |
| `--name` | 产品原型 | 项目名，写入标题与舞台条 |
| `--theme` | `saas` | `saas` / `mobile` / `commerce` / `brand`（可运行时切换，选最贴合产品形态的） |
| `--mode` | `hifi` | `hifi` / `wireframe`；线框评审场景直接以线框起步，舞台条可随时切回 |
| `--out` | `./outputs/<项目名>-hifi/` | 输出目录 |
| `--example` | `off` | 直接以完整参考示例为起点改造 |

主题选择参考 `references/theme-gallery.md` 的决策表。

## 文件索引

```
SKILL.md                      本文件：流程与硬约束
assets/hifi.css               设计系统：4 主题令牌 + 全组件 + 动效 + 容器查询（直接引用，勿改既有令牌）
assets/hifi.js                交互引擎：路由/弹层/校验/图表动效/图标库（直接引用，勿改）
assets/shell.html             最小骨架：复制即开工
assets/example.html           完整参考实现：9 页 + 弹窗/抽屉/面板 + 全组件 + 4 主题演示
references/design-tokens.md   色彩/字体/间距/圆角/阴影令牌表
references/component-spec.md  组件类名与 data-* 交互 API 速查
references/motion-spec.md     动效时长/缓动/清单与使用规则
references/theme-gallery.md   四主题定位、选择决策与扩展方法
references/output-checklist.md 交付自检清单（A–F 六组）
scripts/scaffold.py           一键初始化项目目录
```

## 工作流

### S0 · 需求澄清（信息不足时，一次性收敛，最多 1 轮提问）
用 `AskUserQuestion` 同轮问完：
1. 产品形态与主题（中后台 / App / 商城 / 官网 → 对应主题）
2. 页面范围与核心任务流（1–3 条主线）
3. 品牌色是否指定（指定则按 `theme-gallery.md` 扩展主题块）
4. 演示对象（老板评审 / 投资人 / 研发对齐——影响内容真实度与叙事页）

信息已充分则跳过。

### S1 · 抽取页面清单
编号 `P1…Pn`，产出表格（编号 / 页面名 / 入口 / 关键元素 / 跳转去向）。**P0 固定为流程总览**。填充"真实感"内容：页面里放具体的人名、金额、日期、状态，禁止 lorem ipsum 和"这里是内容"式占位文案。

### S2 · 生成原型
```bash
# <SKILL_DIR> 替换为本 skill 所在目录（即包含 SKILL.md 的那个目录）的绝对路径
python3 "<SKILL_DIR>/scripts/scaffold.py" <输出目录> \
  --name "<项目名>" --theme <主题> --mode <hifi|wireframe> \
  --pages "P1:登录:lock,P2:数据看板:chart,P3:订单管理:gift"
```

若环境无 `python3`，用任意可用的 python 解释器执行同一脚本；脚本自身通过 `__file__` 定位 `assets/`，与当前工作目录无关。
然后逐页填充 `index.html`。组件与 `data-*` API 全部查 `references/component-spec.md`，**禁止自造样式**；确需新组件时在 `hifi.css` 末尾追加并同步组件规范。

### S3 · 挂交互与动效
全部走声明式 `data-*`（见 component-spec §2–§3），不写业务 JS。动效遵循 `references/motion-spec.md`：微交互 ≤180ms、转场 ≤400ms、同屏主动画 ≤1 个。

### S4 · 补真实感细节
- 每页至少一种异常态（空 / 骨架 / 校验错误 / 禁用 / 无权限）
- 指标用 `data-count-to` 数字滚动；关键列表加 `.stagger` 级联；长页加 `.reveal`
- 图片位用 `.ph` 渐变占位 + `data-icon` 表意（零外链）

### S5 · 自检
按 `references/output-checklist.md` A–F 逐项打勾，技术项执行：
```bash
cd <输出目录> && node --check hifi.js
```
并在预览中实测：三档设备切换 + 四主题切换均不破版。

### S6 · 交付
`present_files` 打开 `index.html`，回复附交付说明模板（见下）。

## 硬约束（不可违反）

1. **零外部依赖**：无 CDN、无外链图片、无网络字体；断网双击可看
2. **只用令牌**：颜色/间距/字号/圆角/阴影/动效一律 `var(--…)`；禁止硬编码色值
3. **不写业务 JS**：交互全走 `data-*`；扩展需改 `hifi.js` 并同步 component-spec
4. **不改既有令牌与组件**：新增在 `hifi.css` 末尾追加，并同步 references
5. **页面必须可点通**：每个 `data-goto` 有落点、每个按钮有反馈；每页 `data-pid` + `data-title`
6. **内容真实感**：具体数据、中文名称、合理日期；界面文字全部简体中文
7. **动效克制**：遵循 motion-spec 的时长与数量上限；破坏性确认弹窗禁用弹性曲线
8. **输出为单目录**（`index.html + hifi.css + hifi.js`），三档设备与四主题切换不破版

## 交付说明模板（回复中必须包含）

```markdown
## 高保真原型交付说明

**产出**：`<路径>/index.html`（N 个页面，桌面/平板/手机三档自适应，4 套主题实时切换）

### 页面清单
| 编号 | 页面 | 亮点 |
|---|---|---|
| P0 | 流程总览 | … |

### 设计系统
- 主题：saas（企业中后台）——主色、圆角、密度一句话理由
- 组件：…（本原型用到的主要组件）

### 交互与动效
- 主流程：…（点哪、弹什么、什么反馈）
- 动效亮点：数字滚动 / 级联入场 / 弹窗转场 …

### 操作提示
- 顶部舞台条：切设备（桌面/平板/手机）与主题（4 套对比评审）
- P7 为组件规范活文档

### 待确认项
1. …
```

## 常见坑

- **弹层定位**：`.modal/.drawer/.sheet` 用 `position: fixed`，因为 `.app` 有容器查询 containment，fixed 相对 `.app` 而非浏览器窗口——这是预期行为，遮罩由引擎自动创建，**不要手写遮罩**
- **侧栏激活态**：`.nav-item.is-active` 的 `data-goto` 必须等于所在页面 id，否则指示错位
- **`.field-msg` 要预留**：校验错误写入 `.field-msg`，忘写该元素错误会退化为 Toast
- **fixed 内的 sticky**：`.topbar/.tabbar` 用 sticky（相对 `.page` 滚动容器），不要改成 fixed
- **主题切换后指示器**：引擎会自动重建 Tab/分段指示器，无需手动处理；但自定义 JS 操作几何位置时注意主题切换会触发重排
- **手机档别写死宽度**：布局降级全靠容器查询（断点 1024/720），媒体查询对舞台缩放无效
- **图标大小**：`data-icon` 继承字号，调大小用 `ico-sm/ico-lg/ico-xl` 或父级字号，不要写 svg width
