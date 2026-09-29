/* Run: node scripts/build-directory.cjs. Static HTML works without JavaScript. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
require('../assets/js/company-data.js');
const {companies,filters} = globalThis.CompanyDirectory;
const content = JSON.parse(fs.readFileSync(path.join(root,'assets/data/b-type-content.json'),'utf8'));
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const base = 'https://uk-support1.github.io/fukushi-website-comparison/';
const title = `【2026年最新】就労継続支援B型におすすめのホームページ制作会社${companies.length}選｜料金・特徴を比較`;
const description = '就労継続支援B型向けホームページ制作会社4社の料金・特徴・更新対応を比較。福祉への理解、初期費用、SEO、Googleマップなどの条件から探せます。各社の注意点や制作会社の選び方も紹介します。';
function links(c,prefix) {return `<div class="directory-actions"><a class="btn btn--outline" href="${prefix}comparisons/b-type-comparison.html#${c.id}">詳しく見る</a><a class="btn btn--primary" href="${c.url}" target="_blank" rel="noopener noreferrer">公式サイトを見る ↗</a></div>`;}
function formatDate(iso) {const [y,m,d]=iso.split('-'); return `${y}年${Number(m)}月${Number(d)}日`;}
function priceDetailsList(c) {return `<dl class="directory-price-breakdown">${c.priceDetails.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;}
function price(c) {return `<p class="directory-price">${symbolCell(c.costRating)}<span class="directory-price-main">${esc(c.price)}</span></p>${priceDetailsList(c)}<p class="directory-note" data-price-note>${esc(c.priceNote)}</p><p class="directory-note">公式情報確認：${formatDate(c.informationDate)}</p>`;}
const SYMBOL_CLASS = {'◎':'best','○':'good','△':'mid','×':'bad'};
const SYMBOL_RANK = {'◎':0,'○':1,'△':2,'×':3};
function symbolCell(text) {
  const chars = Object.keys(SYMBOL_CLASS);
  const leading = chars.find(s => text.startsWith(s));
  if (leading) return `<span class="directory-symbol directory-symbol--${SYMBOL_CLASS[leading]}">${leading}</span>${esc(text.slice(leading.length))}`;
  const trailing = chars.find(s => text.endsWith(s));
  if (trailing) return `${esc(text.slice(0,-trailing.length))}<span class="directory-symbol directory-symbol--${SYMBOL_CLASS[trailing]}">${trailing}</span>`;
  return esc(text);
}
function cellRank(text) {
  const chars = Object.keys(SYMBOL_RANK);
  const leading = chars.find(s => text.startsWith(s));
  if (leading) return SYMBOL_RANK[leading];
  const trailing = chars.find(s => text.endsWith(s));
  if (trailing) return SYMBOL_RANK[trailing];
  return null;
}
function bestMask(texts) {
  const ranks = texts.map(cellRank);
  const valid = ranks.filter(r => r !== null);
  if (!valid.length) return ranks.map(() => false);
  const min = Math.min(...valid);
  return ranks.map(r => r === min);
}
function spec(c) {return `<dl class="directory-spec">${['福祉への理解','自分で更新','SEO','Googleマップ','集客支援'].map((key,i)=>`<dt>${key}</dt><dd>${symbolCell(c.support[i])}</dd>`).join('')}<dt>制作期間</dt><dd>${symbolCell(c.delivery || "要確認")}</dd></dl>`;}
function card(c,prefix,compact=false) {return `<article class="directory-card" data-company="${c.id}"><h3>${esc(c.name)}</h3>${price(c)}<p>${esc(c.summary)}</p>${compact?`<details><summary>対応内容を確認する</summary>${spec(c)}</details>`:spec(c)}${links(c,prefix)}</article>`;}
function form(prefix) {return `<form class="directory-form" action="${prefix}search.html" method="get"><input type="hidden" name="category" value="b-type"><fieldset><legend>こだわり条件から探す</legend><p>選んだ条件をすべて満たす制作会社を探せます。</p><div class="directory-filters">${Object.entries(filters).map(([key,value])=>`<label><input type="checkbox" name="condition" value="${key}"><span>${value}</span></label>`).join('')}</div></fieldset><p class="directory-note">現行未確認の会社・項目は条件の適合に含めません。選択条件は同じプランで判定します。「月額料金なし」は掲載プランの月額保守更新費が0円のもの（サーバー等の実費は要確認）。Googleマップはサイトへの掲載、Googleマップへの登録、Googleビジネスプロフィールの基本設定を含み、MEO運用を保証しません。写真・文章の相談は公開後の変更・差し替え対応を含みます。</p><div class="directory-actions"><button class="btn btn--primary" type="submit">この条件で探す</button><a href="${prefix}search.html?category=b-type">条件をすべて解除</a></div><noscript><p>条件検索にはJavaScriptが必要です。比較表・会社詳細はそのままご覧いただけます。</p></noscript></form>`;}
function shell(body,isSearch=false) {
  const prefix = isSearch ? '' : '../';
  const pageTitle = isSearch ? '条件に合うホームページ制作会社を探す｜福祉ホームページ制作比較ガイド' : title;
  const url = base+(isSearch?'search.html':'comparisons/b-type-comparison.html');
  const crumb = isSearch?'条件検索':'就労継続支援B型向け';
  const schema = [ {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'ホーム',item:base},{'@type':'ListItem',position:2,name:crumb,item:url}]} ];
  if (!isSearch) schema.push({'@context':'https://schema.org','@type':'WebPage',headline:title,url,dateModified:'2026-09-29',publisher:{'@type':'Organization',name:'福祉ホームページ制作比較ガイド'}});
  let header = content.header.replaceAll('../index.html#operator',isSearch?'comparisons/b-type-comparison.html#operator':'#operator');
  let footer = content.footer.replaceAll('../index.html#operator',isSearch?'comparisons/b-type-comparison.html#operator':'#operator');
  if(isSearch) {header=header.replaceAll('../',''); footer=footer.replaceAll('../','');}
  header=header.replace('class="nav-toggle"','aria-label="メニューを開閉" class="nav-toggle"');
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
${content.analytics}<title>${esc(pageTitle)}</title><meta name="description" content="${esc(isSearch?'福祉業界向けホームページ制作会社を条件で検索。選択条件と該当数、各社の料金・特徴を確認できます。':description)}">
${isSearch?'<meta name="robots" content="noindex,follow">':''}<link rel="canonical" href="${url}">
<meta property="og:type" content="${isSearch?'website':'article'}"><meta property="og:title" content="${esc(pageTitle)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:site_name" content="福祉ホームページ制作比較ガイド"><meta property="og:image" content="${base}assets/images/brand/logo.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(pageTitle)}">
<link rel="icon" href="${prefix}favicon.ico"><link rel="apple-touch-icon" href="${prefix}apple-touch-icon.png"><link rel="manifest" href="${prefix}site.webmanifest"><meta name="theme-color" content="#1e493c">
<link rel="stylesheet" href="${prefix}assets/css/base.css"><link rel="stylesheet" href="${prefix}assets/css/directory.css">
<script type="application/ld+json">${JSON.stringify(schema)}</script></head><body class="directory-page">${header}<main><div class="directory-shell"><nav class="directory-breadcrumb" aria-label="パンくず"><ol><li><a href="${prefix}index.html">ホーム</a></li><li aria-current="page">${crumb}</li></ol></nav>${body}</div></main>${footer}<script src="${prefix}assets/js/main.js"></script>${isSearch?'<script src="assets/js/company-data.js"></script><script src="assets/js/company-search.js"></script>':''}</body></html>\n`;
}
const rankedRows = [
  ['制作料金',c=>c.costRating,c=>`${symbolCell(c.costRating)}<span class="directory-price-main">${esc(c.price)}</span>${priceDetailsList(c)}`],
  ['福祉への理解',c=>c.support[0],c=>symbolCell(c.support[0])],
  ['自分で更新',c=>c.support[1],c=>symbolCell(c.support[1])],
  ['SEO',c=>c.support[2],c=>symbolCell(c.support[2])],
  ['Googleマップ',c=>c.support[3],c=>symbolCell(c.support[3])],
  ['集客支援',c=>c.support[4],c=>symbolCell(c.support[4])],
  ['制作期間',c=>c.delivery || '要確認',c=>symbolCell(c.delivery || '要確認')],
];
const plainRows = [
  ['特徴',c=>esc(c.summary)],
  ['詳細を見る',c=>`<a class="btn btn--outline" href="#${c.id}">詳しく見る</a>`],
  ['公式サイト',c=>`<a class="btn btn--primary" href="${c.url}" target="_blank" rel="noopener noreferrer">公式サイト ↗</a>`],
];
const table = `<table class="directory-table"><caption>掲載4社の料金・対応内容（2026年9月29日公式確認）</caption><thead><tr><th scope="col">比較項目</th>${companies.map(c=>`<th scope="col">${esc(c.name)}</th>`).join('')}</tr></thead><tbody>${rankedRows.map(([key,rankFn,htmlFn])=>{const mask=bestMask(companies.map(rankFn));return `<tr><th scope="row">${key}</th>${companies.map((c,i)=>`<td class="${mask[i]?'directory-best-cell':''}">${htmlFn(c)}</td>`).join('')}</tr>`;}).join('')}${plainRows.map(([key,fn])=>`<tr><th scope="row">${key}</th>${companies.map(c=>`<td>${fn(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
function section(id,heading,body,copy=false) {return `<section class="directory-section ${copy?'directory-copy':''}" id="${id}"><h2>${heading}</h2>${body}</section>`;}
const purposes = [['費用を抑えたい','fukushi-it-partner','税込19,800円のライトプラン。公開作業などは別途。'],['福祉への理解を重視したい','fukushi-it-partner','B型を含む福祉事業所向けの制作に対応。'],['自分で更新したい','onenet','納品後の自社編集に対応。'],['集客まで相談したい','onenet','サイト運用・広告運用のサポート。'],['デザインを重視したい','attlabo','オリジナルデザインでの制作にも対応。']];
const details = companies.map(c=>`<article id="${c.id}" class="directory-card"><h3>${esc(c.name)}</h3>${content.details[c.id].intro}${price(c)}<h4>特徴</h4><ul>${c.reasons.map(r=>`<li>${esc(r)}</li>`).join('')}</ul><h4>対応内容</h4>${spec(c)}${content.details[c.id].body}<h4>会社・サービス概要</h4><p>${esc(c.name)}。${esc(c.summary)} 所在地・法人情報の詳細は公式サイトでご確認ください。</p><p class="directory-note">情報元：公式サイト（${formatDate(c.informationDate)}確認）。<a href="${c.source}">公式サイトで情報を確認 ↗</a></p>${links(c,'../')}</article>`).join('');
const intro = '就労継続支援B型のホームページ制作会社4社を、料金・福祉への理解・公開後の運用から比較します。まずは比較表で違いを確認し、気になる条件や目的から候補を探してください。各社の特徴と注意点も整理し、見学や問い合わせにつながる依頼先選びをお手伝いします。';
const btype = `<header class="directory-intro"><p class="directory-eyebrow">福祉業界のホームページ制作会社を比較</p><h1>${title.replace("B型",'<span class="directory-nowrap">B型</span>').replace("料金・特徴を比較",'<span class="directory-nowrap">料金・特徴を比較</span>')}</h1><p class="directory-date">ページ更新：<time datetime="2026-09-29">2026年9月29日</time> ／ 公式確認：2026年9月29日（掲載4社とも公式サイトで確認）</p><p class="directory-lead">${intro}</p><nav class="directory-toc" aria-label="比較・検索へのショートカット"><a href="#compare-table">比較表を見る ↓</a><a href="#conditions">条件から探す ↓</a><a href="#purpose">目的別おすすめ ↓</a></nav></header>`+
section('compare-table','おすすめ制作会社の比較表',table+`<p class="directory-legend"><span><span class="directory-symbol directory-symbol--best">◎</span>特に優れている</span><span><span class="directory-symbol directory-symbol--good">○</span>対応あり</span><span><span class="directory-symbol directory-symbol--mid">△</span>限定的・要問い合わせ</span><span><span class="directory-symbol directory-symbol--bad">×</span>非対応</span></p><div class="directory-mobile">${companies.map(c=>card(c,'../',true)).join('')}</div><p class="directory-note">「要確認」「△」は必ずしも非対応を意味しません。掲載料金は条件が異なるため、総額・契約期間をあわせて確認してください。</p>`)+
section('conditions','条件に合う制作会社を見つける',form('../'))+
section('purpose','目的別おすすめ',`<div class="directory-grid">${purposes.map(([heading,id,desc])=>`<a class="directory-purpose" href="#${id}"><strong>${heading}</strong><span>${companies.find(c=>c.id===id).name} →<br>${desc}</span></a>`).join('')}</div>`)+
section('companies','各制作会社の詳細',details)+
`<nav class="directory-toc" aria-label="制作ガイドの目次"><a href="#how-to-choose">選び方</a><a href="#price-guide">料金相場</a><a href="#content-to-include">必要な情報</a><a href="#marketing">集客方法</a><a href="#faq">FAQ</a></nav>`+
section('how-to-choose','就労継続支援B型のホームページ制作会社の選び方',content.choose,true)+
section('price-guide','ホームページ制作の料金相場を考える','<p>今回公式確認できた掲載プランには、制作費19,800円（税込）から297,000円〜（税込）までの例があります。これは掲載例の幅であり、市場全体の相場を示すものではありません。</p><p>制作費だけでなく、月額料金、サーバー、ドメイン、公開作業、保守費用まで含めて比較してください。初期費用が低くても、契約期間中の総額は変わります。必要なページ数や機能をそろえて見積もりを確認しましょう。</p>',true)+
section('content-to-include','B型事業所のホームページに載せたい情報',content.include+`<details id="important-points"><summary>B型の情報を伝える際のポイント</summary>${content.important}</details>`,true)+
section('marketing','見学・問い合わせにつなげる集客方法','<h3>見学・問い合わせへの導線</h3><p>作業内容や1日の流れを読んだ方が、そのまま見学・体験へ進めるように、電話・フォームなどの案内を分かりやすく配置します。利用開始までの流れも伝えましょう。</p><h3>SEOと地域の情報</h3><p>地域名や支援内容が伝わるページタイトルと見出しを整え、事業所の特徴を具体的に説明します。制作会社には内部SEOの対応範囲と、公開後の改善支援を確認してください。</p><h3>Googleマップ</h3><p>アクセスや送迎範囲を分かりやすく掲載します。サイト内への地図表示、Googleビジネスプロフィールの基本設定、継続的な運用支援は別の対応なので、依頼範囲を確認しましょう。</p><h3>ブログ・お役立ち情報</h3><p>日々の活動や見学時によくある質問を、無理なく更新できる運用を考えます。利用者の写真や個人情報の取り扱いを確認し、事業所の雰囲気を丁寧に伝えましょう。</p>',true)+
section('faq','よくある質問','<details><summary>初期費用だけで比較してよいですか？</summary><p>月額費用や契約期間、サーバー・ドメイン費用を含めた総額で比較してください。</p></details><details><summary>公開後は自分で更新できますか？</summary><p>会社やプランによって異なります。福祉ITパートナー・Onenet・アトラボは公式情報で自社更新（カスタマイズ）とマニュアルの提供を確認しています。編集できる範囲や操作説明の有無を契約前に確認しましょう。</p></details><details><summary>検索で0件になった場合はどうすればよいですか？</summary><p>条件を減らして再検索してください。情報が未確認の会社は適合に含めていないため、必要な対応内容を各社へ確認する方法もあります。</p></details>',true)+
section('other-companies','その他の制作会社','<p>このB型比較ページの掲載対象は上記4社です。別の候補も検討したい方は、<a href="welfare-comparison.html">福祉事業所向けの比較記事</a>をご覧いただき、B型への対応を各社へ確認してください。</p>',true)+
section('related','関連記事',`<div class="directory-grid"><a class="directory-purpose" href="group-home-comparison.html"><strong>障害者グループホーム向け</strong><span>制作会社の料金・特徴を比較 →</span></a><a class="directory-purpose" href="welfare-comparison.html"><strong>福祉事業所向け</strong><span>福祉全般の制作会社を比較 →</span></a></div><p class="directory-note">今後の比較テーマ：就労移行支援・放課後等デイサービス・訪問看護・相談支援。</p>`)+
section('operator','比較方法・運営者情報','<div id="summary"><p>運営サイト：福祉ホームページ制作比較ガイド。本ページは確認できる公式情報を優先して料金・対応内容を整理しています。掲載4社（福祉ITパートナー・Onenet・tomonico・アトラボ）の料金と対応内容は、いずれも2026年9月29日に公式サイトで確認しています。</p><p>比較表の◎○△×は、各項目（制作料金・福祉への理解・自分で更新・SEO・Googleマップ・集客支援・制作期間）ごとに、公式情報から確認できる内容を基準に付けた評価です。各項目で最も優れている会社のセルを強調表示しており、特定の1社を総合的におすすめする表示ではありません。</p><p>未確認の項目は検索対象から除外します。料金や対応内容は変更される場合があるため、契約前に必ず公式サイトでご確認ください。<a href="../index.html#criteria">サイト全体の比較基準を見る →</a></p></div>',true);
fs.writeFileSync(path.join(root,'comparisons/b-type-comparison.html'),shell(btype).replace(/[ \t]+$/gm,''));
const searchBody = `<header class="directory-intro"><p class="directory-eyebrow">就労継続支援B型向け</p><h1>条件に合うホームページ制作会社を探す</h1><p>掲載情報で確認できる対応内容から、条件に合う会社をご紹介します。</p></header><section class="directory-section" aria-labelledby="selection-heading"><h2 id="selection-heading">選択した条件</h2><div id="selected-conditions" class="directory-selected"></div><p id="result-count" role="status" aria-live="polite"></p><p id="search-pending">検索結果の表示にはJavaScriptが必要です。表示されない場合は<a href="comparisons/b-type-comparison.html#compare-table">B型比較表</a>をご覧ください。</p><div id="search-results" hidden>${companies.map(c=>card(c,'')).join('')}<div id="empty-results" class="directory-empty" hidden><h3>検索条件を見直す</h3><p id="empty-message"></p><a class="btn btn--outline" href="search.html?category=b-type">条件を解除して全4社を見る</a></div></div></section>${form('')}<p class="directory-note">公式確認：2026年9月29日（掲載4社とも公式サイトで確認）。</p><div class="directory-actions"><a class="btn btn--outline" href="comparisons/b-type-comparison.html#conditions">B型比較ページに戻る</a></div>`;
fs.writeFileSync(path.join(root,'search.html'),shell(searchBody,true));
console.log('Generated B-type comparison and search.html');
