#!/usr/bin/env node
/*
 * ブログ記事のカバー画像（1200×630）を生成する。手元（Playwright が使える環境）で実行する。
 *
 *   node scripts/make-blog-covers.cjs          … 画像がない記事だけ生成
 *   node scripts/make-blog-covers.cjs --force  … すべて作り直す
 *
 * 出力: assets/images/blog/<スラッグ>.jpg（1200×630、記事ページ・SNS共有用）
 *       assets/images/blog/<スラッグ>-sm.jpg（600×315、一覧カード用）
 * 見出しは記事メタ情報の cover.catch / cover.sub、なければタイトルから自動で作る。
 * cover.catch の「／」は改行位置（各行は途中で折り返さない）。
 * 生成した画像はコミットする（GitHub Actions の予約投稿ビルドでは画像生成を行わない）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'blog');
const OUT_DIR = path.join(ROOT, 'assets', 'images', 'blog');
const PHOTO = pathToFileURL(path.join(ROOT, 'assets', 'images', 'comparisons', 'welfare', 'disclosure.jpg')).href;
const LOGO = pathToFileURL(path.join(ROOT, 'favicon-v3-192x192.png')).href;

// カテゴリーごとの色・写真の見せ方・アイコン
const THEMES = {
  'fukushi-kiso': { name: '福祉の基礎知識', c1: '#5cc6a8', c2: '#9fe0c4', ink: '#17614c', pos: ['8% 30%', '18% 45%', '0% 60%'],
    icon: '<path d="M8 10h20a6 6 0 0 1 6 6v30a5 5 0 0 0-5-5H8z M56 10H36a6 6 0 0 0-6 6v30a5 5 0 0 1 5-5h21z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>' },
  security: { name: 'セキュリティ対策', c1: '#6aa9e0', c2: '#a9d4f2', ink: '#1f5a8c', pos: ['50% 55%', '42% 48%', '58% 60%'],
    icon: '<path d="M32 6l22 8v16c0 14-9.5 23-22 28C19.5 53 10 44 10 30V14z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M22 31l7 7 13-14" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>' },
  'hp-seisaku': { name: 'ホームページ制作の基礎', c1: '#4fbcc4', c2: '#a3e3e3', ink: '#156a70', pos: ['60% 40%', '70% 70%', '45% 35%'],
    icon: '<rect x="6" y="10" width="52" height="36" rx="5" fill="none" stroke="currentColor" stroke-width="4"/><path d="M22 54h20M32 46v8" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M16 22h20M16 30h28" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' },
  unei: { name: '集客・採用・運用', c1: '#f0a865', c2: '#f7d9a6', ink: '#8a4f12', pos: ['85% 20%', '95% 40%', '75% 15%'],
    icon: '<path d="M8 26v12h10l20 12V14L18 26z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M46 22c3 3 3 17 0 20M52 16c6 6 6 26 0 32" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' },
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function coverText(meta) {
  if (meta.cover && meta.cover.catch) return { catch: meta.cover.catch, sub: meta.cover.sub || '' };
  let [head, ...rest] = meta.title.split('｜');
  let sub = rest.join('｜');
  const q = head.indexOf('？');
  if (q > 0 && q < head.length - 1) { sub = head.slice(q + 1) + (sub ? `｜${sub}` : ''); head = head.slice(0, q + 1); }
  return { catch: head, sub };
}

function hash(s) { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }

function html(slug, meta) {
  const t = THEMES[meta.category];
  const { catch: c, sub } = coverText(meta);
  const pos = t.pos[hash(slug) % t.pos.length];
  const segs = c.split('／');
  const w = Math.max(...segs.map(x => [...x].reduce((n, ch) => n + (/[ -~]/.test(ch) ? 0.55 : 1), 0)));
  const size = w <= 7 ? 88 : w <= 9 ? 76 : w <= 11 ? 64 : 56;
  const catchHtml = segs.map(x => `<span>${esc(x)}</span>`).join('<br>');
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;font-family:"IPAGothic","IPAゴシック","WenQuanYi Zen Hei",sans-serif}
.bg{position:absolute;inset:-40px;background:url('${PHOTO}') ${pos}/cover;filter:blur(7px) saturate(1.1)}
.tint{position:absolute;inset:0;background:linear-gradient(120deg,${t.c1}e6 0%,${t.c2}b3 60%,#ffffffa0 100%)}
.panel{position:absolute;left:64px;top:64px;width:790px;height:470px;border-radius:36px;background:#ffffffeb;
  box-shadow:0 20px 50px rgba(0,0,0,.12);padding:56px 60px;display:flex;flex-direction:column}
.chip{align-self:flex-start;font-size:28px;font-weight:700;color:${t.ink};background:${t.c2}80;padding:8px 22px;border-radius:999px}
h1 span{white-space:nowrap}
h1{margin-top:30px;font-size:${size}px;line-height:1.3;color:#1f2d28;font-weight:700;letter-spacing:.01em}
p{margin-top:auto;font-size:30px;line-height:1.5;color:#4f5b56}
.icon{position:absolute;right:70px;top:150px;width:250px;height:250px;border-radius:50%;background:#ffffffd9;color:${t.ink};
  display:flex;align-items:center;justify-content:center;box-shadow:0 14px 36px rgba(0,0,0,.1)}
.icon svg{width:140px;height:140px}
.brand{position:absolute;right:58px;bottom:44px;display:flex;align-items:center;gap:12px;font-size:24px;font-weight:700;color:#1f2d28;
  background:#ffffffd9;padding:10px 20px 10px 12px;border-radius:999px}
.brand img{width:40px;height:40px;border-radius:10px}
</style></head><body>
<div class="bg"></div><div class="tint"></div>
<div class="panel"><span class="chip">${esc(t.name)}</span><h1>${catchHtml}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}</div>
<div class="icon"><svg viewBox="0 0 64 64">${t.icon}</svg></div>
<div class="brand"><img src="${LOGO}" alt="">福祉HP比較ガイド</div>
</body></html>`;
}

async function main() {
  const force = process.argv.includes('--force');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  const todo = [];
  for (const f of files) {
    const slug = f.replace(/\.md$/, '');
    const out = path.join(OUT_DIR, `${slug}.jpg`);
    if (!force && fs.existsSync(out)) continue;
    const meta = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, f), 'utf8').match(/^---json\n([\s\S]*?)\n---\n/)[1]);
    todo.push({ slug, meta, out });
  }
  if (!todo.length) { console.log('新しく作るカバー画像はありません。'); return; }
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  const small = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 0.5 });
  const tmp = path.join(OUT_DIR, '.cover.html');
  for (const { slug, meta, out } of todo) {
    fs.writeFileSync(tmp, html(slug, meta));
    await page.goto(pathToFileURL(tmp).href);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: out, type: 'jpeg', quality: 80 });
    await small.goto(pathToFileURL(tmp).href);
    await small.waitForLoadState('networkidle');
    await small.screenshot({ path: out.replace(/\.jpg$/, '-sm.jpg'), type: 'jpeg', quality: 82 });
    console.log(`作成: ${path.relative(ROOT, out)}`);
  }
  fs.rmSync(tmp, { force: true });
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
