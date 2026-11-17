/**
 * check-layout.mjs — 布局骨架同构校验（纯 Node，零浏览器依赖）
 *
 * 背景：星辰展现页 index.html 只是空壳，真实布局由 app.js 的 render()/sidebar()/topbar()
 * 以字符串拼接方式渲染；组件实例页 components.html 第 1 节用静态 HTML 演示同一骨架。
 * 二者是两处独立手写，曾出现「示例与真实页面结构不同构 + 手写样式覆盖令牌」的漂移。
 *
 * 本脚本不硬编码期望结构，而是：
 *   1. 从 app.js 抽取真实骨架序列（hx-app → hx-sidebar + hx-main → hx-topbar + hx-content）
 *   2. 从 components.html 第 1 节抽取示例骨架序列
 *   3. 比对两者同构；并检查示例未用内联 width / 字符标识 / 虚构类污染令牌纪律
 * 真实页面骨架一变、示例没跟上，即报错——从机制上防漂移复发。
 *
 * 用法：node scripts/check-layout.mjs [web目录]
 *   默认：assets/presets/startech/web（相对本 skill 目录）
 * 退出码：0 全过；1 有违规。
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const skillDir = fileURLToPath(new URL('..', import.meta.url));
const webDir = process.argv[2]
  ? process.argv[2]
  : join(skillDir, 'assets', 'presets', 'startech', 'web');

let fail = 0;
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fail++; };

const appPath = join(webDir, 'app.js');
const cmpPath = join(webDir, 'components.html');

if (!existsSync(appPath) || !existsSync(cmpPath)) {
  console.log('FAIL 缺少 app.js 或 components.html：' + webDir);
  process.exit(1);
}
const app = readFileSync(appPath, 'utf8');
const cmp = readFileSync(cmpPath, 'utf8');

/* ---------- 骨架类与抽取工具 ---------- */
const FRAME = ['hx-app', 'hx-sidebar', 'hx-main', 'hx-topbar', 'hx-content'];

// 把 app.js 的 render() 字符串拼接还原成真实骨架 class 序列。
// 只解析 render() 函数体（sidebar/topbar 函数定义在它之前，全文顺序会误命中），
// 函数体里 sidebar()/topbar() 是调用占位——按骨架语义补全它们代表的 class。
function appSkeleton(src) {
  const r = src.indexOf('function render()');
  if (r < 0) return [];
  // render() 体到下一个顶层 function 之前
  const tail = src.slice(r);
  const nf = tail.indexOf('\n  function ', 10);
  const body = nf < 0 ? tail : tail.slice(0, nf);
  const seq = [];
  // 逐 token 扫：class 字面量 与 sidebar()/topbar() 调用各就各位
  const tokenRe = /class="([^"]*\bhx-(?:app|sidebar|main|topbar|content)\b[^"]*)"|(sidebar|topbar)\(\)/g;
  for (const m of body.matchAll(tokenRe)) {
    if (m[1]) {
      const hit = m[1].split(/\s+/).find(c => FRAME.includes(c));
      if (hit) seq.push(hit);
    }
    else if (m[2] === 'sidebar') seq.push('hx-sidebar');
    else if (m[2] === 'topbar') seq.push('hx-topbar');
  }
  return seq.filter(c => FRAME.includes(c));
}

// 截取 components.html 第 1 节（<!-- ============ 1 ... --> 到下一节之间）
function sectionOne(html) {
  const start = html.search(/<!--\s*=+\s*1\s/);
  if (start < 0) return '';
  const next = html.indexOf('<!-- ============ 2', start);
  return next < 0 ? html.slice(start) : html.slice(start, next);
}

// 从一段 HTML 里按标签栈抽取骨架类的「嵌套序列」。
// 输出形如 ['hx-app>hx-sidebar', 'hx-app>hx-main', 'hx-app>hx-main>hx-topbar', 'hx-app>hx-main>hx-content']
// 用栈保证嵌套关系真实，而非裸正则顺序——这样层级错了也能抓出来。
function htmlSkeleton(html) {
  const VOID = /^(img|input|br|hr|meta|link|path|circle|rect|line|polyline|polygon|ellipse|use|stop|source|area|base|col|embed|track|wbr)$/i;
  const stack = [];
  const out = [];
  // 只解析开/闭标签，跳过注释；属性里的 > 用 [^>]* 已足够覆盖本场景
  const re = /<(\/)?([a-zA-Z][\w-]*)([^>]*)>/g;
  let m;
  while ((m = re.exec(html))) {
    const closing = !!m[1];
    const tag = m[2].toLowerCase();
    if (tag === '!--' || tag === '!doctype') continue;
    if (closing) {
      // 回退到最近的同类标签
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tag) { stack.length = i; break; }
      }
      continue;
    }
    const clsM = m[3].match(/class\s*=\s*["']([^"']*)["']/i);
    const classes = clsM ? clsM[1].split(/\s+/) : [];
    const hit = classes.find(c => FRAME.includes(c));
    const path = stack.map(s => s.frame).filter(Boolean).concat(hit ? [hit] : []);
    if (hit) out.push(path.join('>'));
    const selfClose = /\/\s*$/.test(m[3]) || VOID.test(tag);
    if (!selfClose) stack.push({ tag, frame: hit || null });
  }
  return out;
}

/* ---------- 1. 骨架同构 ---------- */
const realSeq = appSkeleton(app);
const demoSeq = htmlSkeleton(sectionOne(cmp));
// 期望：真实页面骨架序列应为 app / sidebar / main / topbar / content 各一次且顺序固定
const EXPECT = ['hx-app', 'hx-sidebar', 'hx-main', 'hx-topbar', 'hx-content'];
ok(JSON.stringify(realSeq) === JSON.stringify(EXPECT),
  `app.js 真实骨架序列正确 [${realSeq.join(' → ')}]`);
// 示例骨架用「嵌套路径」表达，映射成末段 class 后应与真实序列同构
const demoLast = demoSeq.map(p => p.split('>').pop());
ok(JSON.stringify(demoLast) === JSON.stringify(EXPECT),
  `第1节示例骨架与 app.js 同构 [${demoLast.join(' → ')}]`);
// 关键：hx-topbar / hx-content 必须嵌在 hx-app>hx-main 之下（真实骨架就是如此）
ok(demoSeq.some(p => p === 'hx-app>hx-main>hx-topbar'), '顶栏嵌在 hx-app>hx-main 下');
ok(demoSeq.some(p => p === 'hx-app>hx-main>hx-content'), '内容区嵌在 hx-app>hx-main 下');
ok(!demoLast.includes('hx-body'), '无虚构的 .hx-body 类');

/* ---------- 2. 令牌纪律 ---------- */
const sec = sectionOne(cmp);
// 示例里 hx-sidebar 不得手写 width 覆盖令牌（--hx-sidebar-w: 236px）
const sidebarTag = sec.match(/<aside[^>]*class="[^"]*hx-sidebar[^"]*"[^>]*>/);
ok(sidebarTag && !/width\s*:/i.test(sidebarTag[0]), '侧栏未内联 width 覆盖令牌');
// 品牌标识必须是 SVG 且填充走 --hx-brand，不得用字符 ✦ 替代
const brandSvg = sec.match(/<svg[^>]*class="hx-brand-mark"[^>]*>[\s\S]*?fill="var\(--hx-brand\)"[\s\S]*?<\/svg>/);
ok(!!brandSvg, '品牌标识为 SVG 且 fill 走 --hx-brand');
ok(!sec.includes('✦'), '无 ✦ 字符标识');
// 顶栏 Search 等颜色不得硬编码覆盖：示例 demo 区不应出现 style="...background:#..." 形式
const inlineBg = [...sec.matchAll(/style="[^"]*background\s*:\s*#[0-9a-f]{3,8}/gi)];
ok(inlineBg.length === 0, `示例无内联硬编码背景色（发现 ${inlineBg.length} 处）`);
// 代码块骨架顺序与真实一致：hx-app → hx-sidebar → hx-main → hx-topbar → hx-content
const codeBlock = sec.match(/<pre class="pc-code">([\s\S]*?)<\/pre>/);
// 代码片段里 class 属性值被 <span> 包裹：形如 class</span>=<span class="tv">"hx-app"</span>
const codeSeq = codeBlock ? [...codeBlock[1].matchAll(/"(hx-(?:app|sidebar|main|topbar|content))"/g)].map(m => m[1]) : [];
ok(JSON.stringify(codeSeq) === JSON.stringify(EXPECT), `代码块骨架顺序正确 [${codeSeq.join(' → ')}]`);

console.log(fail === 0 ? '\nLAYOUT CHECK PASSED' : `\n${fail} LAYOUT CHECK(S) FAILED`);
process.exit(fail === 0 ? 0 : 1);
