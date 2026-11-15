---
name: hifi-mobile-prototype
display_name: 高保真移动端原型
display_name_en: High-Fidelity Mobile Prototype
description: 制作交付级高保真移动端原型（375 设计宽 / 输出 1080×1920）。当需要产出「手机效果图」、把多个已有页面聚合成可点可切的原型、或要求「界面与真实移动端一致、可供评审」时使用。含 rem 基准口径、iframe 隔离策略、语义色令牌、Chrome 无头出图与 PNG 尺寸校验。
description_zh: 按 375 设计宽制作 1080×1920 高保真移动端原型：rem 基准口径、iframe 隔离、共用模块页多视图、语义色令牌，以及无头出图与 PNG 尺寸校验。
description_en: Build high-fidelity 1080x1920 mobile prototypes from a 375-px design baseline, covering rem sizing rules, iframe isolation, shared module pages with multiple views, semantic color tokens, and headless screenshot validation.
category: 开发工具
version: 1.0.0
author: 人保财险客户体验处
agent_created: true
---

# 高保真移动端原型（1080 × 1920）

## 何时使用

- 需要给业务方或领导评审的移动端界面原型——不是需求草图，而是「看起来就是真机」的成品。
- 需要把多个已完成的页面聚合成一个可点、可切换、可滚动的原型。
- 需要批量输出「效果图」，用于文档、幻灯片或归档。

## 一、尺寸与 rem 口径（最易错，先定死）

| 项 | 值 | 说明 |
|---|---|---|
| 设计基准宽 | 375 CSS px（9:16 直板手机） | 所有尺寸以设计 px 计 |
| rem 换算 | `1rem = 10 设计 px` | 写 `2.4rem` 即 24 设计 px |
| 模块页根字号 | `html { font-size: 28.8px }` | 2.88 倍，输出即 1080 宽 |
| 输出规格 | 1080 × 1920 px | 9:16 满屏 |

**硬规则：一切尺寸用 `rem`。** 写成 `px` 会以 1/2.88 渲染，并压扁行高与图标——这类错误在截图上很不容易看出来。

**外层评审 UI 与手机屏不能共用 rem 基准。** 外层用 `html { font-size: 16px }`，手机屏内部由模块页自带的 28.8px 生效；二者必须物理隔离在不同文档（iframe）里。若同处一个文档，外层标题会被放大 2.88 倍。

## 二、多模块隔离：一律 iframe

不要把多个模块页的 CSS 合并进一个文档。实测跨模块类名冲突可达 20 个以上，合并必然互相污染。

- 每个模块页保持独立 `<html>`，自带 `:root` 令牌与根容器（如 `.screen`）。
- 父页用 iframe 内嵌，iframe 尺寸给足模块页的真实视口（如 `width:1080px; height:1920px`），再用 `transform: scale()` 缩到外框。
- 手机外框按 9:16 设为 `375 × 666.67`，`overflow: hidden`；iframe `transform-origin: 0 0`。
- 缩放比从**实际容器宽**算，不要写死：`scale = 外框.clientWidth / 1080`。
- 内嵌后的自适应高度与超屏内滚动，见 skill `scaled-iframe-fit`。

## 三、共用模块页承载多视图

同一模块页被多个一级入口复用时（例如「概览 / 台账 / 进展」三入口共用一个模块页）：

- iframe **加载完成后改 `src` 的 hash 不会触发重渲染**。
- 模块页须暴露 `window.__x = { setView: fn }`；父页区分「首次 → 设 `data-src`」与「再次 → 跨文档调 `setView(hash)`」。
- 父页的「重置」也走 `setView`，不必重载 iframe。

## 四、配色与视觉基线

完整令牌见 `references/design-tokens.md`。三条不可破：

1. **不用纯白或纯灰平铺背景**，必须有纵深（径向渐变 + 噪点纹理）。
2. **主色只留给唯一核心动作**（例如人保红 `#C8201A` 只给「推送 / 发送」），其余状态交给语义色。
3. 语义色不可混用：紫罗兰 = AI 生成、蓝 = 进行中、金 = 高优先或临期、绿 = 通过、琥珀 = 提醒。

## 五、出图与校验

用 `scripts/shoot.js`：Chrome 无头截图 + 读 PNG IHDR 校验尺寸。

```
node scripts/shoot.js <页面路径> <输出.png> [宽=1080] [高=1920] [虚拟时间预算=4000]
```

要点：

- CJK 路径必须 URL 编码，否则 Chrome 打不开文件。
- `--force-device-scale-factor=1` 防止系统缩放干扰输出尺寸。
- `--allow-file-access-from-files` 让父页能跨文档读取 iframe 内容（量高、缩放都要用）。
- `--hide-scrollbars` 避免滚动条入图。

**出图后必须校验尺寸。** 只截图不校验，会在尺寸不对时静默产出废图。

### 若 Chrome 起不来

报 `spawnSync ... chrome.exe EBUSY` 或 `Failed to open named pipe server ... 拒绝访问` 时，按序处理：

1. 结束残留的 Chrome 进程（已有实例会锁住可执行文件与 profile）。
2. 加 `--user-data-dir=<全新临时目录>`，绕开被锁的默认 profile。
3. 用环境变量 `CHROME_PATH` 指向另一个 Chromium 内核浏览器（Edge 等）。
4. 以上都无效则说明当前沙箱禁止启动 Chrome——此时**不要改用「目测」代替出图校验**，如实报告「出图未验证」，并说明验证缺口。

## 六、交付前自查

- [ ] 所有尺寸是 `rem`，没有残留 `px`
- [ ] 手机外框是 9:16（375 × 666.67 或等比），无纵向留白
- [ ] 每个模块页可独立打开（`file://` 直开，不依赖父页）
- [ ] 出图 1080 × 1920，逐张目视确认无裁切、无死区
- [ ] 文字、图标、按钮层级未被压扁（对照设计稿看行高）
- [ ] 点击区域 ≥ 44 × 44 px 等效
- [ ] 尊重 `prefers-reduced-motion`

## 相关 skill

- `scaled-iframe-fit` —— 内嵌后的自适应高度与超屏滚动
- `static-publish-preflight` —— 做完后发布为在线链接
