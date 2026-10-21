# 主题画廊（theme-gallery）

四套内置设计系统，通过舞台条主题点或 `.app[data-theme="…"]` 实时切换。**一套原型可以在不同页面演示不同主题**（切换是全局的，用于对比评审）。

## 选择决策

| 用户的产品 | 主题 | 理由 |
|---|---|---|
| 中后台 / 管理系统 / B2B SaaS / 数据看板 | `saas` | 靛蓝主色、紧凑密度、轻阴影，专业克制 |
| 移动 App / 员工端小程序 / C 端工具 | `mobile` | 翡翠绿 + 青 渐变、大圆角、大触控目标、底部 TabBar |
| 电商 / 积分商城 / 营销活动页 | `commerce` | 红橙暖色、促销氛围（折扣标、倒计时、优惠券） |
| 官网 / 落地页 / 品牌发布 / 融资 BP 视觉稿 | `brand` | 暗色底、渐变光晕、毛玻璃、大号展示字 |

## 四主题气质速写

### saas · 企业中后台
- 关键词：可信、秩序、信息密度
- 主色 `#3d5afe`，白卡片 + 极浅灰底，8/12px 圆角，阴影几乎不可见
- 密度最高：表格、表单、看板的主场；侧栏 + 顶栏布局
- 搭配组件：`.table`、`.stat`、`.steps`、`.timeline`、`.field`

### mobile · 移动 App
- 关键词：轻盈、亲切、拇指友好
- 主色 `#00b578`，绿→青渐变 Hero，14/20px 圆角，控件 34→50px
- 布局：渐变头图 `.app-hero` + 圆角卡片流 + `.tabbar` 底导航 + `.fab`
- 搭配组件：`.cell`、`.sheet`、`.notice-bar`、`.product-card`

### commerce · 电商消费
- 关键词：热烈、转化、促销节奏
- 主色 `#ff4d4f` + 橙 `--accent`，红橙渐变价格与按钮，暖灰底
- 专属：`.price`（红价）、`.tag-off`（折扣角标）、`.coupon`、`.countdown.hot`
- 密度中等，价格信息永远最重（`price-lg` + 划线价对比）

### brand · 品牌官网
- 关键词：高级、叙事、暗夜光感
- 深蓝黑底 `#0a0c14`，紫→青渐变，毛玻璃 `.glass`，radial 光晕背景
- 专属：`.hero`（超大标题 `hero-title` + `.gradient-text` + `.hero-eyebrow`）、`.feature`、`.navbar`、`.footer`
- 阴影换成"发光"：`--shadow-brand` 紫色光晕；文字四级反白

## 组合演示建议

- 同一产品多端：核心页面用 `saas`，员工端页面单独设计成 `mobile` 结构（参考 example.html P6）
- 福利/积分类产品：后台用 `saas`，商城页切 `commerce` 对比评审（example.html P4）
- 评审汇报开场：用 `brand` 的 Hero 做封面页，再切回业务主题

## 扩展主题

需要新品牌色时，**不要散改组件**：在 `hifi.css` 末尾复制任一主题块，改令牌值，注册新的 `[data-theme="xxx"]` 与舞台条 `.theme-dot`，并同步更新本文件。组件层零改动。
