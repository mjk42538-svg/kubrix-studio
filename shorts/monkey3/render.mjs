import { chromium } from 'playwright-core';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root = process.cwd();
const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
const port = srv.address().port;
const [outDir, spec] = [process.argv[2], process.argv[3]];
fs.mkdirSync(outDir, { recursive: true });
let frames = [];
for (const part of spec.split(',')) { if (part.includes('-')) { const [a, b] = part.split('-').map(Number); for (let i = a; i <= b; i++) frames.push(i); } else frames.push(Number(part)); }
if (process.env.RESUME) frames = frames.filter(f => !fs.existsSync(path.join(outDir, `f${String(f).padStart(4, '0')}.jpg`)));
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('PAGE', m.type(), m.text()); });
page.on('pageerror', e => { console.log('PAGEERR', e.message, e.stack); process.exit(1); });
await page.goto(`http://localhost:${port}/web/index.html?${process.env.QS || ''}`);
await page.waitForFunction(() => window.ready, null, { timeout: 120000 });
await page.evaluate(() => window.ready);
if (process.env.LIST) console.log(JSON.stringify(await page.evaluate(() => window.shotList())));
const t0 = Date.now(); let n = 0;
const deadline = process.env.BUDGET ? t0 + Number(process.env.BUDGET) * 1000 : Infinity;
for (const f of frames) {
  if (Date.now() > deadline) { console.log('BUDGET STOP at', f); break; }
  const url = await page.evaluate((f) => { window.renderFrame(f); return window.grab('image/jpeg', 0.93, f); }, f);
  fs.writeFileSync(path.join(outDir, `f${String(f).padStart(4, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  n++; if (n % 25 === 0) console.log(`frame ${f} (${n}/${frames.length}) ${((Date.now() - t0) / n / 1000).toFixed(2)} s/f`);
}
console.log('done', n, 'frames', ((Date.now() - t0) / Math.max(1, n) / 1000).toFixed(2), 's/f');
await browser.close(); srv.close();
