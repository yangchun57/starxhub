#!/usr/bin/env node
/**
 * 无头 Chrome 出图 + PNG 尺寸校验
 *
 * 用法：
 *   node shoot.js <页面路径> <输出.png> [宽=1080] [高=1920] [虚拟时间预算=4000]
 *   node shoot.js --batch <清单.json>          # [{ "src": "...", "out": "...", "w":1080, "h":1920, "budget":4000 }, ...]
 *
 * 为什么需要它：
 *   1. CJK 路径必须 URL 编码，否则 Chrome 打不开本地文件；
 *   2. --force-device-scale-factor=1 必须有，否则系统缩放会改变输出像素尺寸；
 *   3. 截图后必须读 PNG IHDR 校验宽高——只截图不校验会在尺寸不对时静默产出废图。
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/* 常见 Chrome 安装位置；找得到第一个即用，也可用 CHROME_PATH 环境变量覆盖 */
function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error('找不到 Chrome，请设置环境变量 CHROME_PATH');
}

const CHROME = findChrome();

/* 读 PNG IHDR：宽在高偏移 16、高在偏移 20（大端 32 位） */
function pngSize(buf) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  if (!buf.subarray(0, 4).equals(sig)) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function toFileUrl(p) {
  const abs = path.resolve(p).replace(/\\/g, '/');
  return encodeURI('file:///' + abs);
}

function shoot(src, out, w, h, budget) {
  const absOut = path.resolve(out);
  fs.mkdirSync(path.dirname(absOut), { recursive: true });
  execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',                    /* 滚动条不入图 */
    '--allow-file-access-from-files',        /* 父页需跨文档读 iframe 内容 */
    '--force-device-scale-factor=1',         /* 固定像素比，输出尺寸才可控 */
    '--window-size=' + w + ',' + h,
    '--virtual-time-budget=' + budget,
    '--screenshot=' + absOut,
    toFileUrl(src)
  ], { stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 });

  const buf = fs.readFileSync(absOut);
  const size = pngSize(buf);
  if (!size) {
    console.log('  X  ' + path.basename(absOut) + '  不是合法 PNG');
    return false;
  }
  const ok = size.w === Number(w) && size.h === Number(h);
  console.log('  ' + (ok ? 'OK ' : 'X  ') + path.basename(absOut).padEnd(34)
    + size.w + 'x' + size.h + (ok ? '' : '  != 期望 ' + w + 'x' + h)
    + '  ' + Math.round(buf.length / 1024) + ' KB');
  return ok;
}

const argv = process.argv.slice(2);
if (!argv.length) {
  console.log('用法: node shoot.js <页面路径> <输出.png> [宽] [高] [虚拟时间预算]');
  console.log('     node shoot.js --batch <清单.json>');
  process.exit(1);
}

let tasks;
if (argv[0] === '--batch') {
  tasks = JSON.parse(fs.readFileSync(argv[1], 'utf8')).map(t => ({
    src: t.src, out: t.out,
    w: t.w || 1080, h: t.h || 1920, budget: t.budget || 4000
  }));
} else {
  tasks = [{
    src: argv[0], out: argv[1],
    w: argv[2] || 1080, h: argv[3] || 1920, budget: argv[4] || 4000
  }];
}

let bad = 0;
for (const t of tasks) {
  if (!fs.existsSync(t.src)) { console.log('  X  源文件不存在: ' + t.src); bad++; continue; }
  if (!shoot(t.src, t.out, t.w, t.h, t.budget)) bad++;
}
console.log('\n共 ' + tasks.length + ' 张，异常 ' + bad + (bad ? '  ← 需排查' : '  ✓ 全部通过'));
process.exit(bad ? 1 : 0);
