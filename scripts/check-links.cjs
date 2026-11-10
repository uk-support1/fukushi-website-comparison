#!/usr/bin/env node
// サイト内リンクとページ内アンカーの切れを確認する。使い方: node scripts/check-links.cjs .
const fs=require('fs'),path=require('path');const root=process.argv[2];let bad=0,n=0;
function walk(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f);if(f==='.git'||f==='node_modules'||f==='templates')continue;if(fs.statSync(p).isDirectory())walk(p);else if(p.endsWith('.html'))check(p);}}
function check(file){const s=fs.readFileSync(file,'utf8');for(const m of s.matchAll(/(?:href|src)="([^"]+)"/g)){let u=m[1];if(/^(https?:|mailto:|tel:|#|data:)/.test(u))continue;n++;let [p,hash]=u.split('#');p=p.split('?')[0];let t=path.resolve(path.dirname(file),p||path.basename(file));if(fs.existsSync(t)&&fs.statSync(t).isDirectory())t=path.join(t,'index.html');if(!fs.existsSync(t)){bad++;console.log('MISSING',path.relative(root,file),u);continue;}
if(hash){const ts=fs.readFileSync(t,'utf8');if(!ts.includes(`id="${hash}"`)){bad++;console.log('NOANCHOR',path.relative(root,file),u);}}}}
walk(root);console.log('checked',n,'bad',bad);
