# 星辰踩坑清单（Verified Fixes）

> 每条都来自星辰规范落地的真实回归。宣称"完成"前逐项核对。

## 字体 / 视觉

1. **改令牌 ≠ 统一字体**。必须同时清三处：令牌值、所有 `var(--hx-font-serif)` 引用、设计画布 TEXT 节点的字体名。曾遗留约 30 处 serif 引用 + 41 个 Noto Serif SC 节点。
2. 数字令牌曾写裸 `serif` 兜底，Georgia/TNR 无中文字形，含中文的数字元素回退宋体。正确：`Georgia, "Times New Roman", var(--hx-font-sans)`。
3. 实例页曾写"宋体标题"标签，是"感觉还有宋体"的直接来源——**文案也要一起清**。
4. 后台主体曾因 `max-width:1600px` 在 2560 宽屏右侧留白 1/3。后台内容区必须铺满 `width:100%`。
5. 图标不要加背景块。快捷入口图标曾带浅色底 + 圆角，去掉后把 SVG 从 20px 放大到 26px 维持视觉分量更清爽。

## 图表

6. **`preserveAspectRatio="none"` 是变形元凶**，不是解决方法。它把柱子拉宽、圆点变椭圆、文字变形。删除后恢复默认等比。
7. 图表字体过大根因：坐标轴 `<text>` 在 SVG viewBox 内是 10px 单位，随面板宽度放大到 24px。治本是把轴文字抽到 HTML 层固定 12px，SVG 只留图形。
8. Ardot 画布里 SVG `<text>` 中的数字串（如「78%」）会被拆成竖排单字符。改法：纯图形 SVG + 原生 text 节点叠加（`layout:none` 绝对定位 + 居中对齐）。
9. 轴标签 `bottom:-20px` 落在容器外，元素特写截图看不到，但真实页面可见且无重叠——不是缺陷，勿误修。
10. 图表 X 轴看似不可见，实为容器外 8px，真实页面正常，不要误判重叠去改。

## 交互 / 组件

11. 下拉 trigger 的 Enter 曾只做 close/open，导致方向键高亮后按 Enter 不选中。修为"展开且有高亮项则 pick，否则 close"。
12. Playwright hover 后立刻读 computedStyle 会因 150ms transition 返回初始值，需 wait ≥150ms 再读，否则误判 hover 未生效。
13. 实例页满宽曾靠逐卡片内联 `grid-column:1/-1`，标准漂移。收敛为语义类 `.pc-item--wide`，宽内容独占一行、小控件两两成对，0 落单。
14. 下拉箭头曾用 14px 文本 `⌄`，单薄。改为 28×28 圆角按钮区 + SVG chevron + 左侧分隔线，展开态品牌色底白箭头朝上，触控 36×36。
15. 组件实例页的下拉曾是纯静态摆设：`position:fixed` 面板裸塞 DOM、无 left/top 定位，点击无反应。必须实现点击弹出 + 定位 + 回填 + 键盘导航 + 点击外部/Esc 关闭（对齐真实 `HxSelect.vue`）。
16. 布局示例曾与真实 `app.js` 骨架漂移：顶栏全宽在上 + 侧栏在下平级、手写 `width:200px`、用 `✦` 字符代替品牌蓝 SVG、代码块写虚构 `.hx-body`。真实骨架是 `.hx-app > .hx-sidebar + .hx-main(.hx-topbar + .hx-content)`，颜色全走令牌。`check-layout.mjs` 已固化此校验。

## 三端打通

17. 样式层顺序错误会污染 H5 原生下拉：组件库必须在 common 之后、端样式之前引入。
18. 计算样式零回归验证法：改动前后同脚本采集 computedStyle 存 JSON，diff 比对。
19. 三端"看起来共用"不等于真共用：检查每个端的 HTML 是否都引入了 components.css；只引入 tokens/common 不算共用组件库。

## 工程 / 工具链

20. 微信小程序 wxss 的 `@import` 需要 `.wxss` 后缀副本，不能直接用 `.css`。令牌副本由 `sync-tokens.mjs` 单向生成，禁止手改。
21. Ardot 画布不支持 `marginTop`/`marginBottom`（静默忽略），用父级 `gap`；flex 父级下子节点 x/y 被忽略；顶层画板高度用 `hug_contents` 自适应。
22. Chrome headless 用 `file://` 带 `#锚点` 会截到空白（渲染未完成），改用超高 window-size 截全图。
23. 静态预览服务禁止跨上级目录取资源（403）。CSS 要在预览目录放同目录副本，由 `sync-styles.mjs` 从真源复制；改完令牌记得跑同步。
24. 从工程复制到 skill 包的脚本若用相对脚本路径定位，会报 ENOENT。脚本应相对 skill 目录解析（`fileURLToPath(import.meta.url)`），并支持传入目标工程根目录。
25. `cp` 复制 showcase 目录时若只拷 `*.html *.js`，CSS 会断开引用。整目录复制（`cp -r`）才能保持自包含。
26. 判断"示例是否与真实页面一致"必须与渲染入口（`app.js` 的 `sidebar()/topbar()/render()`）比对，而非只看 `index.html` 空壳；颜色一律靠令牌，手写 width / 色值会造成视觉漂移。

## 通用排查顺序

出现"样式不对"时按此顺序查，别跳步：

1. 令牌是不是被硬编码覆盖了？→ 查色值字面量
2. 四层顺序对不对？端样式是否最后？→ 查 import 顺序
3. 是不是端样式裸覆盖了全局类？→ 查作用域前缀
4. 字体是不是 serif 残留？→ 全局搜 `serif` / `宋体` / `SimSun`
5. 图表是不是 `preserveAspectRatio` 或轴标签在 SVG 内？→ 查 SVG
6. 静态页 CSS 是不是没同步？→ 跑同步脚本
7. 以上都排除后，再 diff computedStyle 找具体属性
