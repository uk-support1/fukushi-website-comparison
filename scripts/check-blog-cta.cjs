#!/usr/bin/env node
/* お役立ち記事（content/blog/*.md）に、比較記事への誘導が入っているかを確認する。
 *  - 本文の前半（先頭から60%まで）と終盤（最後の20%）の両方に、比較記事（/comparisons/…）へのリンクがあること
 *  - 福祉ITパートナーのサイトへリンクする記事は、「運営者の関連会社」の旨が本文にあること
 * 使い方: node scripts/check-blog-cta.cjs */
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'content', 'blog');
let bad = 0, n = 0;
for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.md')).sort()) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  const [head, body] = src.split(/\n---\n/).length > 1 ? [src.split(/\n---\n/)[0], src.split(/\n---\n/).slice(1).join('\n---\n')] : ['', src];
  if (/"draft"\s*:\s*true/.test(head)) continue;
  n++;
  const len = body.length;
  const pos = [...body.matchAll(/\]\(\/comparisons\/[a-z-]+\.html\)/g)].map(m => m.index);
  const problems = [];
  if (!pos.some(p => p < len * 0.6)) problems.push('前半に比較記事へのリンクがない');
  if (!pos.some(p => p > len * 0.8)) problems.push('終盤に比較記事へのリンクがない');
  if (/fukushi-it-partner\.com/.test(body.replace(/\n:::[\s\S]*$/, m => m)) && !/関連会社/.test(body)) problems.push('福祉ITパートナーへのリンクがあるのに「関連会社」の明記がない');
  if (problems.length) { bad++; console.log(`NG ${f}: ${problems.join(' / ')}`); }
}
console.log(`checked ${n} articles, ng ${bad}`);
process.exit(bad ? 1 : 0);
