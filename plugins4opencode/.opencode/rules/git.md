# Git 提交规范

## 分支模型

### 规范
- **主分支**：`main`（始终可构建，禁止直接推送）
- **功能分支**：`feat/{功能名}`（从 main 切出，合并后删除）
- **修复分支**：`fix/{问题描述}`（从 main 切出，合并后删除）
- **发布分支**：`release/{版本号}`（可选，用于发布前冻结）
- **热修复分支**：`hotfix/{版本号}`（从 main 切出，修复后合并回 main）

### ✅ 正确示例
```bash
# 从 main 切出功能分支
git checkout main
git checkout -b feat/user-login

# 开发完成后合并回 main
git checkout main
git merge --no-ff feat/user-login
git branch -d feat/user-login
```

### ❌ 错误示例
```bash
# ❌ 直接在 main 分支开发
git checkout main
# ... 修改代码 ...
git commit -m "开发中"

# ❌ 使用 merge 而非 rebase 更新功能分支（导致历史混乱）
git checkout feat/user-login
git merge main
```

## 提交信息格式

使用 Conventional Commits 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(auth): 添加用户登录功能` |
| `fix` | 修复 bug | `fix(api): 修复分页查询返回空数据` |
| `docs` | 文档变更 | `docs(readme): 更新安装说明` |
| `style` | 代码格式（不影响逻辑） | `style: 统一缩进为 4 空格` |
| `refactor` | 重构（非新功能、非修复） | `refactor(user): 提取公共查询方法` |
| `test` | 测试相关 | `test(auth): 添加登录单元测试` |
| `chore` | 构建/工具/依赖 | `chore(deps): 升级 SqlSugar 到 5.1.4` |

### Scope（可选）
- 模块名：`auth`, `user`, `order`, `api`, `web`
- 影响范围：`backend`, `frontend`, `database`

### Subject
- 中文简述，不超过 50 字
- 使用祈使句（"添加用户登录功能"，非"添加了..."）

### Body（可选）
- 详细说明变更内容、原因、影响
- 每行不超过 72 字

### Footer（可选）
- 关联 Issue：`Closes #123`
- 破坏性变更：`BREAKING CHANGE: ...`

### ✅ 正确示例
```bash
# 简单提交
git commit -m "feat(auth): 添加 JWT 认证"

# 带 Body 和 Footer
git commit -m "feat(user): 添加用户导出功能

- 支持 Excel 格式导出
- 单次导出不超过 10000 条
- 使用异步任务避免超时

Closes #456"

# 破坏性变更
git commit -m "feat(api): 修改用户接口返回格式

BREAKING CHANGE: UserDto 的 id 字段从 int 改为 long"
```

### ❌ 错误示例
```bash
# ❌ 没有 type
git commit -m "修改了一些代码"

# ❌ Subject 太长且非祈使句
git commit -m "feat(auth): 我昨天花了很长时间实现了用户登录功能并且添加了JWT认证"

# ❌ 混合多个不相关变更
git commit -m "feat(user): 添加用户导出功能; fix(auth): 修复登录bug; docs: 更新readme"
```

## 提交粒度

### 规范
- 一个逻辑变更 = 一个 commit
- 禁止混合多个不相关变更
- 重构和功能变更分开提交

### ✅ 正确
```bash
# 第一次提交：重构
git commit -m "refactor(user): 提取公共查询方法"

# 第二次提交：新功能
git commit -m "feat(user): 添加用户导出功能"
```

### ❌ 错误
```bash
# ❌ 混合重构和新功能
git commit -m "feat(user): 添加导出功能并重构查询方法"
```

## 质量门禁

### 规范
- 提交前必须通过：`bash scripts/ci.sh`
- 禁止使用 `--no-verify` 绕过检查
- 测试失败禁止提交

### ✅ 正确流程
```bash
# 1. 运行本地检查
bash scripts/ci.sh

# 2. 检查通过后提交
git commit -m "feat(auth): 添加 JWT 认证"

# 3. 推送到远程
git push origin feat/user-login
```

### ❌ 错误做法
```bash
# ❌ 跳过检查
git commit --no-verify -m "feat: 添加功能"

# ❌ 测试失败仍提交
git commit -m "test: 添加测试（部分失败）"
```

## 合并策略

### 规范
- 功能分支合并回 main 时使用 `--no-ff`（保留合并历史）
- 功能分支更新时使用 `rebase`（保持线性历史）

### ✅ 正确
```bash
# 合并功能分支到 main（保留合并节点）
git checkout main
git merge --no-ff feat/user-login

# 更新功能分支（保持线性）
git checkout feat/user-login
git rebase main
```

## 边界情况

### 例外场景
- 紧急热修复可先合并后补测试
- 文档类变更可跳过部分 CI 检查（如单元测试）

### 优先级裁决
当提交粒度与紧急上线冲突时，**优先保证可回滚**（拆分 commit）。

## 详细规范
如需更多细节，参考 @.claude/standards/通用开发规范.md#Git规范
