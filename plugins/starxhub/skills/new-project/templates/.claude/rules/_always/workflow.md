---
trigger: always
---

# 工作流程规范

## 核心原则

### 四大先行
1. **需求先行**：先有需求文档，再进入设计
2. **设计先行**：先有架构设计，再编写代码
3. **契约先行**：先定义接口契约，再实现细节
4. **测试兜底**：所有代码必须有对应测试

### 优先级裁决
当进度与规范冲突时，按以下优先级执行：
1. **需求文档**（最高）：没有需求不设计
2. **架构设计**：没有设计不编码
3. **接口契约**：没有契约不实现
4. **测试用例**：没有测试不提交

## 标准开发流程

### 流程阶段
```
需求分析 → 架构设计 → 接口契约 → 数据库设计 → 编码实现 → 代码审查 → 测试验证
```

### 各阶段产出物

| 阶段 | 产出物 | 落盘路径 | 负责 Agent |
|------|--------|----------|------------|
| 需求分析 | 需求文档 | `docs/requirements/{feature}.md` | requirement-analyst |
| 架构设计 | 设计文档 | `docs/design/{feature}.md` | architect |
| 接口契约 | API 文档 | `docs/api/{feature}.md` | architect + backend-dev |
| 数据库设计 | ER 图 + DDL | `docs/database/{feature}.md` | db-engineer |
| 编码实现 | 代码 + 单元测试 | `src/` | backend-dev / frontend-dev |
| 代码审查 | Review 意见 | PR 评论 | reviewer |
| 测试验证 | 测试报告 | `docs/test/{feature}.md` | tester |

### ✅ 正确流程
```bash
# 1. 需求分析师输出需求文档
docs/requirements/user-login.md

# 2. 架构师读取需求，输出设计文档
docs/design/user-login.md

# 3. 架构师 + 后端开发定义接口契约
docs/api/user-login.md

# 4. 数据库工程师设计表结构
docs/database/user-login.md

# 5. 后端开发读取契约，编码实现
src/Controllers/UserController.cs

# 6. 审查员 Review
/review

# 7. 测试员验证
docs/test/user-login.md
```

### ❌ 错误流程
```bash
# ❌ 跳过需求直接编码
# 没有需求文档，直接写代码

# ❌ 跳过设计直接编码
# 没有架构设计，直接写代码

# ❌ 口头传递上下文
# Agent A 告诉 Agent B："需求在聊天记录里"
```

## 文档落盘要求

### 目录结构
```
docs/
├── requirements/     # 需求文档
│   └── {feature}.md
├── design/           # 设计文档
│   └── {feature}.md
├── api/              # 接口契约
│   └── {feature}.md
├── database/         # 数据库设计
│   └── {feature}.md
├── test/             # 测试报告
│   └── {feature}.md
└── changelog/        # 变更记录
    └── {version}.md
```

### 文档命名规范
- 文件名：kebab-case（`user-login.md`, `order-export.md`）
- 版本号：语义化版本（`1.0.0.md`, `1.1.0.md`）

### ✅ 正确示例
```bash
# 需求文档
docs/requirements/user-login.md

# 设计文档
docs/design/user-login.md

# API 文档
docs/api/user-login.md
```

### ❌ 错误示例
```bash
# ❌ 使用中文命名
docs/requirements/用户登录.md

# ❌ 没有统一目录
user-login-requirements.md  # 散落在根目录
```

## Agent 协作规范

### 核心原则
1. **产出物落盘**：每个 Agent 完成工作后，必须将产出物落盘到对应目录
2. **文档驱动**：下游 Agent 通过读取文档获取上下文，不依赖口头传递
3. **明确交接**：使用 `/review` 命令触发代码审查流程

### Agent 职责边界

| Agent | 职责 | 产出物 | 不做什么 |
|-------|------|--------|----------|
| requirement-analyst | 需求分析 | 需求文档 | 不做设计 |
| architect | 架构设计 | 设计文档 + API 契约 | 不写代码 |
| backend-dev | 后端编码 | 代码 + 单元测试 | 不做需求变更 |
| frontend-dev | 前端编码 | 代码 + 单元测试 | 不做需求变更 |
| db-engineer | 数据库设计 | ER 图 + DDL | 不写业务代码 |
| reviewer | 代码审查 | Review 意见 | 不修改代码 |
| tester | 测试验证 | 测试报告 | 不修复 bug |

### ✅ 正确协作
```bash
# 1. requirement-analyst 输出需求文档
Write docs/requirements/user-login.md

# 2. architect 读取需求文档
Read docs/requirements/user-login.md

# 3. architect 输出设计文档
Write docs/design/user-login.md

# 4. backend-dev 读取设计文档和 API 契约
Read docs/design/user-login.md
Read docs/api/user-login.md

# 5. backend-dev 编码实现
Write src/Controllers/UserController.cs

# 6. reviewer 审查代码
/review
```

### ❌ 错误协作
```bash
# ❌ 口头传递上下文
# requirement-analyst: "需求是用户登录"
# architect: "好的，我直接设计"  # 没有读取需求文档

# ❌ 越界操作
# reviewer: "我来帮你改代码"  # reviewer 不应该修改代码

# ❌ 跳过阶段
# backend-dev: "我直接写代码，不看设计文档"
```

### 交接协议

#### 上游 → 下游
- 上游 Agent 完成工作后，在文档末尾标注 `## 交接说明`
- 下游 Agent 读取文档时，优先查看交接说明

#### ✅ 正确示例
```markdown
# docs/design/user-login.md

## 交接说明（给 backend-dev）
- API 接口已定义在 docs/api/user-login.md
- 数据库表结构已定义在 docs/database/user-login.md
- 请使用 JWT 认证，参考 docs/design/auth.md
```

#### ❌ 错误示例
```markdown
# docs/design/user-login.md

## 设计内容
...
# 没有交接说明，下游 Agent 不知道要做什么
```

## 代码审查流程

### 触发方式
```bash
# 使用 /review 命令触发审查
/review
```

### 审查清单
- [ ] 代码是否符合命名规范
- [ ] 是否有单元测试
- [ ] 是否有边界情况处理
- [ ] 是否有性能问题
- [ ] 是否有安全隐患

### ✅ 正确流程
```bash
# 1. 开发者提交 PR
git push origin feat/user-login

# 2. 触发审查
/review

# 3. reviewer 输出审查意见
docs/review/user-login.md

# 4. 开发者修复问题
git commit -m "fix: 修复审查意见"

# 5. reviewer 确认通过
# Review 通过
```

## 文档模板

### 需求文档模板
```markdown
# {功能名称} 需求文档

## 背景
...

## 目标
...

## 功能需求
### 需求 1
...

### 需求 2
...

## 非功能需求
- 性能：...
- 安全：...

## 验收标准
- [ ] 标准 1
- [ ] 标准 2
```

### 设计文档模板
```markdown
# {功能名称} 设计文档

## 架构设计
...

## 技术选型
...

## 接口设计
参考 docs/api/{feature}.md

## 数据库设计
参考 docs/database/{feature}.md

## 交接说明
- 给 backend-dev：...
- 给 frontend-dev：...
```

## 边界情况

### 例外场景
- 紧急 bug 修复可先编码后补文档（但必须在 24 小时内补齐）
- 小型重构（< 100 行）可跳过设计文档

### 优先级裁决
当进度与文档规范冲突时，**优先保证核心文档**（需求 + 设计），其他文档可延后。

## 详细规范
如需更多细节，参考 @.claude/standards/通用开发规范.md
