---
paths:
  - "src/styles/**/*.css"
  - "src/types/**/*.ts"
  - "src/mock/**/*.ts"
  - "src/composables/**/*.ts"
  - "src/backend/web/src/styles/**/*.css"
  - "src/backend/web/src/types/**/*.ts"
  - "src/backend/web/src/mock/**/*.ts"
  - "showcase/**/*.mjs"
---

# 样式令牌与数据契约规范（星辰 starTech）

## 铁律（MUST）

1. **三层 CSS 加载顺序不可调换**：`tokens.css`（只放变量）→ `common.css`（reset / 骨架 / 栅格 / 工具类）→ `components.css`（全部 `hx-` 组件类）。
2. **单一事实来源**：`showcase/` 下的 `tokens.css` / `common.css` / `components.css` 是生成物，由 `npm run sync:showcase` 从 `src/styles/` 复制，**禁止手改**。
3. 主题切换：`document.documentElement.dataset.theme = 'light' | 'dark'`，localStorage key 固定 `hx-theme`；`useTheme` 模块加载时立即 `apply()` 防首屏闪白。Dark 只覆盖表面 / 文本 / 柔和底令牌，语义色与尺寸不变。
4. 数据契约：所有响应包成 `ApiResult<T>`（`code === 0` 为成功），列表用 `PageResult<T>`；接后端时只替换 `mock/index.ts` 或 `useRequest` 的 loader。
5. **`useRequest` 必须用 `shallowRef<T | undefined>(initial)`**，禁止 `ref<T>`：深层响应式解包会破坏 DTO 嵌套类型（规范 §17 踩坑 6）。
6. 装饰 SVG 加 `aria-hidden="true"`，纯图标按钮带 `title`；状态不能只靠颜色区分，必须带文字；动效尊重 `prefers-reduced-motion: reduce`。

## 发布前验证清单

- `npm run typecheck` / `npm run build` 通过；`dist/` 以相对路径引用资源（`base: './'`）。
- 1440×900 与 860px 窄屏：侧栏 / 顶栏固定，**只有内容区滚动**，导航可滚到末项。
- 所有下拉：parent = BODY、`position = fixed`、`z-index = 200`、DOM 中无原生 `<select>`。
- 浅色选中底色 `rgb(245, 248, 255)`（`--hx-brand-wash`），暗色 `rgb(27, 44, 73)`；暗色下卡片 / 表格 / 浮层 / 滚动条无白条。
- 键盘全链路：Tab → 下拉 → ↑↓ → Enter → Esc；9 个路由逐一打开无空白。
- 规范 §3 令牌表与 `tokens.css` 一致（改过令牌必须同步）。

## 与后端的契约提示

`ApiResult<T> code === 0` 是前端既定契约。接入 python 后端（RESTful + `BusinessException`）或 .NET8 后端（`ApiResult<T>` / `PageResult<T>`）时，在 `mock/index.ts` 或网关层做适配；前端类型定义不随后端改写。

## 详细规范

- @.claude/standards/星辰前端开发规范.md
- @.claude/standards/topics/INDEX.md
