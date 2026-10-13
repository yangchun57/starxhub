#!/usr/bin/env python3
"""
PM Skills 执行脚本
加载并执行产品经理技能包中的技能
"""

import sys
import os
from pathlib import Path
from typing import Optional

# 技能类型映射
SKILL_TYPES = {
    'component': '组件技能（10-30 分钟）',
    'interactive': '交互技能（30-90 分钟）',
    'workflow': '工作流技能（数天到数周）'
}

# 常用技能别名
SKILL_ALIASES = {
    'prd': 'workflow/prd-development',
    'roadmap': 'workflow/roadmap-planning',
    'prioritize': 'interactive/prioritization-advisor',
    'story': 'component/user-story',
    'position': 'component/positioning-statement',
    'diagnose': 'interactive/business-health-diagnostic',
    'discover': 'workflow/discovery-process',
    'strategy': 'workflow/product-strategy-session',
    'interview': 'interactive/discovery-interview-prep',
    'ost': 'interactive/opportunity-solution-tree'
}


def get_skill_path(skill_name: str) -> Optional[Path]:
    """获取技能文件路径"""
    # 解析别名
    if skill_name in SKILL_ALIASES:
        skill_path = SKILL_ALIASES[skill_name]
    else:
        skill_path = skill_name
    
    # 构建完整路径
    skills_dir = Path(__file__).parent.parent / 'skills'
    
    # 尝试不同的路径格式
    candidates = [
        skills_dir / f"{skill_path}.md",
        skills_dir / skill_path / "SKILL.md",
        skills_dir / skill_path.replace('/', os.sep) / "SKILL.md"
    ]
    
    for candidate in candidates:
        if candidate.exists():
            return candidate
    
    return None


def list_skills():
    """列出所有可用技能"""
    skills_dir = Path(__file__).parent.parent / 'skills'
    
    print("\n📦 PM Skills 技能包\n")
    print("=" * 60)
    
    for skill_type, description in SKILL_TYPES.items():
        type_dir = skills_dir / skill_type
        if type_dir.exists():
            print(f"\n{skill_type.upper()} - {description}")
            print("-" * 60)
            
            skills = sorted([f.stem for f in type_dir.glob("*.md")])
            for i, skill in enumerate(skills, 1):
                print(f"  {i:2d}. {skill}")
    
    print("\n" + "=" * 60)
    print(f"\n💡 使用方式: python pm_skill.py <skill-name>")
    print(f"💡 快捷方式: python pm_skill.py prd (等同于 workflow/prd-development)")
    print(f"💡 查看所有: python pm_skill.py --list\n")


def load_skill(skill_name: str):
    """加载技能内容"""
    skill_path = get_skill_path(skill_name)
    
    if not skill_path:
        print(f"\n❌ 错误: 找不到技能 '{skill_name}'")
        print(f"\n💡 使用 --list 查看所有可用技能")
        print(f"💡 或使用快捷名称: prd, roadmap, prioritize, story, etc.\n")
        sys.exit(1)
    
    print(f"\n✅ 加载技能: {skill_path.stem}")
    print(f"📍 路径: {skill_path}")
    print("\n" + "=" * 60 + "\n")
    
    # 读取并输出技能内容
    with open(skill_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(content)
    print("\n" + "=" * 60)
    print(f"\n💡 下一步:")
    print(f"   1. 阅读技能文档，理解框架原理")
    print(f"   2. 按照执行步骤操作")
    print(f"   3. 使用输出模板生成交付物")
    print(f"   4. 检查质量清单\n")


def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("\n❌ 错误: 请提供技能名称")
        print(f"\n💡 使用方式:")
        print(f"   python pm_skill.py --list          # 查看所有技能")
        print(f"   python pm_skill.py prd             # 加载 PRD 技能")
        print(f"   python pm_skill.py prioritize      # 加载优先级顾问\n")
        sys.exit(1)
    
    arg = sys.argv[1]
    
    if arg == '--list' or arg == '-l':
        list_skills()
    else:
        load_skill(arg)


if __name__ == '__main__':
    main()
