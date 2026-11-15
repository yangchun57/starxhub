#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI 代码审查脚本

按 .claude/rules/ 中定义的规范自动扫描代码，检查多租户红线、API 规范、
分层边界、安全漏洞、性能反模式等，输出分级问题清单。

用法：
    python code_review.py <项目路径> [--scope all|changed|staged] [--output <报告路径>]

示例：
    python code_review.py D:/projects/ecommerce
    python code_review.py D:/projects/ecommerce --scope changed --days 7
    python code_review.py D:/projects/ecommerce --output docs/my-review.md
"""

import argparse
import os
import re
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Tuple


class CodeIssue:
    """代码问题"""
    def __init__(self, severity: str, category: str, file: str, line: int,
                 code: str, description: str, suggestion: str):
        self.severity = severity  # Blocker / Major / Minor
        self.category = category
        self.file = file
        self.line = line
        self.code = code
        self.description = description
        self.suggestion = suggestion


class CodeReviewer:
    """代码审查器"""

    def __init__(self, project_path: str, scope: str = "all", days: int = 7):
        self.project_path = Path(project_path).resolve()
        self.scope = scope
        self.days = days
        self.rules_dir = self.project_path / ".claude" / "rules"
        self.issues: List[CodeIssue] = []
        self.files_scanned = 0

        # 技术栈检测
        self.backend_type = self._detect_backend()
        self.frontend_type = self._detect_frontend()

    def _detect_backend(self) -> str:
        """检测后端技术栈"""
        if (self.project_path / "src" / "backend" / "api").exists():
            api_dir = self.project_path / "src" / "backend" / "api"
            if list(api_dir.rglob("*.csproj")):
                return "dotnet"
            elif list(api_dir.rglob("*.py")):
                return "python"
            elif list(api_dir.rglob("pom.xml")):
                return "java"
        return "unknown"

    def _detect_frontend(self) -> str:
        """检测前端技术栈"""
        web_dir = self.project_path / "src" / "backend" / "web"
        if web_dir.exists():
            pkg_json = web_dir / "package.json"
            if pkg_json.exists():
                try:
                    content = pkg_json.read_text(encoding="utf-8")
                    if "uni-app" in content or "@dcloudio" in content:
                        return "uniapp"
                    elif "vue" in content:
                        return "vue"
                except:
                    pass
        return "unknown"

    def _get_files_to_scan(self) -> List[Path]:
        """获取要扫描的文件列表"""
        ext_map = {
            "dotnet": [".cs"],
            "python": [".py"],
            "java": [".java"],
        }
        frontend_ext = [".ts", ".tsx", ".vue", ".js", ".jsx"]

        extensions = set()
        if self.backend_type != "unknown":
            extensions.update(ext_map.get(self.backend_type, []))
        if self.frontend_type != "unknown":
            extensions.update(frontend_ext)

        if not extensions:
            extensions = {".cs", ".py", ".java", ".ts", ".tsx", ".vue", ".js", ".jsx"}

        # 排除目录
        exclude_dirs = {
            "node_modules", "bin", "obj", ".git", "__pycache__",
            ".venv", "venv", "dist", "build", ".idea", ".vscode"
        }

        files = []

        if self.scope == "staged":
            # 只扫描 git 暂存区
            try:
                result = subprocess.run(
                    ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
                    cwd=self.project_path,
                    capture_output=True,
                    text=True,
                    check=True
                )
                for line in result.stdout.strip().split("\n"):
                    if line:
                        file_path = self.project_path / line
                        if file_path.exists() and file_path.suffix in extensions:
                            files.append(file_path)
            except subprocess.CalledProcessError:
                print("警告：无法获取 git 暂存区，回退到全部文件")
                self.scope = "all"

        if self.scope == "changed":
            # 只扫描最近 N 天修改的文件
            cutoff = datetime.now() - timedelta(days=self.days)
            for ext in extensions:
                for file_path in self.project_path.rglob(f"*{ext}"):
                    if any(excl in file_path.parts for excl in exclude_dirs):
                        continue
                    try:
                        mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                        if mtime >= cutoff:
                            files.append(file_path)
                    except:
                        pass

        if self.scope == "all":
            for ext in extensions:
                for file_path in self.project_path.rglob(f"*{ext}"):
                    if any(excl in file_path.parts for excl in exclude_dirs):
                        continue
                    files.append(file_path)

        return files

    def _check_tenant_red_lines(self, file_path: Path, content: str, lines: List[str]):
        """检查 1：多租户红线"""
        if self.backend_type == "dotnet":
            # 检查 .Where() 但没有 TenantId 过滤
            for i, line in enumerate(lines, 1):
                if re.search(r"\.Where\(", line) and re.search(r"\.ToList\(\)|\.FirstOrDefault\(\)", line):
                    if not re.search(r"TenantId", line, re.IGNORECASE):
                        # 检查上下文（前后 5 行）
                        context = "\n".join(lines[max(0, i-6):min(len(lines), i+5)])
                        if not re.search(r"TenantId", context, re.IGNORECASE):
                            self.issues.append(CodeIssue(
                                "Blocker",
                                "多租户红线",
                                str(file_path.relative_to(self.project_path)),
                                i,
                                line.strip(),
                                "SQL 查询无 tenant_id 过滤，可能访问其他租户数据",
                                "添加 `.Where(x => x.TenantId == currentTenantId)` 过滤条件"
                            ))

        elif self.backend_type == "python":
            # 检查 SQLAlchemy 查询无 tenant_id
            for i, line in enumerate(lines, 1):
                if re.search(r"\.query\(|\.filter\(", line):
                    if not re.search(r"tenant_id", line, re.IGNORECASE):
                        context = "\n".join(lines[max(0, i-6):min(len(lines), i+5)])
                        if not re.search(r"tenant_id", context, re.IGNORECASE):
                            self.issues.append(CodeIssue(
                                "Blocker",
                                "多租户红线",
                                str(file_path.relative_to(self.project_path)),
                                i,
                                line.strip(),
                                "SQLAlchemy 查询无 tenant_id 过滤",
                                "添加 `.filter(Model.tenant_id == current_tenant_id)` 过滤条件"
                            ))

    def _check_security_vulnerabilities(self, file_path: Path, content: str, lines: List[str]):
        """检查 2：安全漏洞"""
        # SQL 注入
        for i, line in enumerate(lines, 1):
            if re.search(r'\$".*SELECT.*\{', line) or re.search(r'f".*SELECT.*\{', line):
                self.issues.append(CodeIssue(
                    "Blocker",
                    "安全漏洞",
                    str(file_path.relative_to(self.project_path)),
                    i,
                    line.strip(),
                    "字符串拼接 SQL，存在注入风险",
                    "使用参数化查询或 ORM 的查询构建器"
                ))

        # 硬编码密钥
        for i, line in enumerate(lines, 1):
            if re.search(r'(password|secret|key|token)\s*=\s*["\'][^"\']+["\']', line, re.IGNORECASE):
                if not re.search(r'(TODO|placeholder|example)', line, re.IGNORECASE):
                    self.issues.append(CodeIssue(
                        "Blocker",
                        "安全漏洞",
                        str(file_path.relative_to(self.project_path)),
                        i,
                        line.strip(),
                        "硬编码敏感信息（密钥/密码）",
                        "使用环境变量或配置中心管理敏感信息"
                    ))

    def _check_layer_boundaries(self, file_path: Path, content: str, lines: List[str]):
        """检查 3：分层边界"""
        if "Controller" in file_path.name or "controller" in file_path.name.lower():
            # Controller 中不应直接访问 DB
            for i, line in enumerate(lines, 1):
                if re.search(r'(_db|_repository|DbContext|SqlSugar)', line):
                    if re.search(r'\.(Queryable|Query|Where|Select|Insert|Update|Delete)', line):
                        self.issues.append(CodeIssue(
                            "Major",
                            "分层边界",
                            str(file_path.relative_to(self.project_path)),
                            i,
                            line.strip(),
                            "Controller 直接访问数据库，违背分层架构",
                            "将数据访问逻辑移到 Service 层"
                        ))

    def _check_api_standards(self, file_path: Path, content: str, lines: List[str]):
        """检查 4：API 规范"""
        if "Controller" in file_path.name or "controller" in file_path.name.lower():
            # 检查是否使用统一的响应格式
            for i, line in enumerate(lines, 1):
                if re.search(r'return\s+(Ok|Json|Content)\(', line):
                    if not re.search(r'ApiResult|PageResult|BusinessResponse', line):
                        self.issues.append(CodeIssue(
                            "Major",
                            "API 规范",
                            str(file_path.relative_to(self.project_path)),
                            i,
                            line.strip(),
                            "API 响应未使用统一格式（ApiResult/PageResult）",
                            "使用 `return Ok(ApiResult.Success(data))` 统一响应格式"
                        ))

    def _check_performance_patterns(self, file_path: Path, content: str, lines: List[str]):
        """检查 5：性能反模式"""
        # N+1 查询
        if re.search(r'foreach.*\n.*\.(Query|Where|FirstOrDefault)', content, re.MULTILINE):
            self.issues.append(CodeIssue(
                "Major",
                "性能反模式",
                str(file_path.relative_to(self.project_path)),
                1,
                "(循环中的数据库查询)",
                "可能存在 N+1 查询问题",
                "使用 Include/ThenInclude 预加载，或批量查询"
            ))

    def _check_code_complexity(self, file_path: Path, content: str, lines: List[str]):
        """检查 6：代码复杂度"""
        # 函数过长
        method_pattern = re.compile(r'(public|private|protected)\s+\w+\s+\w+\s*\([^)]*\)\s*\{')
        brace_count = 0
        method_start = 0
        method_name = ""

        for i, line in enumerate(lines, 1):
            if method_pattern.search(line):
                method_start = i
                method_name = line.strip()
                brace_count = 0

            brace_count += line.count('{') - line.count('}')

            if brace_count == 0 and method_start > 0:
                method_length = i - method_start
                if method_length > 50:
                    self.issues.append(CodeIssue(
                        "Minor",
                        "代码复杂度",
                        str(file_path.relative_to(self.project_path)),
                        method_start,
                        method_name[:80],
                        f"函数过长（{method_length} 行，建议 < 50 行）",
                        "拆分为多个小函数，每个函数职责单一"
                    ))
                method_start = 0

    def _check_naming_conventions(self, file_path: Path, content: str, lines: List[str]):
        """检查 7：命名规范"""
        if self.backend_type == "dotnet":
            # C# 类名应该是 PascalCase
            class_pattern = re.compile(r'class\s+([a-z]\w*)')
            for i, line in enumerate(lines, 1):
                match = class_pattern.search(line)
                if match:
                    self.issues.append(CodeIssue(
                        "Minor",
                        "命名规范",
                        str(file_path.relative_to(self.project_path)),
                        i,
                        line.strip(),
                        f"类名 `{match.group(1)}` 不符合 PascalCase 规范",
                        f"改为 `{match.group(1).capitalize()}`"
                    ))

    def review(self) -> str:
        """执行代码审查"""
        print(f"开始代码审查：{self.project_path}")
        print(f"  技术栈：后端={self.backend_type} 前端={self.frontend_type}")
        print(f"  审查范围：{self.scope}")

        files = self._get_files_to_scan()
        print(f"  待扫描文件：{len(files)} 个\n")

        for file_path in files:
            try:
                content = file_path.read_text(encoding="utf-8")
                lines = content.split("\n")
                self.files_scanned += 1

                self._check_tenant_red_lines(file_path, content, lines)
                self._check_security_vulnerabilities(file_path, content, lines)
                self._check_layer_boundaries(file_path, content, lines)
                self._check_api_standards(file_path, content, lines)
                self._check_performance_patterns(file_path, content, lines)
                self._check_code_complexity(file_path, content, lines)
                self._check_naming_conventions(file_path, content, lines)

            except Exception as e:
                print(f"  [警告] 无法扫描 {file_path}: {e}")

        return self._generate_report()

    def _generate_report(self) -> str:
        """生成 Markdown 报告"""
        now = datetime.now().strftime("%Y-%m-%d %H:%M")

        blockers = [i for i in self.issues if i.severity == "Blocker"]
        majors = [i for i in self.issues if i.severity == "Major"]
        minors = [i for i in self.issues if i.severity == "Minor"]

        # 计算评分
        score = 100
        score -= len(blockers) * 10
        score -= len(majors) * 5
        score -= len(minors) * 2
        score = max(0, score)

        if score >= 90:
            grade = "A 级（优秀）"
        elif score >= 80:
            grade = "B 级（良好）"
        elif score >= 70:
            grade = "C 级（合格）"
        elif score >= 60:
            grade = "D 级（需整改）"
        else:
            grade = "F 级（严重问题）"

        report = []
        report.append("# 代码审查报告\n")
        report.append(f"**项目路径**：{self.project_path}  ")
        report.append(f"**审查时间**：{now}  ")
        report.append(f"**审查范围**：{self.scope}（{self.files_scanned} 个文件）  ")
        report.append(f"**发现问题**：{len(self.issues)} 个（Blocker: {len(blockers)}, Major: {len(majors)}, Minor: {len(minors)}）  ")
        report.append(f"**综合评分**：{score} / 100（{grade}）\n")

        # 问题汇总
        report.append("## 问题汇总\n")
        report.append("| 严重级别 | 数量 | 典型问题 |")
        report.append("|---------|------|---------|")
        if blockers:
            report.append(f"| Blocker | {len(blockers)} | {blockers[0].category} |")
        if majors:
            report.append(f"| Major | {len(majors)} | {majors[0].category} |")
        if minors:
            report.append(f"| Minor | {len(minors)} | {minors[0].category} |")
        if not self.issues:
            report.append("| - | 0 | 无问题 |")
        report.append("")

        # 详细问题清单
        if self.issues:
            report.append("## 详细问题清单\n")

            if blockers:
                report.append("### Blocker 级问题\n")
                for i, issue in enumerate(blockers, 1):
                    report.append(f"#### {i}. {issue.category}：{issue.description}")
                    report.append(f"- **文件**：{issue.file}")
                    report.append(f"- **行号**：{issue.line}")
                    report.append(f"- **代码**：`{issue.code[:100]}`")
                    report.append(f"- **修复**：{issue.suggestion}\n")

            if majors:
                report.append("### Major 级问题\n")
                for i, issue in enumerate(majors, 1):
                    report.append(f"#### {i}. {issue.category}：{issue.description}")
                    report.append(f"- **文件**：{issue.file}")
                    report.append(f"- **行号**：{issue.line}")
                    report.append(f"- **代码**：`{issue.code[:100]}`")
                    report.append(f"- **修复**：{issue.suggestion}\n")

            if minors:
                report.append("### Minor 级问题\n")
                for i, issue in enumerate(minors[:10], 1):  # 只显示前 10 个
                    report.append(f"#### {i}. {issue.category}：{issue.description}")
                    report.append(f"- **文件**：{issue.file}")
                    report.append(f"- **行号**：{issue.line}")
                    report.append(f"- **修复**：{issue.suggestion}\n")
                if len(minors) > 10:
                    report.append(f"... 还有 {len(minors) - 10} 个 Minor 问题\n")

        # 修复建议
        report.append("## 修复建议（按优先级）\n")
        if blockers:
            report.append("### P0 - 立即修复（Blocker）\n")
            for i, issue in enumerate(blockers, 1):
                report.append(f"{i}. {issue.description}（{issue.file}:{issue.line}）")
            report.append("")
        if majors:
            report.append("### P1 - 本周修复（Major）\n")
            for i, issue in enumerate(majors, 1):
                report.append(f"{i}. {issue.description}（{issue.file}:{issue.line}）")
            report.append("")
        if minors:
            report.append("### P2 - 本月修复（Minor）\n")
            report.append(f"共 {len(minors)} 个 Minor 问题，详见上方清单\n")

        if not self.issues:
            report.append("**恭喜！代码质量优秀，无需整改。**\n")

        report.append("---\n")
        report.append(f"*报告生成时间：{now}*")

        return "\n".join(report)


def main():
    parser = argparse.ArgumentParser(
        description="AI 代码审查脚本",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例：
  python code_review.py D:/projects/ecommerce
  python code_review.py D:/projects/ecommerce --scope changed --days 7
  python code_review.py D:/projects/ecommerce --scope staged
        """
    )
    parser.add_argument("project_path", help="目标项目路径")
    parser.add_argument(
        "--scope",
        choices=["all", "changed", "staged"],
        default="all",
        help="审查范围：all（全部）、changed（最近 N 天）、staged（git 暂存区）"
    )
    parser.add_argument(
        "--days",
        type=int,
        default=7,
        help="当 scope=changed 时，扫描最近 N 天修改的文件（默认 7）"
    )
    parser.add_argument(
        "--output",
        default=None,
        help="报告输出路径（默认：docs/code-review-report.md）"
    )

    args = parser.parse_args()

    project_path = Path(args.project_path)
    if not project_path.exists():
        print(f"错误：项目路径不存在：{project_path}")
        sys.exit(1)

    reviewer = CodeReviewer(args.project_path, args.scope, args.days)
    report = reviewer.review()

    # 确定输出路径
    if args.output:
        output_path = Path(args.output)
    else:
        output_path = project_path / "docs" / "code-review-report.md"

    # 确保输出目录存在
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # 写入报告
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"\n审查完成！")
    print(f"报告已保存到：{output_path}")
    print(f"扫描文件：{reviewer.files_scanned} 个")
    print(f"发现问题：{len(reviewer.issues)} 个")

    blockers = [i for i in reviewer.issues if i.severity == "Blocker"]
    majors = [i for i in reviewer.issues if i.severity == "Major"]

    if blockers:
        print(f"\n发现 {len(blockers)} 个 Blocker 级问题，建议立即修复！")
    elif majors:
        print(f"\n发现 {len(majors)} 个 Major 级问题，建议本周修复。")
    elif reviewer.issues:
        print(f"\n发现 {len(reviewer.issues)} 个 Minor 级问题，建议本月修复。")
    else:
        print("\n代码质量优秀，无需整改！")


if __name__ == "__main__":
    main()
