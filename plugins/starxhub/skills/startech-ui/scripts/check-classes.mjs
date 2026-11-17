/**
 * 星辰专用：扫描模板里使用的 hx-* / st-* 类是否都在 CSS / WXSS 中有定义。
 * 用法：
 *   node check-classes.mjs <target-dir> [--prefix hx|st] [--css <file> ...]
 *   <target-dir> 默认当前工作目录；未给 --css 时用本 skill 的 startech/styles 令牌 + common + components。
 * 退出码：0 = 无缺失；1 = 有未定义类；2 = CSS 不存在。
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const cssOverride = [];
let prefix = 'hx';
let target = process.cwd();
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--css') {
    if (!args[i + 1] || args[i + 1].startsWith('--')) { console.error('[check-classes] --css 缺少文件路径'); process.exit(2); }
    cssOverride.push(args[++i]);
  } else if (args[i] === '--prefix') {
    if (!args[i + 1] || args[i + 1].startsWith('--')) { console.error('[check-classes] --prefix 缺少取值'); process.exit(2); }
    prefix = args[++i].replace(/^-+/, '');
  } else if (!args[i].startsWith('--')) target = resolve(args[i]);
}

const skillDir = fileURLToPath(new URL('..', import.meta.url));
// 星辰令牌层用无前缀文件名（tokens.css），定义在 styles/。
// 定义源必须含令牌层：部分状态类（如 hx-danger-dot）定义在 tokens.css。
const stylesDir = join(skillDir, 'assets', 'presets', 'startech', 'styles');
const defaultCss = ['tokens', 'common', 'components'].map((b) => join(stylesDir, `${b}.css`));
const cssFiles = cssOverride.length ? cssOverride.map((f) => resolve(f)) : defaultCss;

const TEMPLATE_EXT = /\.(html|vue|jsx|tsx|js|ts|wxml|md)$/i;
const CLASS_USE = /(?:class(?:Name)?\s*=\s*["'`])([^"'`]+)["'`]/g;
const PREFIX_RE = new RegExp(`\\.(${prefix}-[a-z0-9-]+)`, 'g');
const USE_RE = new RegExp(`^${prefix}-`, '');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'dist') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (TEMPLATE_EXT.test(name)) out.push(p);
  }
  return out;
}

const defined = new Set();
const definedPerFile = new Map();
for (const f of cssFiles) {
  if (!existsSync(f)) {
    console.error(`[check-classes] CSS 不存在：${f}`);
    process.exit(2);
  }
  const css = readFileSync(f, 'utf8');
  const before = defined.size;
  for (const m of css.matchAll(PREFIX_RE)) defined.add(m[1]);
  definedPerFile.set(f, defined.size - before);
}

const files = existsSync(target) && statSync(target).isDirectory() ? walk(target) : [target];

// Inline <style> blocks in templates are also valid class definitions.
// The showcase pages define sparkline layout classes this way.
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  for (const block of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    for (const m of block[1].matchAll(PREFIX_RE)) defined.add(m[1]);
  }
}

const used = new Map();
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(CLASS_USE)) {
    for (const cls of m[1].split(/\s+/)) {
      if (!USE_RE.test(cls)) continue;
      // Drop string-concat fragments from JS templates, e.g. 'hx-tag--' + tone.
      // A trailing double-hyphen cannot be a complete BEM modifier.
      if (/--$/.test(cls)) continue;
      if (!used.has(cls)) used.set(cls, new Set());
      used.get(cls).add(relative(target, f) || f);
    }
  }
}

const missing = [...used.keys()].filter((c) => !defined.has(c)).sort();
for (const f of cssFiles) console.log(`[check-classes] 定义源：${relative(process.cwd(), f)}（${definedPerFile.get(f)} 个 ${prefix}-* 类）`);
console.log(`[check-classes] 前缀 ${prefix}-* ｜ 扫描 ${files.length} 个文件，使用 ${used.size} 个类`);
if (missing.length) {
  for (const c of missing) console.log(`MISS  ${c}  ← ${[...used.get(c)].join(', ')}`);
  console.error(`[check-classes] 发现 ${missing.length} 个未定义类`);
  process.exit(1);
}
console.log('[check-classes] 全部使用类均有定义');
