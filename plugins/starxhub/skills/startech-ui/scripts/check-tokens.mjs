/** 校验星辰令牌 4 份副本与唯一真源字节一致。
 *  用法：node check-tokens.mjs [preset目录]
 *   默认：assets/presets/startech（相对本 skill 目录）
 *
 *  星辰令牌真源为 styles/tokens.css，机械副本分布在：
 *   styles/ · web/ · mobile/（tokens.css）与 miniapp/styles/（tokens.wxss）。
 *  任一副本与真源不一致即报错（通常由未跑 npm run sync:skills 导致）。
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const skillDir = fileURLToPath(new URL('..', import.meta.url));
const arg = process.argv[2];
const presetDir = arg ? resolve(arg) : join(skillDir, 'assets', 'presets', 'startech');

const files = [
  'styles/tokens.css',
  'web/tokens.css',
  'mobile/tokens.css',
  'miniapp/styles/tokens.wxss'
].map((f) => join(presetDir, f));

const missing = files.filter((f) => !existsSync(f));
if (missing.length) {
  console.error('[check-tokens] 以下令牌文件不存在：');
  missing.forEach((f) => console.error('  ' + f));
  process.exit(2);
}

const base = readFileSync(files[0], 'utf8');
let ok = true;
for (const file of files) {
  const same = readFileSync(file, 'utf8') === base;
  console.log(`${same ? 'OK  ' : 'FAIL'} ${file}`);
  if (!same) ok = false;
}
if (!ok) {
  console.error('[check-tokens] 令牌副本不一致，请运行 npm run sync:skills');
  process.exit(1);
}
console.log('[check-tokens] 星辰 4 份令牌副本全部一致');
