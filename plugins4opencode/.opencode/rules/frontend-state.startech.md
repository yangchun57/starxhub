# 样式令牌与数据契约规范（星辰 starTech）

## 铁律（MUST）

1. **三层 CSS 加载顺序不可调换**：`tokens.css`（只放变量）→ `common.css`（reset / 骨架 / 栅格 / 工具类）→ `components.css`（全部 `hx-` 组件类）。
2. **单一事实来源**：`showcase/` 下的 `tokens.css` / `common.css` / `components.css` 是生成物，由 `npm run sync:showcase` 从 `src/styles/` 复制，**禁止手改**。
3. 主题切换：`document.documentElement.dataset.theme = 'light' | 'dark'`，localStorage key 固定 `hx-theme`；`useTheme` 模块加载时立即 `apply()` 防首屏闪白。Dark 只覆盖表面 / 文本 / 柔和底令牌，语义色与尺寸不变。
4. 数据契约：所有响应包成 `ApiResult<T>`（`code === 0` 为成功），列表用 `PageResult<T>`；**三种后端统一由 `src/api/http.ts` 适配**，接真接口只换 `useRequest` 的 loader → `() => http.get<T>('/orders')`，禁止在视图里手写 fetch/axios。
5. **`useRequest` 必须用 `shallowRef<T | undefined>(initial)`**，禁止 `ref<T>`：深层响应式解包会破坏 DTO 嵌套类型（规范 §17 踩坑 6）。
6. 装饰 SVG 加 `aria-hidden="true"`，纯图标按钮带 `title`；状态不能只靠颜色区分，必须带文字；动效尊重 `prefers-reduced-motion: reduce`。

## 发布前验证清单

- `npm run typecheck` / `npm run build` 通过；`dist/` 以相对路径引用资源（`base: './'`）。
- 1440×900 与 860px 窄屏：侧栏 / 顶栏固定，**只有内容区滚动**，导航可滚到末项。
- 所有下拉：parent = BODY、`position = fixed`、`z-index = 200`、DOM 中无原生 `<select>`。
- 浅色选中底色 `rgb(245, 248, 255)`（`--hx-brand-wash`），暗色 `rgb(27, 44, 73)`；暗色下卡片 / 表格 / 浮层 / 滚动条无白条。
- 键盘全链路：Tab → 下拉 → ↑↓ → Enter → Esc；9 个路由逐一打开无空白。
- 规范 §3 令牌表与 `tokens.css` 一致（改过令牌必须同步）。

## 与后端的契约提示（已由适配层解决）

`ApiResult<T> code === 0` 是前端既定契约，**不随后端改写**。脚手架按 `--backend` 把
`src/api/http.ts` 的 `envelope` 渲染为 `dotnet` / `python` / `java-spring`：

| 后端 | 原始响应 | 适配动作 |
|---|---|---|
| dotnet | `{code,data,message}` | 直通信封 |
| java-spring | `R<T>`：`{code,data,message\|msg}` | `msg` → `message` |
| python | RESTful 裸 DTO / `Page{items,total,page,size}` + `detail` | 2xx 包成 `code:0`；`size`→`pageSize`、`records`→`items`；4xx/5xx 取 `detail` |

**禁止**为迁就前端去改后端的 `R<T>` 或 `BusinessException`，也禁止改 `useRequest` 签名。
`vite.config.ts` 的 `/api` 代理目标由同一后端栈 token 注入，不需要手改端口。

## 详细规范

- @.claude/standards/星辰前端开发规范.md
- @.claude/standards/topics/INDEX.md
