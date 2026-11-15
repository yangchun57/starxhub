#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
项目健康度巡检脚本

扫描目标项目的 .claude/ 配置完整性、Agent 与技术栈匹配度、rules 覆盖度、
多租户红线风险、测试覆盖率、CI 脚本存在性等，输出结构化 Markdown 报告。

用法：
    python health_check.py <目标项目路径> [--output <报告输出路径>]

示例：
    python health_check.py D:/projects/ecommerce
    python health_check.py D:/projects/ecommerce --output docs/my-report.md
"""

import argparse
import os
import re
import sys
from datetime import datetime
from pathlib import Path


class HealthChecker:
    """项目健康度检查器"""

    def __init__(self, project_path: str):
        self.project_path = Path(project_path).resolve()
        self.claude_dir = self.project_path / ".claude"
        self.results = []
        self.score = 100
        self.blockers = []
        self.majors = []
        self.minors = []

    def check(self):
        """执行所有检查"""
        print(f"开始巡检项目：{self.project_path}\n")

        self._check_claude_config()
        self._check_agents()
        self._check_rules()
        self._check_standards()
        self._check_hooks()
        self._check_claude_md()
        self._check_tenant_red_lines()
        self._check_tests()
        self._check_ci_scripts()

        return self._generate_report()

    def _add_result(self, dimension: str, status: str, message: str, score_impact: int = 0):
        """添加检查结果"""
        self.results.append({
            "dimension": dimension,
            "status": status,  # PASS / WARN / FAIL
            "message": message,
            "score_impact": score_impact
        })
        self.score -= score_impact

        if score_impact > 0:
            if score_impact >= 5:
                self.blockers.append(f"{dimension}: {message}")
            elif score_impact >= 3:
                self.majors.append(f"{dimension}: {message}")
            else:
                self.minors.append(f"{dimension}: {message}")

    def _check_claude_config(self):
        """检查 1: .claude/ 配置完整性"""
        dimension = ".claude/ 配置完整性"
        required_items = [
            ("settings.json", "settings.json 配置文件"),
            ("agents", "agents/ 目录"),
            ("commands", "commands/ 目录"),
            ("hooks", "hooks/ 目录"),
            ("rules", "rules/ 目录")
        ]

        missing = []
        for item, desc in required_items:
            item_path = self.claude_dir / item
            if not item_path.exists():
                missing.append(desc)

        if missing:
            self._add_result(
                dimension,
                "FAIL",
                f"缺少：{', '.join(missing)}",
                score_impact=len(missing) * 3
            )
        else:
            self._add_result(dimension, "PASS", "所有必需配置项完整", 0)

    def _check_agents(self):
        """检查 2: Agent 定义与技术栈匹配"""
        dimension = "Agent 定义与技术栈匹配"
        agents_dir = self.claude_dir / "agents"

        if not agents_dir.exists():
            self._add_result(dimension, "FAIL", "agents/ 目录不存在", 15)
            return

        agent_files = list(agents_dir.glob("*.md"))
        agent_count = len(agent_files)

        # 期望 24 个 Agent
        expected_count = 24
        if agent_count < expected_count:
            missing = expected_count - agent_count
            self._add_result(
                dimension,
                "WARN",
                f"Agent 数量不足：{agent_count}/{expected_count}（缺少 {missing} 个）",
                score_impact=missing
            )
        else:
            self._add_result(dimension, "PASS", f"Agent 数量达标：{agent_count} 个", 0)

        # 检查关键 Agent 的 model 配置
        critical_agents = ["architect", "requirement-analyst", "reviewer", "pm"]
        model_issues = []

        for agent_name in critical_agents:
            agent_file = agents_dir / f"{agent_name}.md"
            if agent_file.exists():
                content = agent_file.read_text(encoding="utf-8")
                # 检查 model 字段
                if "model: sonnet" in content.lower():
                    model_issues.append(f"{agent_name} 使用 sonnet（建议 opus）")

        if model_issues:
            self._add_result(
                dimension,
                "WARN",
                f"关键 Agent model 配置不当：{'; '.join(model_issues[:3])}",
                score_impact=len(model_issues) * 2
            )

    def _check_rules(self):
        """检查 3: rules 覆盖度"""
        dimension = "rules 覆盖度"
        rules_dir = self.claude_dir / "rules"

        if not rules_dir.exists():
            self._add_result(dimension, "FAIL", "rules/ 目录不存在", 10)
            return

        # 检查通用规则（_always）
        always_rules = ["workflow.md", "database.md", "git.md"]
        missing_always = [r for r in always_rules if not (rules_dir / r).exists()]

        if missing_always:
            self._add_result(
                dimension,
                "WARN",
                f"缺少通用规则：{', '.join(missing_always)}",
                score_impact=len(missing_always) * 3
            )
        else:
            self._add_result(dimension, "PASS", "通用规则完整", 0)

        # 检查后端/前端规则（至少有一个）
        backend_rules = list(rules_dir.glob("backend-*.md"))
        frontend_rules = list(rules_dir.glob("frontend-*.md"))

        if not backend_rules and not frontend_rules:
            self._add_result(
                dimension,
                "WARN",
                "缺少后端/前端规则",
                score_impact=4
            )

    def _check_standards(self):
        """检查 4: standards 存在性"""
        dimension = "standards 存在性"
        standards_dir = self.claude_dir / "standards"

        if not standards_dir.exists():
            self._add_result(dimension, "WARN", "standards/ 目录不存在", 2)
            return

        # 检查是否有规范文件
        std_files = list(standards_dir.glob("*.md"))
        if len(std_files) < 2:
            self._add_result(
                dimension,
                "WARN",
                f"规范文件不足：{len(std_files)} 个（建议至少 2 个）",
                score_impact=2
            )
        else:
            self._add_result(dimension, "PASS", f"规范文件完整：{len(std_files)} 个", 0)

        # 检查 topics 索引
        topics_dir = standards_dir / "topics"
        if not topics_dir.exists():
            self._add_result(
                dimension,
                "WARN",
                "topics/ 索引目录不存在（可运行 split-standards.py 生成）",
                score_impact=1
            )

    def _check_hooks(self):
        """检查 5: hooks 配置"""
        dimension = "hooks 配置"
        hooks_dir = self.claude_dir / "hooks"

        if not hooks_dir.exists():
            self._add_result(dimension, "FAIL", "hooks/ 目录不存在", 10)
            return

        required_hooks = [
            "pre_commit_guard.py",
            "tenant_guard.py"
        ]

        missing = []
        not_executable = []

        for hook_name in required_hooks:
            hook_path = hooks_dir / hook_name
            if not hook_path.exists():
                missing.append(hook_name)
            elif os.name != "nt":  # 非 Windows 系统检查执行权限
                if not os.access(hook_path, os.X_OK):
                    not_executable.append(hook_name)

        if missing:
            self._add_result(
                dimension,
                "FAIL",
                f"缺少 hook 文件：{', '.join(missing)}",
                score_impact=len(missing) * 5
            )

        if not_executable:
            self._add_result(
                dimension,
                "WARN",
                f"hook 文件不可执行：{', '.join(not_executable)}（运行 chmod +x）",
                score_impact=len(not_executable) * 3
            )

        if not missing and not not_executable:
            self._add_result(dimension, "PASS", "hooks 配置完整且可执行", 0)

    def _check_claude_md(self):
        """检查 6: CLAUDE.md TODO 完成度"""
        dimension = "CLAUDE.md TODO 完成度"
        claude_md = self.project_path / "CLAUDE.md"

        if not claude_md.exists():
            self._add_result(dimension, "FAIL", "CLAUDE.md 不存在", 15)
            return

        content = claude_md.read_text(encoding="utf-8")

        # 检查 TODO 占位符
        todo_patterns = [
            r"TODO.*项目速览",
            r"TODO.*红线",
            r"TODO.*技术栈",
            r"\{\{PROJECT_NAME\}\}",
            r"\{\{PROJECT_DESC\}\}"
        ]

        unfilled_todos = []
        for pattern in todo_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                unfilled_todos.append(pattern)

        if unfilled_todos:
            self._add_result(
                dimension,
                "FAIL",
                f"发现 {len(unfilled_todos)} 个未填写的 TODO 项",
                score_impact=len(unfilled_todos) * 3
            )
        else:
            self._add_result(dimension, "PASS", "CLAUDE.md 关键信息已填写", 0)

    def _check_tenant_red_lines(self):
        """检查 7: 多租户红线扫描"""
        dimension = "多租户红线扫描"

        # 扫描后端代码中的潜在红线
        backend_dirs = [
            self.project_path / "src" / "backend" / "api",
            self.project_path / "src" / "backend"
        ]

        red_line_patterns = [
            # SQL 查询无 tenant_id 过滤
            (r"\.Where\(.*\)\s*\.ToList\(\)", "可能存在无租户过滤的查询"),
            (r"SELECT.*FROM.*WHERE(?!.*tenant)", "SQL 可能缺少 tenant_id 过滤"),
            # 直接访问其他租户数据
            r"TenantId\s*=\s*\d+",  # 硬编码租户 ID
        ]

        issues = []
        checked_files = 0

        for backend_dir in backend_dirs:
            if not backend_dir.exists():
                continue

            for cs_file in backend_dir.rglob("*.cs"):
                checked_files += 1
                try:
                    content = cs_file.read_text(encoding="utf-8")

                    # 检查 SQL 查询是否带 tenant_id
                    if re.search(r"\.Where\(", content) and not re.search(r"TenantId", content):
                        # 找到 Where 但没有 TenantId 的文件
                        lines = content.split("\n")
                        for i, line in enumerate(lines, 1):
                            if re.search(r"\.Where\(.*\)\s*\.ToList\(\)", line):
                                issues.append(f"{cs_file.relative_to(self.project_path)}:{i}")
                                break

                except Exception:
                    pass

        if issues:
            self._add_result(
                dimension,
                "FAIL",
                f"发现 {len(issues)} 处潜在红线风险（文件：{', '.join(issues[:3])}）",
                score_impact=min(len(issues) * 5, 15)
            )
        elif checked_files == 0:
            self._add_result(dimension, "PASS", "未检测到后端代码（跳过检查）", 0)
        else:
            self._add_result(dimension, "PASS", f"已检查 {checked_files} 个文件，未发现红线风险", 0)

    def _check_tests(self):
        """检查 8: 测试文件存在性"""
        dimension = "测试文件存在性"

        test_dirs = [
            self.project_path / "tests",
            self.project_path / "src" / "backend" / "api" / "tests",
            self.project_path / "src" / "backend" / "tests"
        ]

        test_files = []
        for test_dir in test_dirs:
            if test_dir.exists():
                test_files.extend(test_dir.rglob("*test*.py"))
                test_files.extend(test_dir.rglob("*test*.cs"))
                test_files.extend(test_dir.rglob("*Test*.cs"))

        test_count = len(test_files)

        if test_count == 0:
            self._add_result(
                dimension,
                "WARN",
                "未发现测试文件",
                score_impact=5
            )
        elif test_count < 5:
            self._add_result(
                dimension,
                "WARN",
                f"测试文件不足：{test_count} 个（建议至少 5 个）",
                score_impact=3
            )
        else:
            self._add_result(dimension, "PASS", f"测试文件完整：{test_count} 个", 0)

    def _check_ci_scripts(self):
        """检查 9: CI 脚本存在性"""
        dimension = "CI 脚本存在性"

        ci_sh = self.project_path / "scripts" / "ci.sh"
        pre_push = self.project_path / ".githooks" / "pre-push"

        missing = []

        if not ci_sh.exists():
            missing.append("scripts/ci.sh")

        if not pre_push.exists():
            missing.append(".githooks/pre-push")

        if missing:
            self._add_result(
                dimension,
                "WARN",
                f"缺少 CI 脚本：{', '.join(missing)}",
                score_impact=len(missing) * 2
            )
        else:
            # 检查可执行权限
            not_executable = []
            if os.name != "nt":
                if not os.access(ci_sh, os.X_OK):
                    not_executable.append("ci.sh")
                if not os.access(pre_push, os.X_OK):
                    not_executable.append("pre-push")

            if not_executable:
                self._add_result(
                    dimension,
                    "WARN",
                    f"CI 脚本不可执行：{', '.join(not_executable)}",
                    score_impact=2
                )
            else:
                self._add_result(dimension, "PASS", "CI 脚本完整且可执行", 0)

    def _generate_report(self) -> str:
        """生成 Markdown 格式报告"""
        now = datetime.now().strftime("%Y-%m-%d %H:%M")

        # 确定等级
        if self.score >= 90:
            grade = "A 级（优秀）"
        elif self.score >= 80:
            grade = "B 级（良好）"
        elif self.score >= 70:
            grade = "C 级（合格，需改进）"
        elif self.score >= 60:
            grade = "D 级（不合格，需立即整改）"
        else:
            grade = "F 级（严重问题）"

        report = []
        report.append("# 项目健康度巡检报告\n")
        report.append(f"**项目路径**：{self.project_path}  ")
        report.append(f"**巡检时间**：{now}  ")
        report.append(f"**总体评分**：{max(0, self.score)} / 100（{grade}）\n")

        # 问题汇总
        report.append("## 问题汇总\n")
        report.append("| 严重级别 | 数量 | 问题清单 |")
        report.append("|---------|------|---------|")

        if self.blockers:
            report.append(f"| Blocker | {len(self.blockers)} | {self.blockers[0][:50]}... |")
        if self.majors:
            report.append(f"| Major | {len(self.majors)} | {self.majors[0][:50]}... |")
        if self.minors:
            report.append(f"| Minor | {len(self.minors)} | {self.minors[0][:50]}... |")

        if not (self.blockers or self.majors or self.minors):
            report.append("| - | 0 | 无问题 |")

        report.append("")

        # 详细检查结果
        report.append("## 详细检查结果\n")

        current_dimension = None
        for result in self.results:
            if result["dimension"] != current_dimension:
                current_dimension = result["dimension"]
                status_icon = {
                    "PASS": "[PASS]",
                    "WARN": "[WARN]",
                    "FAIL": "[FAIL]"
                }.get(result["status"], "[?]")
                report.append(f"### {current_dimension} {status_icon}\n")

            report.append(f"- {result['message']}")
            if result["score_impact"] > 0:
                report.append(f"  - 扣分：-{result['score_impact']}")
            report.append("")

        # 整改建议
        report.append("## 整改建议（按优先级）\n")

        if self.blockers:
            report.append("### P0 - 立即修复（Blocker）\n")
            for i, blocker in enumerate(self.blockers, 1):
                report.append(f"{i}. **{blocker}**")
                report.append(f"   - 严重级别：Blocker")
                report.append(f"   - 建议：立即修复，可能影响项目正常运行\n")

        if self.majors:
            report.append("### P1 - 本周修复（Major）\n")
            for i, major in enumerate(self.majors, 1):
                report.append(f"{i}. **{major}**")
                report.append(f"   - 严重级别：Major")
                report.append(f"   - 建议：本周内修复，影响开发效率\n")

        if self.minors:
            report.append("### P2 - 本月修复（Minor）\n")
            for i, minor in enumerate(self.minors, 1):
                report.append(f"{i}. **{minor}**")
                report.append(f"   - 严重级别：Minor")
                report.append(f"   - 建议：本月内修复，属于最佳实践\n")

        if not (self.blockers or self.majors or self.minors):
            report.append("**恭喜！项目健康度优秀，无需整改。**\n")

        # 自动修复建议
        report.append("## 可自动修复的问题\n")
        auto_fixable = []

        if any("hook 文件不可执行" in r["message"] for r in self.results):
            auto_fixable.append("- [ ] hooks 文件不可执行（运行 `chmod +x .claude/hooks/*.py`）")

        if any("CI 脚本不可执行" in r["message"] for r in self.results):
            auto_fixable.append("- [ ] CI 脚本不可执行（运行 `chmod +x scripts/ci.sh .githooks/pre-push`）")

        if any("topics/ 索引目录不存在" in r["message"] for r in self.results):
            auto_fixable.append("- [ ] standards topics 索引未生成（运行 `python scripts/split-standards.py .claude/standards`）")

        if auto_fixable:
            for item in auto_fixable:
                report.append(item)
        else:
            report.append("无可自动修复的问题。")

        report.append("")
        report.append("---\n")
        report.append(f"*报告生成时间：{now}*")

        return "\n".join(report)


def main():
    parser = argparse.ArgumentParser(
        description="项目健康度巡检脚本",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例：
  python health_check.py D:/projects/ecommerce
  python health_check.py D:/projects/ecommerce --output docs/my-report.md
        """
    )
    parser.add_argument("project_path", help="目标项目路径")
    parser.add_argument(
        "--output",
        default=None,
        help="报告输出路径（默认：docs/health-check-report.md）"
    )

    args = parser.parse_args()

    project_path = Path(args.project_path)
    if not project_path.exists():
        print(f"错误：项目路径不存在：{project_path}")
        sys.exit(1)

    if not (project_path / ".claude").exists():
        print(f"警告：未检测到 .claude/ 目录，这可能不是一个星枢项目")
        response = input("是否继续检查？(y/N): ").strip().lower()
        if response != "y":
            sys.exit(0)

    checker = HealthChecker(args.project_path)
    report = checker.check()

    # 确定输出路径
    if args.output:
        output_path = Path(args.output)
    else:
        output_path = project_path / "docs" / "health-check-report.md"

    # 确保输出目录存在
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # 写入报告
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"\n巡检完成！")
    print(f"报告已保存到：{output_path}")
    print(f"总体评分：{max(0, checker.score)} / 100")

    if checker.blockers:
        print(f"\n发现 {len(checker.blockers)} 个 Blocker 级问题，建议立即修复！")
    elif checker.majors:
        print(f"\n发现 {len(checker.majors)} 个 Major 级问题，建议本周修复。")
    elif checker.minors:
        print(f"\n发现 {len(checker.minors)} 个 Minor 级问题，建议本月修复。")
    else:
        print("\n项目健康度优秀，无需整改！")


if __name__ == "__main__":
    main()
