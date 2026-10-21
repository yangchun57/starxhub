#!/usr/bin/env python3
"""
项目文档归档压缩工具

将 00-项目文档/ 下已完成/已归档且超过保留周期的条目移至 archive/ 子目录，
在原文件中保留摘要指针，防止文档无限膨胀。

归档策略：「时间窗口 + 文件行数阈值」双重条件
- 文件超过 --threshold 行（默认 300）才触发归档
- 已完成/已归档超过 --retention-days 天（默认 7）的条目才归档
- 无论如何至少保留最近 retention_days 天的条目

用法：
    python doc-archive.py <项目根目录> [选项]

选项：
    --dry-run              预览模式，只显示将要执行的操作
    --backup               操作前备份原文件到 .backup/
    --force                跳过确认直接执行
    --threshold N          只归档超过 N 行的文件（默认 300）
    --retention-days N     保留最近 N 天的已完成条目（默认 7）
"""

import argparse
import re
import shutil
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Tuple, Optional


# 可归档的文档类型及其归档规则
ARCHIVABLE_DOCS = {
    "backlog.md": {
        "section_pattern": r"^## 已完成$",
        "archive_type": "table",
    },
    "change-log.md": {
        "section_pattern": r"^## 变更状态机",
        "archive_type": "block",
        "entry_prefix": r"^### CR-",
        "status_pattern": r"\*\*状态\*\*[：:]\s*(已归档|已完成)",
        "date_pattern": r"\*\*提出\*\*[：:]\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2})",
    },
    "task-plan.md": {
        "section_pattern": r"^## (已完成|已关闭)",
        "archive_type": "checkbox",
    },
    "lessons-learned.md": {
        "section_pattern": r"^## (已沉淀|已归档)",
        "archive_type": "block",
        "entry_prefix": r"^### LL-",
        "status_pattern": r"状态[：:]\s*(已沉淀|已归档)",
        "date_pattern": r"(?:日期|创建|记录)[：:]\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2})",
    },
}


def count_lines(filepath: Path) -> int:
    with open(filepath, "r", encoding="utf-8") as f:
        return len(f.readlines())


def backup_file(filepath: Path, backup_dir: Path) -> Path:
    backup_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = backup_dir / f"{filepath.stem}_{timestamp}{filepath.suffix}"
    shutil.copy2(filepath, backup_path)
    return backup_path


def extract_date(text: str) -> Optional[datetime]:
    """从文本中提取日期，支持多种格式"""
    # 尝试 YYYY-MM-DD 或 YYYY/MM/DD
    for pattern in [
        r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})",
        r"(\d{4})年(\d{1,2})月(\d{1,2})日",
    ]:
        m = re.search(pattern, text)
        if m:
            try:
                return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)))
            except ValueError:
                continue
    return None


def parse_backlog_entries(content: str) -> Tuple[List[Tuple[str, Optional[datetime]]], List[str]]:
    """
    解析 backlog.md 的已完成部分。
    返回 (archive_entries_with_dates, keep_lines)
    archive_entries_with_dates: [(entry_text, date_or_none), ...]
    """
    lines = content.split("\n")
    archive_entries = []
    keep_lines = []
    in_completed_section = False

    for line in lines:
        if re.match(r"^## 已完成", line):
            in_completed_section = True
            keep_lines.append(line)
            continue

        if in_completed_section:
            if line.startswith("## "):
                in_completed_section = False
                keep_lines.append(line)
            elif re.match(r"^\| .+ \|", line) and not re.match(r"^\|[-\s|]+\|$", line) and "编号" not in line and "任务" not in line:
                date = extract_date(line)
                archive_entries.append((line, date))
            else:
                keep_lines.append(line)
        else:
            keep_lines.append(line)

    return archive_entries, keep_lines


def parse_block_entries(content: str, entry_prefix: str, status_pattern: str, date_pattern: str) -> Tuple[List[Tuple[str, Optional[datetime]]], List[str]]:
    """
    解析 block 类型文档（change-log.md, lessons-learned.md）。
    """
    lines = content.split("\n")
    archive_entries = []
    keep_lines = []
    current_entry = []
    in_entry = False

    def flush_entry():
        nonlocal current_entry
        if not current_entry:
            return
        entry_text = "\n".join(current_entry)
        # 检查是否有归档状态
        if re.search(status_pattern, entry_text):
            date = extract_date(entry_text)
            archive_entries.append((entry_text, date))
        else:
            keep_lines.append(entry_text)
        current_entry = []

    for line in lines:
        if re.match(entry_prefix, line):
            flush_entry()
            current_entry = [line]
            in_entry = True
        elif in_entry and (re.match(r"^##[# ]", line) or re.match(r"^## ", line)):
            flush_entry()
            keep_lines.append(line)
            in_entry = False
        elif in_entry:
            current_entry.append(line)
        else:
            keep_lines.append(line)

    flush_entry()
    return archive_entries, keep_lines


def parse_checkbox_entries(content: str) -> Tuple[List[Tuple[str, Optional[datetime]]], List[str]]:
    """
    解析 task-plan.md 的已完成 checkbox 条目。
    """
    lines = content.split("\n")
    archive_entries = []
    keep_lines = []
    in_completed_section = False

    for line in lines:
        if re.match(r"^## (已完成|已关闭)", line):
            in_completed_section = True
            keep_lines.append(line)
            continue

        if in_completed_section:
            if line.startswith("## "):
                in_completed_section = False
                keep_lines.append(line)
            elif re.match(r"^- \[[ x]\] .+", line):
                date = extract_date(line)
                archive_entries.append((line, date))
            else:
                keep_lines.append(line)
        else:
            keep_lines.append(line)

    return archive_entries, keep_lines


def split_by_retention(
    entries: List[Tuple[str, Optional[datetime]]],
    retention_days: int,
) -> Tuple[List[str], List[str]]:
    """
    按保留周期分割条目。
    返回 (to_archive, to_keep)
    规则：
    - 有日期且超过 retention_days 天 → 归档
    - 有日期但在 retention_days 内 → 保留
    - 无日期 → 保留（保守策略，无法判定日期的不归档）
    """
    cutoff = datetime.now() - timedelta(days=retention_days)
    to_archive = []
    to_keep = []

    for entry_text, entry_date in entries:
        if entry_date is not None and entry_date < cutoff:
            to_archive.append(entry_text)
        else:
            to_keep.append(entry_text)

    return to_archive, to_keep


def archive_doc(
    doc_path: Path,
    archive_dir: Path,
    retention_days: int,
    dry_run: bool = False,
) -> Tuple[int, int]:
    if not doc_path.exists():
        return 0, 0

    content = doc_path.read_text(encoding="utf-8")
    original_lines = len(content.split("\n"))
    doc_name = doc_path.name
    doc_config = ARCHIVABLE_DOCS.get(doc_name)

    if not doc_config:
        return 0, original_lines

    archive_type = doc_config["archive_type"]

    # 解析条目
    if doc_name == "backlog.md":
        entries, keep_lines = parse_backlog_entries(content)
    elif doc_name == "task-plan.md":
        entries, keep_lines = parse_checkbox_entries(content)
    elif archive_type == "block":
        entries, keep_lines = parse_block_entries(
            content,
            doc_config["entry_prefix"],
            doc_config["status_pattern"],
            doc_config["date_pattern"],
        )
    else:
        return 0, original_lines

    if not entries:
        return 0, original_lines

    # 按保留周期分割
    to_archive, to_keep = split_by_retention(entries, retention_days)

    if not to_archive:
        return 0, original_lines

    # 把保留的条目加回 keep_lines
    # 对于 block 类型，to_keep 里已经是完整文本
    # 需要重建文件内容

    # 生成归档文件
    timestamp = datetime.now().strftime("%Y%m%d")
    archive_subdir = archive_dir / datetime.now().strftime("%Y-%m")
    archive_file = archive_subdir / f"{doc_path.stem}_{timestamp}.md"

    archive_content = f"# {doc_path.stem} 归档 - {timestamp}\n\n"
    archive_content += f"> 归档时间：{datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
    archive_content += f"> 保留周期：{retention_days} 天\n"
    archive_content += f"> 归档条目数：{len(to_archive)}\n\n"
    archive_content += "\n\n".join(to_archive)

    # 重建原文件：保留部分 + 归档指针
    if archive_type == "block":
        # block 类型的 keep_lines 已经包含了非归档内容
        new_content = "\n".join(keep_lines)
    else:
        # table 和 checkbox 类型需要把 to_keep 的条目放回
        # 策略：在已完成 section 后面放保留的条目
        new_lines = []
        in_completed = False
        completed_header_inserted = False

        for line in keep_lines:
            if re.match(doc_config.get("section_pattern", r"^## 已完成"), line) if doc_name != "task-plan.md" else re.match(r"^## (已完成|已关闭)", line):
                in_completed = True
                new_lines.append(line)
                if not completed_header_inserted and to_keep:
                    for kept in to_keep:
                        new_lines.append(kept)
                    completed_header_inserted = True
                continue
            new_lines.append(line)

        new_content = "\n".join(new_lines)

    # 添加归档指针
    try:
        rel_path = archive_file.relative_to(doc_path.parent)
    except ValueError:
        rel_path = archive_file
    pointer = f"\n\n---\n\n*已归档 {len(to_archive)} 条记录（超过 {retention_days} 天）至 [{rel_path}]({rel_path})*\n"
    new_content += pointer

    if dry_run:
        print(f"[DRY-RUN] {doc_path.name}")
        print(f"  总条目：{len(entries)}，可归档：{len(to_archive)}，保留：{len(to_keep)}")
        print(f"  归档文件：{archive_file}")
        print(f"  原文件：{original_lines} 行 → 约 {len(new_content.split(chr(10)))} 行")
    else:
        archive_subdir.mkdir(parents=True, exist_ok=True)
        archive_file.write_text(archive_content, encoding="utf-8")
        doc_path.write_text(new_content, encoding="utf-8")
        print(f"[OK] 归档 {len(to_archive)} 条记录：{doc_path.name}")
        print(f"     → {archive_file}")

    return len(to_archive), original_lines


def main():
    parser = argparse.ArgumentParser(
        description="项目文档归档压缩工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例：
    python doc-archive.py /path/to/project --dry-run
    python doc-archive.py /path/to/project --backup
    python doc-archive.py /path/to/project --retention-days 14
    python doc-archive.py /path/to/project --threshold 500

归档策略：
    文件超过 --threshold 行才触发归档（默认 300 行）。
    已完成/已归档超过 --retention-days 天的条目才归档（默认 7 天）。
    无日期的条目保守保留，不归档。
        """,
    )
    parser.add_argument("project_root", type=Path, help="项目根目录")
    parser.add_argument("--dry-run", action="store_true", help="预览模式，不实际执行")
    parser.add_argument("--backup", action="store_true", help="操作前备份原文件")
    parser.add_argument("--force", action="store_true", help="跳过确认直接执行")
    parser.add_argument("--threshold", type=int, default=300, help="只归档超过 N 行的文件（默认 300）")
    parser.add_argument("--retention-days", type=int, default=7, help="保留最近 N 天的已完成条目（默认 7）")

    args = parser.parse_args()

    docs_dir = args.project_root / "docs" / "00-项目文档"
    if not docs_dir.exists():
        print(f"错误：找不到 {docs_dir}", file=sys.stderr)
        sys.exit(1)

    archive_dir = docs_dir / "archive"

    print(f"扫描 {docs_dir} ...")
    print(f"归档触发阈值：{args.threshold} 行")
    print(f"保留周期：{args.retention_days} 天")
    print(f"截止日期：{(datetime.now() - timedelta(days=args.retention_days)).strftime('%Y-%m-%d')} 之前的已完成条目将被归档")
    print()

    candidates = []
    for doc_name in ARCHIVABLE_DOCS:
        doc_path = docs_dir / doc_name
        if doc_path.exists():
            lines = count_lines(doc_path)
            if lines >= args.threshold:
                candidates.append((doc_path, lines))
                print(f"  候选：{doc_name} ({lines} 行)")
            else:
                print(f"  跳过：{doc_name} ({lines} 行 < {args.threshold})")

    if not candidates:
        print("\n没有需要归档的文档。")
        return

    print(f"\n共 {len(candidates)} 个文件需要归档")

    if not args.dry_run and not args.force:
        response = input("继续？[y/N] ")
        if response.lower() != "y":
            print("已取消。")
            return

    if args.backup and not args.dry_run:
        backup_dir = docs_dir / ".backup"
        print(f"\n备份原文件到 {backup_dir} ...")
        for doc_path, _ in candidates:
            backup_path = backup_file(doc_path, backup_dir)
            print(f"  {doc_path.name} → {backup_path.name}")

    print("\n开始归档 ...")
    total_archived = 0
    for doc_path, original_lines in candidates:
        archived, _ = archive_doc(doc_path, archive_dir, args.retention_days, args.dry_run)
        total_archived += archived

    print(f"\n完成！共归档 {total_archived} 条记录。")

    if args.dry_run:
        print("\n[DRY-RUN] 以上为预览，未实际执行。移除 --dry-run 以执行归档。")


if __name__ == "__main__":
    main()
