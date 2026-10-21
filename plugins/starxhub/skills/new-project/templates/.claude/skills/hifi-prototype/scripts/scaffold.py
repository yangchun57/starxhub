#!/usr/bin/env python3
"""scaffold.py — 初始化一个高保真原型项目目录。

用法:
    python3 scaffold.py <输出目录> [--name 项目名称] [--pages P1:登录,P2:看板,...] [--example] [--theme saas] [--mode hifi|wireframe]

行为:
- 复制 hifi.css / hifi.js 到输出目录
- 生成 index.html：默认基于 shell.html 骨架（含 P0 流程总览 + --pages 声明的空白工作台页）
  加 --example 则直接复制完整参考示例 example.html
- 生成 README.md 速查卡

示例:
    python3 scaffold.py ~/Desktop/proto/welfare --name "温情智选" --pages "P1:登录,P2:数据看板,P3:积分发放"
"""
import argparse
import shutil
import sys
from pathlib import Path

ASSETS = Path(__file__).resolve().parent.parent / "assets"

SIDEBAR_ITEMS = """
            <div class="side-logo"><span class="mark"><span data-icon="sparkles" class="ico-sm"></span></span><span class="name">{name}</span></div>
{items}"""

NAV_ITEM = '            <button class="nav-item{active}" data-goto="{pid_lower}"><span data-icon="{icon}"></span>{name}</button>\n'

TOPBAR = """
            <header class="topbar">
              <button class="btn btn-ghost btn-icon btn-sm topbar-menu-btn" data-sidebar-toggle data-icon="menu"></button>
              <span class="topbar-title">{title}</span>
              <span class="spacer"></span>
              <button class="btn btn-primary btn-sm" data-icon="plus">主操作</button>
            </header>
"""


def sidebar(name, pages, active_pid):
    items = ""
    for i, (pid, pname, icon) in enumerate(pages):
        items += NAV_ITEM.format(
            pid_lower=pid.lower(), name=pname, icon=icon,
            active=" is-active" if pid == active_pid else "",
        )
    return SIDEBAR_ITEMS.format(name=name, items=items)


def workbench_page(name, pid, pname, icon, pages, first):
    return f"""
      <!-- ============ {pid} · {pname} ============ -->
      <section class="page{first}" id="{pid.lower()}" data-pid="{pid}" data-title="{pname}">
        <div class="shell">
          <aside class="sidebar">
{sidebar(name, pages, pid)}
          </aside>
          <div class="main">
{TOPBAR.format(title=pname)}
            <div class="content">
              <div class="content-inner stack-lg">
                <div>
                  <h1 class="h2">{pname}</h1>
                  <p class="sub" style="margin-top:6px">页面目标：TODO —— 一句话说明本页解决什么问题。</p>
                </div>

                <div class="grid">
                  <div class="col-3 col-sm-12"><div class="stat hover-lift">
                    <div class="row-between"><span class="stat-label">指标一</span><span class="stat-icon" data-icon="chart"></span></div>
                    <div class="stat-value num" data-count-to="12800">0</div>
                    <span class="stat-delta up"><span data-icon="trending-up" class="ico-sm"></span>8.2% 环比</span>
                  </div></div>
                  <div class="col-3 col-sm-12"><div class="stat hover-lift">
                    <div class="row-between"><span class="stat-label">指标二</span><span class="stat-icon" data-icon="users"></span></div>
                    <div class="stat-value num" data-count-to="3600">0</div>
                    <span class="stat-delta down"><span data-icon="trending-down" class="ico-sm"></span>1.4% 环比</span>
                  </div></div>
                  <div class="col-6 col-sm-12"><div class="card" style="height:100%">
                    <div class="card-hd"><span class="card-title">TODO：核心内容区</span><span class="spacer"></span>
                      <button class="btn btn-secondary btn-sm" data-icon="filter">筛选</button>
                    </div>
                    <div class="card-bd stack">
                      <div class="ph" style="height:140px"><span class="ph-label">按组件规范填充内容</span></div>
                      <div class="row-wrap">
                        <button class="btn btn-primary btn-sm">主操作</button>
                        <button class="btn btn-secondary btn-sm">次操作</button>
                        <button class="btn btn-ghost btn-sm">文字</button>
                      </div>
                    </div>
                  </div></div>
                </div>

                <div class="card">
                  <div class="card-bd"><span class="skeleton sk-line"></span><span class="skeleton sk-line" style="width:70%"></span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
"""


def overview_page(name, pages):
    cards = ""
    icons_pool = ["lock", "chart", "gift", "cart", "layers", "zap", "sparkles", "target", "users"]
    for i, (pid, pname, _icon) in enumerate(pages):
        cards += f"""
              <div class="col-4 col-sm-12"><div class="card card-hover card-click" data-goto="{pid.lower()}" style="height:100%">
                <div class="card-bd stack">
                  <div class="row"><span class="stat-icon" data-icon="{icons_pool[i % len(icons_pool)]}"></span><span class="tag tag-brand">{pid}</span></div>
                  <div class="h4">{pname}</div>
                  <p class="xs">TODO —— 一句话说明本页解决什么问题、包含哪些关键模块。</p>
                </div>
              </div></div>"""
    steps = ""
    for i, (pid, pname, _icon) in enumerate(pages[:5]):
        cur = ' current' if i == 2 else (' done' if i < 2 else '')
        inner = '<span data-icon="check"></span>' if i < 2 else str(i + 1)
        steps += f"""
                  <div class="step{cur}"><div class="pt">{inner}</div><div class="st-name">{pname}</div></div>"""
    return f"""
      <!-- ============ P0 · 流程总览 ============ -->
      <section class="page is-active" id="p0" data-pid="P0" data-title="流程总览">
        <div class="content">
          <div class="content-inner stack-lg">
            <div>
              <h1 class="h1">{name}</h1>
              <p class="sub" style="margin-top:8px">高保真原型 · 点击卡片进入页面；顶部可切换设备（桌面/平板/手机）与主题（4 套设计系统）。</p>
            </div>
            <div class="grid">{cards}
            </div>
            <div class="card">
              <div class="card-hd"><span class="card-title">核心任务流</span><span class="spacer"></span><span class="tag tag-outline">TODO 版本号</span></div>
              <div class="card-bd">
                <div class="steps">{steps}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("outdir")
    ap.add_argument("--name", default="产品原型")
    ap.add_argument("--pages", default="P1:登录:lock,P2:数据看板:chart",
                    help='页面清单 "P1:登录:lock,P2:看板:chart"（冒号第三段为图标名，可省略）')
    ap.add_argument("--theme", default="saas", choices=["saas", "mobile", "commerce", "brand"])
    ap.add_argument("--mode", default="hifi", choices=["hifi", "wireframe"],
                    help="wireframe = 线框模式（黑白灰结构稿，可在页面里随时切回）")
    ap.add_argument("--example", action="store_true", help="直接生成完整参考示例")
    a = ap.parse_args()

    out = Path(a.outdir).expanduser().resolve()
    out.mkdir(parents=True, exist_ok=True)
    for f in ("hifi.css", "hifi.js"):
        shutil.copy(ASSETS / f, out / f)

    if a.example:
        shutil.copy(ASSETS / "example.html", out / "index.html")
        (out / "README.md").write_text(
            f"# {a.name} · 高保真原型（参考示例）\n\n"
            "打开 index.html 查看。包含 P0-P8 十个页面：登录 / 看板 / 表格 / 商城 /\n"
            "异常态 / 移动端 / 组件规范 / 品牌官网，以及弹窗、抽屉、底部面板、下拉菜单。\n\n"
            "改造方式：按 P0 卡片逐页替换为真实内容，删除多余页面即可。\n",
            encoding="utf-8",
        )
        print(f"示例原型已生成：{out / 'index.html'}")
        return

    pages = []
    for chunk in a.pages.split(","):
        chunk = chunk.strip()
        if not chunk:
            continue
        parts = chunk.split(":")
        pid = parts[0].strip()
        pname = parts[1].strip() if len(parts) > 1 and parts[1].strip() else pid
        icon = parts[2].strip() if len(parts) > 2 and parts[2].strip() else "grid"
        pages.append((pid, pname, icon))
    if not pages:
        pages = [("P1", "首页", "home")]

    shell = (ASSETS / "shell.html").read_text(encoding="utf-8")
    head, _, _ = shell.partition("<!-- PAGES -->")
    tail = "\n      </div><!-- /app -->\n    </div>\n  </div>\n</div>\n<script src=\"hifi.js\"></script>\n</body>\n</html>\n"

    body = head.replace("{PROJECT_NAME}", a.name).replace("{PROJECT_NAME}", a.name)
    body = body.replace('data-theme="saas"', f'data-theme="{a.theme}"')
    if a.mode == "wireframe":
        body = body.replace('<div class="app" data-theme=',
                            '<div class="app" data-mode="wireframe" data-theme=')
        body = body.replace('data-mode-btn="hifi" class="is-on"', 'data-mode-btn="hifi"')
        body = body.replace('data-mode-btn="wireframe"', 'data-mode-btn="wireframe" class="is-on"')
    # 默认激活态移交给第一个业务页之前的 P0
    body += overview_page(a.name, pages)
    for i, (pid, pname, icon) in enumerate(pages):
        body += workbench_page(a.name, pid, pname, icon, pages, "" if i else "")

    # P0 为默认激活页：移除 shell 中模板激活类冲突
    body = body.replace('<section class="page is-active" id="p0"', '<section class="page is-active" id="p0"')
    body += tail
    # 主题点激活态
    body = body.replace('class="theme-dot is-on" data-theme-dot="saas"', 'class="theme-dot{ON}" data-theme-dot="saas"')
    body = body.replace('{ON}', " is-on" if a.theme == "saas" else "")
    for t in ("mobile", "commerce", "brand"):
        if a.theme == t:
            body = body.replace(f'class="theme-dot" data-theme-dot="{t}"', f'class="theme-dot is-on" data-theme-dot="{t}"')

    (out / "index.html").write_text(body, encoding="utf-8")
    (out / "README.md").write_text(
        f"# {a.name} · 高保真原型\n\n"
        f"页面数：{len(pages) + 1}（含 P0 流程总览）· 主题：{a.theme}\n\n"
        "## 速查\n"
        "- 打开 index.html；顶部舞台条可切 桌面/平板/手机、4 套主题、高保真/线框模式\n"
        "- 跳转：`data-goto=\"页面id\"`；返回：`data-back`\n"
        "- 弹窗：`data-modal-open=\"#id\"`；抽屉：`data-drawer-open=\"#id\"`；底部面板：`data-sheet-open=\"#id\"`；关闭：`data-close`\n"
        "- 下拉菜单：`data-menu-open=\"#id\"`；轻提示：`data-toast=\"文案\"`\n"
        "- 表单校验：`<form data-validate>` + `data-required / data-type / data-min`\n"
        "- 数字滚动：`data-count-to=\"1280\"`；进度：`data-progress=\"72\"`；倒计时：`data-countdown=\"3600\"`\n"
        "- 图标：`data-icon=\"名称\"`（内置 60+ 线性图标，清单见 references/component-spec.md）\n"
        "- 完整组件示例见 skill 的 assets/example.html\n",
        encoding="utf-8",
    )
    print(f"原型已生成：{out / 'index.html'}")
    print("页面：P0 流程总览 + " + ", ".join(f"{p} {n}" for p, n, _ in pages))
    print(f"主题：{a.theme} · 模式：{a.mode}")


if __name__ == "__main__":
    sys.exit(main())
