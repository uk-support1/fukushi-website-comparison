#!/usr/bin/env node
/*
 * ブログ（お役立ち記事）静的生成スクリプト
 *
 *   node scripts/build-blog.cjs
 *
 * content/blog/*.md を読み込み、次のファイルを生成する。
 *   blog/index.html                 記事一覧
 *   blog/category/<slug>/index.html カテゴリー別一覧
 *   blog/<slug>/index.html          各記事
 *   about/index.html                運営者情報・編集方針
 *   sitemap.xml                     サイト全体（既存ページ＋ブログ）
 *
 * 記事ファイルの書式は docs/blog-writing-guide.md を参照。
 * 外部ライブラリは使用しない（Node.js 18以上のみで動作）。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'blog');
const BASE = 'https://fukushi-hp-hikaku.com/';
const SITE = '福祉ホームページ制作比較ガイド';
const EDITOR = '福祉ホームページ制作比較ガイド編集部';
const ANALYTICS = require(path.join(ROOT, 'assets', 'data', 'b-type-content.json')).analytics;

const CATEGORIES = [
  { slug: 'fukushi-kiso', name: '福祉の基礎知識', desc: '障害福祉サービスの種類や制度、報酬改定など、事業所運営とホームページづくりの前提になる基礎知識をまとめています。' },
  { slug: 'security', name: 'セキュリティ対策', desc: 'ホームページの改ざん・乗っ取り、ランサムウェア、個人情報の漏えいなど、福祉事業所が知っておきたいサイバー攻撃の動向と対策を解説します。' },
  { slug: 'hp-seisaku', name: 'ホームページ制作の基礎', desc: '費用相場、載せるべき内容、制作会社の選び方など、福祉事業所がホームページを作るときに役立つ情報をまとめています。' },
  { slug: 'unei', name: '集客・採用・運用', desc: '利用者の獲得、職員採用、Googleマップ対策など、公開後のホームページを成果につなげるための運用ノウハウを紹介します。' },
];
const CAT = Object.fromEntries(CATEGORIES.map(c => [c.slug, c]));

// 公開日（date）が今日（日本時間）より後の記事は「予約投稿」として生成しない。
// GitHub Actions（.github/workflows/scheduled-publish.yml）が毎日ビルドし直して公開する。
// BUILD_DATE=YYYY-MM-DD を指定すると、その日付時点でビルドできる。
const TODAY = process.env.BUILD_DATE || new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
let PUBLISHED = new Set(); // 公開済み記事のスラッグ（本文リンクの判定に使う）

// 業種別の比較記事（assets/data/comparisons.json で管理。トップページのカード・記事内の導線・サイトマップに使う）
const COMPARISONS = require(path.join(ROOT, 'assets', 'data', 'comparisons.json')).map(c => ({ ...c, href: c.file }));

/* -------------------------------------------------------------------------
 * ユーティリティ
 * ---------------------------------------------------------------------- */
// 記事のカバー画像（scripts/make-blog-covers.cjs で生成）。ない場合はロゴを使う
const coverPath = slug => fs.existsSync(path.join(ROOT, 'assets', 'images', 'blog', `${slug}.jpg`)) ? `assets/images/blog/${slug}.jpg` : null;
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonLd = obj => `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2).replace(/</g, '\\u003c')}\n</script>`;
const fmtDate = d => { const [y, m, dd] = d.split('-').map(Number); return `${y}年${m}月${dd}日`; };
function writeFile(rel, html) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

/* -------------------------------------------------------------------------
 * Markdown（必要な記法のみの簡易変換）
 *   ## / ### 見出し、段落、- 箇条書き、1. 番号付き、| 表 |、> 引用
 *   :::point / :::warn / :::check / :::info タイトル … ::: 囲みボックス
 *   **強調**、[リンク](URL)
 * ---------------------------------------------------------------------- */
function inline(text, prefix) {
  let s = esc(text);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
    const raw = url.replace(/&amp;/g, '&');
    if (/^https?:\/\//.test(raw)) return `<a href="${esc(raw)}" target="_blank" rel="noopener">${label}</a>`;
    // サイト内リンクは "/" 始まりで書き、ページ位置からの相対パスに変換する
    const m2 = raw.match(/^\/blog\/([a-z0-9-]+)\/$/);
    if (m2 && !PUBLISHED.has(m2[1])) return label; // 予約投稿中の記事へのリンクは公開まで文字のみ
    const rel = raw.startsWith('/') ? prefix + raw.slice(1) : raw;
    return `<a href="${esc(rel)}">${label}</a>`;
  });
  return s;
}

function markdown(src, prefix) {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  const toc = [];
  let i = 0;
  let h2n = 0;
  const para = [];
  const flush = () => { if (para.length) { out.push(`<p>${inline(para.join(''), prefix)}</p>`); para.length = 0; } };

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t) { flush(); i++; continue; }

    let m;
    if ((m = t.match(/^:::(point|warn|check|info)\s*(.*)$/))) {
      flush();
      const body = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') body.push(lines[i++]);
      i++;
      const label = { point: 'ポイント', warn: '注意', check: 'チェック', info: '補足' }[m[1]];
      const title = m[2] || label;
      const inner = markdown(body.join('\n'), prefix).html;
      out.push(`<div class="blog-box blog-box--${m[1]}"><p class="blog-box__title">${inline(title, prefix)}</p>${inner}</div>`);
      continue;
    }
    if ((m = t.match(/^(##|###)\s+(.+)$/))) {
      flush();
      if (m[1] === '##') {
        h2n++;
        const id = `sec-${h2n}`;
        toc.push({ id, text: m[2] });
        out.push(`<h2 id="${id}">${inline(m[2], prefix)}</h2>`);
      } else {
        out.push(`<h3>${inline(m[2], prefix)}</h3>`);
      }
      i++;
      continue;
    }
    if (t.startsWith('|')) {
      flush();
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(lines[i++].trim());
      const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cells(rows[0]);
      const bodyRows = rows.slice(rows[1] && /^\|?\s*:?-{2,}/.test(rows[1]) ? 2 : 1);
      out.push('<div class="blog-table-wrap"><table class="blog-table"><thead><tr>' +
        head.map(c => `<th scope="col">${inline(c, prefix)}</th>`).join('') + '</tr></thead><tbody>' +
        bodyRows.map(r => '<tr>' + cells(r).map((c, idx) => idx === 0 ? `<th scope="row">${inline(c, prefix)}</th>` : `<td>${inline(c, prefix)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table></div>');
      continue;
    }
    if (/^[-*]\s+/.test(t)) {
      flush();
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) items.push(lines[i++].trim().replace(/^[-*]\s+/, ''));
      out.push('<ul class="blog-list">' + items.map(x => `<li>${inline(x, prefix)}</li>`).join('') + '</ul>');
      continue;
    }
    if (/^\d+\.\s+/.test(t)) {
      flush();
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) items.push(lines[i++].trim().replace(/^\d+\.\s+/, ''));
      out.push('<ol class="blog-olist">' + items.map(x => `<li>${inline(x, prefix)}</li>`).join('') + '</ol>');
      continue;
    }
    if (t.startsWith('>')) {
      flush();
      const q = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) q.push(lines[i++].trim().replace(/^>\s?/, ''));
      out.push(`<blockquote class="blog-quote">${q.map(x => `<p>${inline(x, prefix)}</p>`).join('')}</blockquote>`);
      continue;
    }
    para.push(t);
    i++;
  }
  flush();
  return { html: out.join('\n'), toc };
}

/* -------------------------------------------------------------------------
 * 記事の読み込み
 *   先頭の ---json ～ --- にメタ情報（JSON）、その後に本文（Markdown）
 * ---------------------------------------------------------------------- */
function loadPosts() {
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md')).sort();
  const posts = files.map(f => {
    const src = fs.readFileSync(path.join(CONTENT_DIR, f), 'utf8');
    const m = src.match(/^---json\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) throw new Error(`${f}: 先頭に ---json ～ --- のメタ情報が必要です`);
    let meta;
    try { meta = JSON.parse(m[1]); } catch (e) { throw new Error(`${f}: メタ情報のJSONが不正です (${e.message})`); }
    const slug = f.replace(/\.md$/, '');
    for (const k of ['title', 'description', 'category', 'date']) if (!meta[k]) throw new Error(`${f}: ${k} がありません`);
    if (!CAT[meta.category]) throw new Error(`${f}: 未定義のカテゴリー ${meta.category}`);
    if (meta.draft) return null;
    return { slug, ...meta, updated: meta.updated || meta.date, body: m[2] };
  }).filter(Boolean);
  posts.sort((a, b) => (b.date + b.slug).localeCompare(a.date + a.slug));
  const slugs = new Set(posts.map(p => p.slug));
  for (const p of posts) for (const r of p.related || []) if (!slugs.has(r)) throw new Error(`${p.slug}: 関連記事 ${r} が存在しません`);
  const published = posts.filter(p => p.date <= TODAY);
  const scheduled = posts.filter(p => p.date > TODAY);
  PUBLISHED = new Set(published.map(p => p.slug));
  for (const p of published) p.related = (p.related || []).filter(r => PUBLISHED.has(r));
  if (scheduled.length) console.log(`予約投稿（未公開）: ${scheduled.map(p => `${p.slug}(${p.date})`).join(', ')}`);
  return published;
}

/* -------------------------------------------------------------------------
 * 共通レイアウト
 * ---------------------------------------------------------------------- */
function header(prefix) {
  return `<header class="site-header">
<div class="container site-header__inner">
<a class="site-header__logo" href="${prefix || './'}">
<span class="site-header__logo-icon"><img src="${prefix}assets/images/brand/logo.png" alt=""></span>
<span class="site-header__logo-text">${SITE}</span>
</a>

<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="global-nav" aria-label="メニューを開閉">
<span class="nav-toggle__bar"></span>
<span class="nav-toggle__bar"></span>
<span class="nav-toggle__bar"></span>
</button>

<nav class="global-nav" id="global-nav">
<ul class="global-nav__list">
<li class="global-nav__item"><a class="global-nav__link" href="${prefix}#comparisons">比較記事</a></li>
<li class="global-nav__item"><a class="global-nav__link" href="${prefix}blog/">お役立ち記事</a></li>
<li class="global-nav__item"><a class="global-nav__link" href="${prefix}#criteria">比較基準</a></li>
<li class="global-nav__item"><a class="global-nav__link" href="${prefix}about/">運営者情報</a></li>
</ul>
</nav>
</div>
</header>`;
}

function footer(prefix) {
  return `<footer class="site-footer">
<div class="container">
<p class="site-footer__sitename">${SITE}</p>
<nav class="site-footer__nav" aria-label="フッターナビゲーション">
<ul>
<li><a href="${prefix || './'}">トップページ</a></li>
<li><a href="${prefix}#comparisons">比較記事一覧</a></li>
<li><a href="${prefix}blog/">お役立ち記事</a></li>
${CATEGORIES.map(c => `<li><a href="${prefix}blog/category/${c.slug}/">${c.name}</a></li>`).join('\n')}
<li><a href="${prefix}about/">運営者情報・編集方針</a></li>
</ul>
</nav>
<p class="site-footer__disclaimer">掲載情報は作成時点の公式情報をもとにしています。契約前に各社公式サイトで最新情報をご確認ください。</p>
<p class="site-footer__disclosure">当サイトは、掲載企業の一社である福祉ITパートナーの関連会社が運営しています。</p>
<p class="site-footer__copyright">&copy; ${SITE}</p>
</div>
</footer>`;
}

function page({ prefix, title, description, url, type = 'website', schema = [], body, extraHead = '', image = null }) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

${ANALYTICS}

<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">

<meta property="og:site_name" content="${SITE}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${BASE}${image || 'assets/images/brand/logo.png'}">
${image ? '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">' : '<meta name="twitter:card" content="summary">'}
${extraHead}
<link rel="icon" href="${prefix}favicon.ico?v=3" sizes="any">
<link rel="icon" type="image/png" sizes="16x16" href="${prefix}favicon-v3-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="${prefix}favicon-v3-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="${prefix}favicon-v3-48x48.png">
<link rel="apple-touch-icon" href="${prefix}apple-touch-icon-v3.png">
<link rel="icon" type="image/png" sizes="192x192" href="${BASE}favicon-v3-192x192.png">
<link rel="manifest" href="${prefix}site.webmanifest">
<meta name="theme-color" content="#1e493c">

<link rel="stylesheet" href="${prefix}assets/css/base.css">
<link rel="stylesheet" href="${prefix}assets/css/blog.css">
${schema.map(jsonLd).join('\n')}
</head>
<body class="blog-page">

${header(prefix)}

<main>
${body}
</main>

${footer(prefix)}

<script src="${prefix}assets/js/main.js"></script>
</body>
</html>
`;
}

function breadcrumb(prefix, items) {
  // items: [{name, href(相対) | null}]
  return `<nav class="blog-breadcrumb" aria-label="パンくずリスト"><ol>${items.map((it, idx) =>
    idx === items.length - 1 ? `<li aria-current="page">${esc(it.name)}</li>` : `<li><a href="${it.href}">${esc(it.name)}</a></li>`).join('')}</ol></nav>`;
}

function breadcrumbSchema(items) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((it, idx) => ({ '@type': 'ListItem', position: idx + 1, name: it.name, item: it.url })) };
}

function readMinutes(md) {
  const chars = md.replace(/[#*|>\-\[\]()`:]/g, '').replace(/https?:\/\/\S+/g, '').replace(/\s/g, '').length;
  return Math.max(3, Math.round(chars / 550));
}

function postCard(p, prefix) {
  const c = CAT[p.category];
  const img = coverPath(p.slug);
  return `<a class="blog-card blog-card--${c.slug}" href="${prefix}blog/${p.slug}/">
${img ? `<span class="blog-card__thumb"><img src="${prefix}${img.replace(/\.jpg$/, '-sm.jpg')}" alt="" width="600" height="315" loading="lazy" decoding="async"></span>` : ''}
<span class="blog-card__body">
<span class="blog-cat blog-cat--${c.slug}">${c.name}</span>
<h3 class="blog-card__title">${esc(p.title)}</h3>
<p class="blog-card__desc">${esc(p.description)}</p>
<span class="blog-card__foot"><span class="blog-card__meta"><time datetime="${p.updated}">${fmtDate(p.updated)}</time>更新</span><span class="blog-card__more">記事を読む<span aria-hidden="true"> →</span></span></span>
</span>
</a>`;
}

/* -------------------------------------------------------------------------
 * 記事ページ
 * ---------------------------------------------------------------------- */
function renderPost(p, posts) {
  const prefix = '../../';
  const url = `${BASE}blog/${p.slug}/`;
  const c = CAT[p.category];
  const { html, toc } = markdown(p.body, prefix);
  const crumbs = [
    { name: 'ホーム', href: prefix, url: BASE },
    { name: 'お役立ち記事', href: `${prefix}blog/`, url: `${BASE}blog/` },
    { name: c.name, href: `${prefix}blog/category/${c.slug}/`, url: `${BASE}blog/category/${c.slug}/` },
    { name: p.title, href: null, url },
  ];

  const related = (p.related || []).map(s => posts.find(x => x.slug === s));
  // 関連記事が少ない場合は同じカテゴリーの新しい記事で補う
  for (const x of posts) { if (related.length >= 3) break; if (x.slug !== p.slug && x.category === p.category && !related.includes(x)) related.push(x); }

  const summary = p.summary && p.summary.length ? `<div class="blog-summary"><p class="blog-summary__title">この記事でわかること</p><ul>${p.summary.map(s => `<li>${inline(s, prefix)}</li>`).join('')}</ul></div>` : '';
  const tocHtml = toc.length >= 3 ? `<nav class="blog-toc" aria-label="目次"><p class="blog-toc__title">目次</p><ol>${toc.map(t => `<li><a href="#${t.id}">${inline(t.text, prefix).replace(/<\/?a[^>]*>/g, '')}</a></li>`).join('')}</ol></nav>` : '';
  const faq = p.faq && p.faq.length ? `<section class="blog-faq" id="faq"><h2>よくある質問</h2>${p.faq.map(f => `<details class="blog-faq__item"><summary>${esc(f.q)}</summary><div class="blog-faq__a">${markdown(f.a, prefix).html}</div></details>`).join('')}</section>` : '';
  const sources = p.sources && p.sources.length ? `<section class="blog-sources"><h2>参考資料・出典</h2><ul>${p.sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>${s.note ? `<span>（${esc(s.note)}）</span>` : ''}</li>`).join('')}</ul><p class="blog-sources__note">制度・料金・統計は改定される場合があります。最新の内容は各出典の公式情報でご確認ください。</p></section>` : '';
  const cta = `<aside class="blog-cta"><p class="blog-cta__title">業種別にホームページ制作会社を比較する</p><p>料金・対応範囲・公開後のサポートを、公式情報をもとに整理しています。</p><ul>${COMPARISONS.map(x => `<li><a href="${prefix}${x.href}">${x.title} ›</a></li>`).join('')}</ul></aside>`;

  const schema = [
    {
      '@context': 'https://schema.org', '@type': 'BlogPosting',
      headline: p.title, description: p.description, mainEntityOfPage: url, url,
      datePublished: p.date, dateModified: p.updated,
      articleSection: c.name, inLanguage: 'ja',
      author: { '@type': 'Organization', name: EDITOR, url: `${BASE}about/` },
      publisher: { '@type': 'Organization', name: SITE, logo: { '@type': 'ImageObject', url: `${BASE}favicon-v3-512x512.png` } },
      image: `${BASE}${coverPath(p.slug) || 'assets/images/brand/logo.png'}`,
    },
    breadcrumbSchema(crumbs),
  ];

  const body = `<div class="container blog-container">
${breadcrumb(prefix, crumbs)}
<article class="blog-article">
<header class="blog-article__head">
<a class="blog-cat blog-cat--${c.slug}" href="${prefix}blog/category/${c.slug}/">${c.name}</a>
<h1 class="blog-article__title">${esc(p.title)}</h1>
<p class="blog-article__meta">
<span>公開日 <time datetime="${p.date}">${fmtDate(p.date)}</time></span>
${p.updated !== p.date ? `<span>更新日 <time datetime="${p.updated}">${fmtDate(p.updated)}</time></span>` : ''}
<span>読了目安 約${readMinutes(p.body)}分</span>
<span>執筆・編集 <a href="${prefix}about/">${EDITOR}</a></span>
</p>
${coverPath(p.slug) ? `<figure class="blog-article__cover"><img src="${prefix}${coverPath(p.slug)}" alt="" width="1200" height="630" fetchpriority="high"></figure>` : ''}
${p.lead ? `<p class="blog-article__lead">${inline(p.lead, prefix)}</p>` : ''}
</header>
${summary}
${tocHtml}
<div class="blog-body">
${html}
</div>
${faq}
${sources}
${cta}
</article>
${related.length ? `<section class="blog-related"><h2 class="blog-related__title">あわせて読みたい</h2><div class="blog-grid">${related.map(x => postCard(x, prefix)).join('\n')}</div></section>` : ''}
</div>`;

  return page({
    prefix, title: `${p.title}｜${SITE}`, description: p.description, url, type: 'article', schema, body, image: coverPath(p.slug),
    extraHead: `<meta property="article:published_time" content="${p.date}">\n<meta property="article:modified_time" content="${p.updated}">\n<meta property="article:section" content="${esc(c.name)}">`,
  });
}

/* -------------------------------------------------------------------------
 * 一覧ページ
 * ---------------------------------------------------------------------- */
function catNav(prefix, current) {
  return `<nav class="blog-catnav" aria-label="カテゴリー"><ul>
<li><a href="${prefix}blog/"${current ? '' : ' aria-current="page"'}>すべて</a></li>
${CATEGORIES.map(c => `<li><a href="${prefix}blog/category/${c.slug}/"${current === c.slug ? ' aria-current="page"' : ''}>${c.name}</a></li>`).join('\n')}
</ul></nav>`;
}

function renderIndex(posts) {
  const prefix = '../';
  const url = `${BASE}blog/`;
  const crumbs = [{ name: 'ホーム', href: prefix, url: BASE }, { name: 'お役立ち記事', href: null, url }];
  const sections = CATEGORIES.map(c => {
    const list = posts.filter(p => p.category === c.slug);
    if (!list.length) return '';
    return `<section class="blog-index-section">
<div class="blog-index-section__head"><h2>${c.name}</h2><a href="${prefix}blog/category/${c.slug}/">${c.name}の記事一覧 ›</a></div>
<p class="blog-index-section__desc">${c.desc}</p>
<div class="blog-grid">${list.slice(0, 6).map(p => postCard(p, prefix)).join('\n')}</div>
</section>`;
  }).join('\n');
  const body = `<div class="container blog-container">
${breadcrumb(prefix, crumbs)}
<header class="blog-listhead">
<h1>福祉事業所のホームページお役立ち記事</h1>
<p>障害福祉の基礎知識から、ホームページ制作の費用・選び方、サイバー攻撃への備え、集客・採用まで。福祉事業所の運営者・担当者の方に向けて、公的機関の資料などをもとに編集部がわかりやすく解説します。</p>
</header>
${catNav(prefix, null)}
<section class="blog-index-section">
<div class="blog-index-section__head"><h2>新着記事</h2></div>
<div class="blog-grid">${posts.slice(0, 6).map(p => postCard(p, prefix)).join('\n')}</div>
</section>
${sections}
</div>`;
  const schema = [
    breadcrumbSchema(crumbs),
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'お役立ち記事', url, isPartOf: { '@type': 'WebSite', name: SITE, url: BASE } },
  ];
  return page({ prefix, title: `福祉事業所のホームページお役立ち記事一覧｜${SITE}`, description: '障害福祉サービスの基礎知識、ホームページ制作の費用相場や選び方、改ざん・ランサムウェアなどサイバー攻撃への対策、集客・採用のコツを解説する記事一覧です。', url, schema, body });
}

function renderCategory(c, posts) {
  const prefix = '../../../';
  const url = `${BASE}blog/category/${c.slug}/`;
  const list = posts.filter(p => p.category === c.slug);
  const crumbs = [{ name: 'ホーム', href: prefix, url: BASE }, { name: 'お役立ち記事', href: `${prefix}blog/`, url: `${BASE}blog/` }, { name: c.name, href: null, url }];
  const body = `<div class="container blog-container">
${breadcrumb(prefix, crumbs)}
<header class="blog-listhead">
<h1>${c.name}の記事一覧</h1>
<p>${c.desc}</p>
</header>
${catNav(prefix, c.slug)}
<div class="blog-grid">${list.map(p => postCard(p, prefix)).join('\n')}</div>
</div>`;
  return page({ prefix, title: `${c.name}の記事一覧｜${SITE}`, description: c.desc, url, schema: [breadcrumbSchema(crumbs)], body });
}

/* -------------------------------------------------------------------------
 * 運営者情報
 * ---------------------------------------------------------------------- */
function renderAbout() {
  const prefix = '../';
  const url = `${BASE}about/`;
  const crumbs = [{ name: 'ホーム', href: prefix, url: BASE }, { name: '運営者情報・編集方針', href: null, url }];
  const md = fs.readFileSync(path.join(ROOT, 'content', 'about.md'), 'utf8');
  const { html } = markdown(md, prefix);
  const body = `<div class="container blog-container">
${breadcrumb(prefix, crumbs)}
<article class="blog-article">
<header class="blog-article__head"><h1 class="blog-article__title">運営者情報・編集方針</h1></header>
<div class="blog-body">
${html}
</div>
</article>
</div>`;
  const schema = [breadcrumbSchema(crumbs), { '@context': 'https://schema.org', '@type': 'AboutPage', name: '運営者情報・編集方針', url, publisher: { '@type': 'Organization', name: SITE, url: BASE } }];
  return page({ prefix, title: `運営者情報・編集方針｜${SITE}`, description: `${SITE}の運営者情報、比較・記事作成の編集方針、掲載情報の取り扱いについて説明します。`, url, schema, body });
}

/* -------------------------------------------------------------------------
 * トップページの新着記事（<!-- BLOG:LATEST --> ～ <!-- /BLOG:LATEST --> を置換）
 * ---------------------------------------------------------------------- */
function compareCard(c) {
  return `<a class="card article-card article-card--visual" data-category="${c.slug}" href="${c.file}">
<span class="article-card__thumb"><img src="assets/images/comparisons/${c.slug}/card-sm.jpg" alt="" width="600" height="315" loading="lazy" decoding="async"></span>
<span class="article-card__body">
<span class="article-card__chips"><span class="article-card__chip">${c.companies}社を比較</span><span class="article-card__chip article-card__chip--sub">${esc(c.infoDate)}の公式情報</span></span>
<h3 class="article-card__title">${esc(c.cardTitle)}</h3>
<p class="article-card__desc">${esc(c.desc)}</p>
<span class="article-card__link">比較を見る<span aria-hidden="true"> →</span></span>
</span>
</a>`;
}

function updateTopPage(posts) {
  const file = path.join(ROOT, 'index.html');
  let src = fs.readFileSync(file, 'utf8');
  const cre = /<!-- COMPARE:CARDS -->[\s\S]*?<!-- \/COMPARE:CARDS -->/;
  if (cre.test(src)) src = src.replace(cre, `<!-- COMPARE:CARDS -->\n${COMPARISONS.map(compareCard).join('\n\n')}\n<!-- /COMPARE:CARDS -->`);
  const re = /<!-- BLOG:LATEST -->[\s\S]*?<!-- \/BLOG:LATEST -->/;
  if (!re.test(src)) { fs.writeFileSync(file, src); return; }
  const html = `<!-- BLOG:LATEST -->\n<div class="blog-grid">\n${posts.slice(0, 6).map(p => postCard(p, '')).join('\n')}\n</div>\n<!-- /BLOG:LATEST -->`;
  fs.writeFileSync(file, src.replace(re, html));
}

/* -------------------------------------------------------------------------
 * sitemap.xml
 * ---------------------------------------------------------------------- */
function renderSitemap(posts) {
  const lastmod = posts.reduce((a, p) => (p.updated > a ? p.updated : a), '0000');
  const urls = [
    { loc: BASE },
    ...COMPARISONS.map(c => ({ loc: `${BASE}${c.file}` })),
    { loc: `${BASE}about/` },
    { loc: `${BASE}blog/`, lastmod },
    ...CATEGORIES.filter(c => posts.some(p => p.category === c.slug)).map(c => ({ loc: `${BASE}blog/category/${c.slug}/` })),
    ...posts.map(p => ({ loc: `${BASE}blog/${p.slug}/`, lastmod: p.updated })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url>\n<loc>${u.loc}</loc>${u.lastmod ? `\n<lastmod>${u.lastmod}</lastmod>` : ''}\n</url>`).join('\n')}
</urlset>
`;
}

/* -------------------------------------------------------------------------
 * 実行
 * ---------------------------------------------------------------------- */
function main() {
  const posts = loadPosts();
  // 削除された記事の古いHTMLが残らないよう blog/ を作り直す
  fs.rmSync(path.join(ROOT, 'blog'), { recursive: true, force: true });
  for (const p of posts) writeFile(`blog/${p.slug}/index.html`, renderPost(p, posts));
  writeFile('blog/index.html', renderIndex(posts));
  for (const c of CATEGORIES) if (posts.some(p => p.category === c.slug)) writeFile(`blog/category/${c.slug}/index.html`, renderCategory(c, posts));
  writeFile('about/index.html', renderAbout());
  writeFile('sitemap.xml', renderSitemap(posts));
  updateTopPage(posts);
  console.log(`ブログ記事 ${posts.length} 件を生成しました（基準日 ${TODAY}）。`);
}

main();
