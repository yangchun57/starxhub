# 组件与交互规范（component-spec）

组件类名与 `data-*` 交互 API 速查。所有交互由 `hifi.js` 声明式驱动，**不写业务 JS**。完整可运行示例见 `assets/example.html`（P7 组件规范页）。

## 1. 页面骨架

```html
<div class="stage" data-device="desktop">      <!-- 舞台：desktop|tablet|mobile -->
  <div class="stage-bar">…设备切换 + 主题点 + .stage-page 指示器…</div>
  <div class="stage-body"><div class="stage-frame">
    <div class="app" data-theme="saas">        <!-- 主题挂在 .app 上 -->
      <section class="page is-active" id="p1" data-pid="P1" data-title="登录">…</section>
      <section class="page" id="p2" data-pid="P2" data-title="看板">…</section>
    </div>
  </div></div>
</div>
```

- 每个 `<section class="page">` 必须有唯一 `id` + `data-pid` + `data-title`（舞台指示器依赖）
- 工作台页内骨架：`.shell` > `.sidebar` + `.main`(`.topbar` + `.content`)
- 登录/官网/移动页可省略 `.shell`，直接在 `.page` 下布局

## 2. 路由与导航

| 交互 | 写法 |
|---|---|
| 跳转页面 | `data-goto="p2"`（任意元素可挂，卡片加 `.card-click`） |
| 返回上一页 | `data-back` |
| 侧栏抽屉（移动端） | `data-sidebar-toggle`；`.sidebar` 在 ≤720px 容器宽度自动变抽屉 |
| 面包屑 | `.crumb > a + span.sep + span.cur` |
| 步骤条 | `.steps > .step(.done/.current) > .pt + .st-name` |
| 分页 | `.pagination > .page-btn(.is-on/[disabled])` |

## 3. 弹层（全部自带转场动效与遮罩）

| 类型 | 打开 | 关闭 |
|---|---|---|
| 居中弹窗 `.modal`（+`-sm/-lg`） | `data-modal-open="#id"` | `data-close` / Esc / 点遮罩 |
| 右侧抽屉 `.drawer.drawer-right`（或 `-left`） | `data-drawer-open="#id"` | 同上 |
| 底部面板 `.sheet`（移动端习惯） | `data-sheet-open="#id"` | 同上 |
| 下拉菜单 `.menu`（自动定位） | `data-menu-open="#id"` | 点外部 / Esc |
| 轻提示 | `data-toast="文案"` + `data-toast-type="success\|error\|warn"` | 自动 2.3s |

弹窗结构：`.modal-hd`（标题+关闭）→ `.modal-bd`（内容，可滚动）→ `.modal-ft`（按钮）。菜单项：`.menu-item`（`.danger` 为红色），分隔用 `.menu-divider`。

## 4. 按钮

```html
<button class="btn btn-primary">主要</button>   <!-- 变体：btn-gradient / btn-secondary /
     btn-ghost / btn-danger / btn-danger-ghost / btn-link -->
<button class="btn btn-primary btn-lg btn-block" data-loading="1200" data-loading-done="完成">登录</button>
<button class="btn btn-secondary btn-icon" data-icon="plus"></button>
```

- 尺寸：`btn-sm`(28) / 默认(34) / `btn-lg`(40) / `btn-xl`(48)；图标按钮 `btn-icon`
- 加载：`data-loading="毫秒"` 进入转圈态，结束自动恢复并弹 `data-loading-done` 提示
- 自带：涟漪反馈、按压缩放、`:focus-visible` 焦点环、`[disabled]` 禁用态

## 5. 表单

```html
<form data-validate data-success-toast="提交成功">
  <div class="field">
    <label class="field-label">手机号<span class="req">*</span></label>
    <div class="input-icon"><span class="lead" data-icon="phone"></span>
      <input class="input" data-required data-type="phone" data-msg="请输入正确的手机号"></div>
    <span class="field-hint">辅助说明</span>
    <span class="field-msg"></span>   <!-- 错误信息由引擎写入 -->
  </div>
</form>
```

校验规则（挂在 input/textarea/select 上）：`data-required`、`data-type="email|phone|number|idcard"`、`data-min`/`data-max`（长度）、`data-pattern`（正则）、`data-eq="#other"`（两次一致）、`data-msg`（自定义错误）。提交时逐项校验、自动滚动到首个错误、输入时即时消错。

其他控件：`.select-wrap > select.select`、`.check`（多选）/`.check.radio`（单选）、`.switch`（开关，`-sm`）、`input.slider`、`.stepper`（数字步进）。

## 6. 数据展示

| 组件 | 关键类 / 写法 |
|---|---|
| 指标卡 | `.stat > .stat-label + .stat-value(.num)[data-count-to] + .stat-delta.up/.down` |
| 数字滚动 | `data-count-to="1280" data-prefix="¥" data-suffix="+" data-decimals="1"` |
| 柱状图 | `.chart-bars > .chart-bar(.is-max) > .bv + .bar(style=height:%) + .bl` |
| 环形图 | `.donut-wrap > svg.donut-track(circle.tr + circle.seg1, stroke-dasharray 偏移) + .donut-center` |
| 折线/面积 | `svg.sparkline > path.area + polyline.line + circle.dot` |
| 进度条 | `.progress(.progress-thin/-lg) > .progress-bar[data-progress=72]`（进入视口自动生长） |
| 排行榜 | `.list-item` 内嵌 `.progress.progress-thin` |
| 时间线 | `.timeline > .tl-item(.done) > .tl-time + .tl-title + .tl-desc` |
| 键值对 | `dl.kv > dt + dd` |
| 评分 | `.rating > span[data-icon=star](.is-off) + .rv` |
| 倒计时 | `.countdown(.hot)[data-countdown="秒"] > .cd-h/.cd-m/.cd-s` |
| 骨架屏 | `.skeleton.sk-line/.sk-title/.sk-avatar/.sk-img/.sk-block`；演示 `data-skeleton="#target"` |

## 7. 容器与列表

- 卡片：`.card > .card-hd + .card-bd + .card-ft`；悬浮 `.card-hover`、可点 `.card-click`
- 指标/图标块：`.stat-icon`（38px 圆角底）
- 列表：`.list > .list-item > .li-main(.li-title/.li-desc) + .li-meta`
- 移动单元格：`.cell-group > .cell > .cell-main + .cell-value + .cell-arrow`
- 头像：`.avatar(-sm/-lg/-xl)`，双色渐变 `style="--a1:#..;--a2:#.."` 显示首字；`.avatar-group` 组合；`.vip-mark` 角标
- 商品卡：`.product-card > .product-media(.m-tag/.m-fav[data-fav]/.ph) + .product-info`
- 价格：`.price(-sm/-lg/-xl)`（自动加 ¥ 前缀）+ `.price-old` 划线价 + `.sold`
- 优惠券：`.coupon > .coupon-left(cv/cl) + .coupon-right`（自动打孔）
- 徽标：`.tag(+语义变体/.tag-lg/.tag-outline)`、`.badge(.badge-num/.badge-dot)`

## 8. 布局工具

`.stack/-sm/-lg`（纵向 flex）、`.row / .row-between / .row-wrap`、`.grid`（12 栏 + `.col-3/4/6/8/9/12`，容器查询自动降级 `.col-lg-*` `.col-sm-*`）、`.spacer`（占满剩余）、`.divider`、`.center`、文本类 `.h1~.h4/.title/.body/.sub/.xs/.xxl/.num/.muted/.strong/.ellipsis/.clamp-2/.gradient-text`。

## 9. 反馈与空态

- 警告条：`.alert.alert-info/success/warning/danger > .a-ic + (.a-title + .a-body)`
- 空状态：`.empty > svg.empty-illus + .empty-title + .empty-desc + 操作按钮`（插画用 `var(--illus-*)` 内联 SVG）
- 加载：`.spinner(-lg)`、`.spinner-center`（局部遮罩）
- Tooltip：`.tooltip-host > 按钮 + span.tooltip`

## 10. 图片替代（零外部依赖）

```html
<div class="ph" style="height:160px"><span class="ph-label">图片占位说明</span></div>
<div class="ph ph-brand" style="height:120px"></div>   <!-- 品牌渐变版 -->
```

点阵纹理 + 双 radial 渐变自动生成，随主题换色。所有"图片"位用 `.ph` + `data-icon` 表意，不引用任何外链。

## 11. 内置图标（data-icon）

home search bell user users settings menu x plus minus check check-circle x-circle info alert-triangle edit trash download upload filter calendar clock mail phone star heart cart tag map-pin credit-card chart bar-chart grid list layers box folder file image play share link lock eye eye-off refresh more-h more-v arrow-left/right/up/down chevron-left/right/down/up trending-up/down gift ticket zap truck sliders log-out message thumbs-up bookmark wallet sparkles target shield headphones send scan moon

写法：`<span data-icon="名称"></span>`；尺寸 `ico-sm`(14)/默认(16)/`ico-lg`(22)/`ico-xl`(28)。未知名回退为 info 图标。
