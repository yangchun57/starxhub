# /doc-archive — 项目文档归档压缩

当 `docs/00-项目文档/` 下的工作文件膨胀到数百上千行时，用这个命令把已完成/已归档的条目压缩归档，保持工作文件精简。

## 执行流程

### 1. 扫描文档状态（主 Agent）

读取以下文件并统计行数：
- `docs/00-项目文档/backlog.md`（已完成区段）
- `docs/00-项目文档/change-log.md`（已归档/已完成变更）
- `docs/00-项目文档/task-plan.md`（已完成任务）
- `docs/00-项目文档/lessons-learned.md`（已沉淀经验）

输出扫描报告表格：

| 文件 | 总行数 | 可归档条目 | 状态 |
|------|--------|-----------|------|

### 2. 预览归档方案（主 Agent）

运行归档脚本的 dry-run 模式：

```bash
python scripts/doc-archive.py . --dry-run --retention-days 7
```

将输出展示给用户，**停下等拍板**。

### 3. 执行归档（主 Agent）

用户确认后：

```bash
python scripts/doc-archive.py . --backup --retention-days 7 --force
```

参数说明：
- `--backup`：操作前备份到 `.backup/`
- `--retention-days N`：保留最近 N 天的已完成条目（默认 7）
- `--threshold N`：只处理超过 N 行的文件（默认 300）
- `--force`：跳过确认

### 4. 提交（主 Agent）

```bash
git add docs/00-项目文档/
git commit -m "docs: 归档压缩项目文档"
```

### 5. 汇报（主 Agent）

汇报归档结果：
- 归档了多少条记录
- 各文件压缩前后行数对比
- 归档文件位置（`docs/00-项目文档/archive/YYYY-MM/`）

## 归档规则

| 文档 | 归档条件 | 保留策略 |
|------|---------|---------|
| backlog.md | "已完成"表格中的条目 | 保留最近 7 天 |
| change-log.md | 状态为"已归档"或"已完成"的 CR 条目 | 保留最近 7 天 |
| task-plan.md | "已完成"区段的 checkbox 条目 | 保留最近 7 天 |
| lessons-learned.md | 状态为"已沉淀"或"已归档"的 LL 条目 | 保留最近 7 天 |

## 注意事项

- **不会删除任何内容**：归档条目移到 `archive/` 子目录，原文件保留摘要指针
- **备份优先**：默认操作前备份到 `.backup/`，可随时回滚
- **幂等安全**：重复运行不会重复归档已处理的条目
- **00-项目文档保持 Markdown**：归档文件也是 Markdown，不破坏 Agent 读写流
