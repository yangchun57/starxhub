# AGENTS.md — 星枢项目项目记忆

本文件是项目内所有 Agent（含主对话和 Subagent）共享的集体记忆与最高规范。任何 Agent 开工前必须先读取本文件。

## 项目速览

（待填写项目简介）

## 技术栈

- **后端**：待定（未指定 --backend）
- **前端**：待定（未指定 --frontend）
- **租户模型**：单租户（未启用多租户隔离）。若后续需要多租户，请用 `--multi-tenant` 重新初始化脚手架。

<!-- 若与本项目的实际栈不符，请就地修改本节。 -->

## 最高优先级约束（违反即返工，任何情况下不得妥协）

<!-- TODO: 填写本项目的业务红线，这是最关键的部分。示例（脚手架已按所选栈预填通用部分，业务约束请补充）：
2. **【字段映射红线】** 后端 PascalCase ↔ 前端 camelCase（待确认），前端禁止自行改名。
3. **【分层边界红线】** 接口层禁含业务逻辑；业务层禁操作 Web 上下文；模型层禁含业务方法；通用层禁反向依赖业务层。
4. **【响应格式红线】** 统一返回 统一响应封装（待定）。
-->

## 开发规范（自动加载 + 深层参考）

**规范加载**（OpenCode）：不再使用路径范围自动注入；规则由 `opencode.jsonc` 的 `instructions` 全量注入，未选中的技术栈变体只落盘、不加载。
- 后端 API/领域/基础设施层 → 自动加载对应 rules
- 前端页面/状态层 → 自动加载对应 rules
- 通用规范（工作流/数据库/Git）→ 始终加载

**完整规范参考**（`.claude/standards/`）供深层阅读：
- 后端: `（待接入规范目录）`
- 前端: `（待接入规范目录）`
- 通用: `.claude/standards/通用开发规范.md`

**按需读取约定**：
1. 优先读 `.claude/standards/topics/INDEX.md` 定位主题，只读相关主题文件
2. 禁止无目的整读大规范（>20KB）
3. **规则上浮标准**：反复用到的规则（3 次中 2 次）上浮到 `.opencode/rules/` 或本文件；低频规则只留在 standards 深处

## 项目内文档（下游 Agent 的上下文来源）

| 文档 | 内容 | 维护者 | 阶段 |
|------|------|--------|------|
| `docs/00-项目文档/requirements.md` | 需求分析 | requirement-analyst | 需求 |
| `docs/00-项目文档/personas.md` | 用户画像 | ux-researcher | 需求 |
| `docs/00-项目文档/user-journey.md` | 用户旅程图 | ux-researcher | 需求 |
| `docs/00-项目文档/competitive-analysis.md` | 竞品分析 | ux-researcher | 需求 |
| `docs/00-项目文档/ia.md` | 信息架构 | product-designer | 设计 |
| `docs/00-项目文档/flows.md` | 交互流程 | product-designer | 设计 |
| `docs/00-项目文档/design-spec.md` | 设计规范 | product-designer | 设计 |
| `docs/00-项目文档/backlog.md` | 待办清单 | pm | 规划 |
| `docs/00-项目文档/task-plan.md` | 任务计划 | pm | 规划 |
| `docs/00-项目文档/lessons-learned.md` | 经验教训库 | pm | 复盘 |
| `docs/00-项目文档/change-log.md` | 需求变更记录 | pm | 变更 |
| `docs/00-项目文档/architecture.md` | 系统架构 | architect | 开发 |
| `docs/00-项目文档/api-contracts.md` | 接口契约 | architect | 开发 |
| `docs/00-项目文档/database-design.md` | 数据库设计 | db-engineer | 开发 |

**约定**：上游 Agent 的产出必须落盘到 docs/00-项目文档/，下游 Agent 通过读取文档获取上下文。

## Agent 阵容（20 个专职 Agent，五阶段）

| 阶段 | Agent | 角色 |
|------|-------|------|
| 需求分析 | requirement-analyst / ux-researcher / product-designer / html-prototyper | 需求、研究、设计、高保真原型 |
| 任务规划 | pm | 任务拆解、计划 |
| 需求评审 | req-coordinator / req-doc-reviewer / req-impact-reviewer / req-test-reviewer | 需求质量、变更影响与合规、测试覆盖评审 |
| 开发实施 | plan-risk-analyst / plan-gatekeeper / architect / db-engineer / backend-dev / frontend-dev / tester / reviewer / devops | 方案门禁与开发 |
| 测试修复 | functional-tester / bug-fixer | 功能测试用例、缺陷修复 |

**协作流程**：模糊需求 → requirement-analyst → ux-researcher → product-designer → html-prototyper（高保真原型）→ pm → req-coordinator（需求评审团队把关，评审通过后再派发）→ plan-risk-analyst / plan-gatekeeper（方案门禁）→ 开发 agents → reviewer → functional-tester（用例）/ bug-fixer（修复）

**命令入口**：`/product-discovery`（需求+设计）、`/new-feature`（开发）、`/change-request`（变更）、`/req-review`（需求评审）、`/plan-gate`（方案门禁）、`/gen-test-cases`（功能测试用例）、`/fix-bug`（Bug 修复+知识沉淀）、`/review`、`/code-review`、`/gen-tests`、`/retro`（复盘）、`/deploy`（部署/CI）、`/doc-archive`（文档归档）、`/health-check`（健康巡检）

## 工作约定

1. 需求先行：先有需求+设计文档，再开发
2. 规划先行：计划经确认后再实施
3. 契约先行：先有架构/契约/数据库设计，再有实现
4. 审查兜底：所有代码经 reviewer 审查
5. 不确定就问：禁止臆测需求
6. 单一职责：一次只让一个 Agent 完成一个明确交付物
7. 代码语言：代码和注释统一中文



## 数据库与类型生成约定

1. **数据库迁移**：表结构变更必须通过 `src/backend/api/sql/migrations/V{三位序号}__{描述}.sql` 版本化脚本（只增不改、顺序执行、幂等优先），禁止手工改库，详见该目录 README
2. **前端类型生成**：业务实体 TS 类型优先 `cd src/backend/web && npm run gen:api` 从后端 Swagger 自动生成（swagger-typescript-api），生成物为唯一事实源；手写仅限 Form/Query 等前端形态
3. **质量门禁（本地为主、远端为辅）**：本地 `bash scripts/ci.sh`（后端 fmt+build+test + 前端构建）是单一事实源；`.githooks/pre-push` 钩子在 `git push` 前自动跑它，`.claude` 的 pre-commit 钩子在 AI 提交前也跑后端测试。远端 `.github/workflows/ci.yml` 仅复用同一脚本作兜底，不作为唯一防线。禁止用 `--no-verify` 绕过门禁。

## 分支与质量约定

1. **分支模型**（简化 trunk-based）：`main` 始终干净可构建（CI 绿）；功能性工作在 `feat/xxx`、变更在 `change/xxx` 分支进行，完成后合回 main
2. **禁止直接污染 main**：/new-feature、/change-request 的实施阶段应基于分支进行，阶段化提交落在功能分支上
3. **并行开发**：命令交错时（如 /new-feature 进行中来了 /change-request），各自独立分支，避免互相覆盖
4. **静态检查**：后端 `（待填写 lint 命令）`（CI 校验）、前端 `prettier`（`npm run format` / `format:check`）、根目录 `.editorconfig` 统一基础格式
5. **集成测试**：红线类约束（认证授权等关键约束）优先用集成测试锁死（后端用栈内建应用测试宿主——.NET 为 WebApplicationFactory、Python 为 fastapi TestClient），比文档更硬
6. **依赖更新**：dependabot 每周提 minor/patch 升级 PR，main 分支合并前跑 CI 确认不破坏

## 提交约定（阶段化提交）

1. 每个角色交付物落盘后**立即 git commit**，禁止攒到最后一次性提交
2. 提交粒度：一个角色交付物 = 一个 commit
3. commit message 遵循 Conventional Commits，中文简述：
   - `docs: xxx`   文档（需求/设计/契约/记录）
   - `feat: xxx`   新功能
   - `fix: xxx`    修复
   - `test: xxx`   测试
   - `chore: xxx`  配置/杂项
4. 验证通过才提交（构建失败/测试失败不 commit）
5. 提交由主 Agent 在各阶段交付物落盘后执行

## 常用命令

- 后端构建：`（待填写构建命令）`
- 后端测试：`（待填写测试命令）`
- 前端启动：`cd src/backend/web && npm run dev`
- 前端构建：`cd src/backend/web && npm run build`
- 本地质量门禁：`bash scripts/ci.sh`（提交/推送前跑；pre-push 钩子自动执行）

<!-- 若所选栈的命令不同（如 uni-app 用 npm run dev:h5），请就地修改。 -->

## OpenCode 规则索引

已在 `opencode.jsonc → instructions` 中加载：

- `.opencode/rules/database.md`
- `.opencode/rules/git.md`
- `.opencode/rules/workflow.md`

其他技术栈变体位于 `.opencode/rules/`，需要切换技术栈时把对应文件名加入 `instructions`。
角色位于 `.opencode/agents/`，流程命令位于 `.opencode/commands/`，护栏插件位于 `.opencode/plugins/`。
