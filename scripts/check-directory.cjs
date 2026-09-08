/* PLAYWRIGHT_MODULE may point to an existing Playwright install. No build dependencies. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
require('../assets/js/company-data.js');
const {companies,filters,matches} = globalThis.CompanyDirectory;
const root = path.resolve(__dirname,'..');
const output = process.env.QA_OUTPUT || path.join(root,'docs/qa');
fs.mkdirSync(output,{recursive:true});
const keys = Object.keys(filters);
// Independent oracle: turn each registered plan into a capability bitmask, then
// use set inclusion. Never call production matches()/matchingPlans() here.
function expectedIds(selected, category = 'b-type') {
  if (selected.some(key => !keys.includes(key))) return [];
  const requested = selected.reduce((mask,key) => mask | (1 << keys.indexOf(key)),0);
  const accepted = [];
  for (const company of companies) {
    if (!company.categories.includes(category)) continue;
    if (!requested) { accepted.push(company.id); continue; }
    for (const plan of company.plans) {
      if (plan.verified === false) continue;
      const capabilities = Object.assign({},company.features,plan.features);
      capabilities.budget = typeof plan.initial === 'number' && plan.initial <= 50000;
      capabilities.noMonthly = plan.monthly === 0;
      let available = 0;
      for (let i=0;i<keys.length;i++) if (capabilities[keys[i]] === true) available |= 1 << i;
      if ((requested & available) === requested) { accepted.push(company.id); break; }
    }
  }
  return accepted;
}
for(let mask=0;mask<256;mask++) {
  const selected = keys.filter((_,i)=>mask & (1<<i));
  assert.deepEqual(companies.filter(c=>matches(c,selected)).map(c=>c.id),expectedIds(selected),`Independent oracle: ${mask}`);
  for(const c of companies) {
    const before=matches(c,selected); const recommendation=c.listing.recommended;
    c.listing.recommended=!recommendation;
    assert.equal(matches(c,selected),before,'Editorial placement must not affect matching');
    c.listing.recommended=recommendation;
  }
}
assert.deepEqual(expectedIds(['budget']),['fukushi-it-partner']);
assert.deepEqual(expectedIds(['noMonthly']),[]);
assert.deepEqual(expectedIds(['maps']),['fukushi-it-partner','onenet']);
assert.deepEqual(expectedIds(['selfUpdate']),['onenet','attlabo']);
assert.deepEqual(expectedIds(['welfare','budget','maps']),[]);
assert.deepEqual(expectedIds(['welfare','budget','content']),['fukushi-it-partner']);
assert.equal(companies.filter(c=>matches(c,['budget','noMonthly'])).length,0);
assert.deepEqual(companies.filter(c=>matches(c,['selfUpdate','marketing'])).map(c=>c.id),['onenet']);
assert.equal(matches(companies[0],['unknown']),false);
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(root+path.sep)) {res.writeHead(403);return res.end();}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.ico':'image/x-icon','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream');res.end(data);});
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({headless:true,channel:process.env.QA_BROWSER || 'msedge'});
  try {
    const page=await browser.newPage(); const errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    await page.route('**/googletagmanager.com/**',route=>route.abort());
    const report=[];
    for(const width of [1440,375,390,430]) {
      await page.setViewportSize({width,height:1000});
      for(const url of ['/comparisons/b-type-comparison.html','/search.html?condition=welfare']) {
        await page.goto(base+url);
        assert.equal(await page.locator('h1').count(),1);
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
        assert.equal(overflow,false,`Overflow at ${width}: ${url}`);
        if(url.includes('b-type')) {
          assert.equal(await page.locator('.directory-table').isVisible(),width>767);
          assert.equal(await page.locator('.directory-mobile').isVisible(),width<=767);
          // Check every local href, fragment, script and image on the rendered page.
          const broken=await page.evaluate(async()=>{
            const bad=[];
            for(const el of document.querySelectorAll('a[href],img[src],script[src],link[href]')) {
              const u=new URL(el.getAttribute('href')||el.getAttribute('src'),location.href);
              if(u.origin!==location.origin)continue;
              if(u.pathname.endsWith('/favicon.ico'))continue; // Edge intercepts favicon fetches; checked on disk below.
              let response;try{response=await fetch(u);}catch(e){bad.push(u.href+': '+e.message);continue;} if(!response.ok){bad.push(u.href);continue;}
              if(u.hash){const dom=new DOMParser().parseFromString(await response.text(),'text/html');if(!dom.getElementById(decodeURIComponent(u.hash.slice(1))))bad.push(u.href);}
            }return bad;
          }); assert.deepEqual(broken,[]);
        }
        if(width===1440||width===375)await page.screenshot({path:path.join(output,`${url.includes('b-type')?'b-type':'search'}-${width}.png`),fullPage:true});
        report.push(`${width}px ${url}: no overflow`);
      }
    }
    await page.goto(base+'/comparisons/b-type-comparison.html');
    await page.getByLabel('福祉業界に詳しい',{exact:true}).check();
    await page.getByRole('button',{name:'この条件で探す'}).click();
    await page.waitForURL('**/search.html?**');
    assert.match(await page.locator('#result-count').innerText(),/2社/);
    assert.equal(await page.locator('#search-results article:visible').first().getAttribute('data-company'),'fukushi-it-partner');
    await page.goBack(); assert.equal(await page.getByLabel('福祉業界に詳しい',{exact:true}).isChecked(),true);
    await page.goForward(); assert.equal(await page.getByLabel('福祉業界に詳しい',{exact:true}).isChecked(),true);
    for(let mask=0;mask<(process.env.QA_LAYOUT_ONLY ? 0 : 256);mask++) {
      const selected=keys.filter((_,i)=>mask&(1<<i));
      await page.goto(base+'/search.html?'+selected.map(k=>'condition='+k).join('&'));
      const actual=await page.locator('#search-results article:visible').evaluateAll(items=>items.map(c=>c.dataset.company));
      const expected=expectedIds(selected);
      assert.deepEqual(actual,expected);
      assert.equal(await page.locator('#empty-results').isVisible(),!expected.length);
      for (const id of actual) {
        const c=companies.find(c=>c.id===id);
        const priceText=await page.locator(`#search-results [data-company="${id}"] .directory-price`).innerText();
        // Independently obtain eligible plans, including overrides for the light plan.
        const eligible=c.plans.filter(p=>p.verified!==false && selected.every(k=>
          k==='budget' ? typeof p.initial==='number'&&p.initial<=50000 :
          k==='noMonthly' ? p.monthly===0 : Object.assign({},c.features,p.features)[k]===true));
        assert.equal(priceText,selected.length?eligible[0].price:c.price,`Primary price: ${mask}/${id}`);
      }
    }
    await page.goto(base+'/search.html?condition=%3Cscript%3E&category=unknown');
    assert.equal(await page.locator('#search-results article:visible').count(),0);
    await page.goto(base+'/search.html?condition=welfare&condition=welfare');
    assert.equal(await page.locator('#selected-conditions span').count(),1);
    await page.getByRole('button',{name:'メニューを開閉'}).click();
    assert.equal(await page.locator('#global-nav').isVisible(),true);
    for(const url of ['/index.html','/comparisons/group-home-comparison.html','/comparisons/welfare-comparison.html']) {
      await page.goto(base+url);assert.equal(await page.locator('h1').count(),1);
      await page.locator('.nav-toggle').click();assert.equal(await page.locator('#global-nav').isVisible(),true);
    }
    const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:900}});
    const fallback=await nojs.newPage();
    await fallback.goto(base+'/comparisons/b-type-comparison.html');
    assert.equal(await fallback.locator('.directory-mobile article').count(),4);
    await fallback.goto(base+'/search.html?condition=budget');
    assert.equal(await fallback.locator('#search-pending').isVisible(),true);
    assert.equal(await fallback.locator('#search-results').isVisible(),false);
    assert.deepEqual(errors,[]);
    assert.ok(fs.existsSync(path.join(root,'favicon.ico')));
    await page.setViewportSize({width:375,height:1000});
    await page.goto(base+'/search.html?condition=noMonthly');
    assert.equal(await page.locator('#search-results article:visible').count(),0);
    await page.screenshot({path:path.join(output,'no-monthly-375.png'),fullPage:true});
    await page.goto(base+'/search.html?condition=budget');
    assert.match(await page.locator('#search-results article:visible .directory-price').innerText(),/19,800円（税込）/);
    await page.screenshot({path:path.join(output,'budget-375.png'),fullPage:true});
    await page.goto(base+'/search.html?condition=maps');
    assert.equal(await page.locator('[data-company="fukushi-it-partner"] .directory-price').innerText(),'55,000円（税込）');
    // Isolated regression fixture: never published or written to company-data.js.
    // A real current zero-monthly plan is not verified, so exercise the formerly
    // broken paid-plan/zero-monthly display with test data in this browser only.
    await page.route('**/assets/js/company-data.js',async route=>{
      const fixture=`\nwindow.CompanyDirectory.companies.find(c=>c.id==='tomonico').plans=[
        {name:'検証用月額プラン',initial:0,monthly:9790,price:'初期0円・月額9,790円（税込）'},
        {name:'検証用月額なしプラン',initial:327800,monthly:0,price:'初期327,800円（税込）・月額0円'}];`;
      await route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(root,'assets/js/company-data.js'),'utf8')+fixture});
    });
    await page.goto(base+'/search.html?condition=noMonthly');
    assert.equal(await page.locator('#search-results article:visible .directory-price').innerText(),'初期327,800円（税込）・月額0円');
    assert.match(await page.locator('#search-results article:visible [data-price-note]').innerText(),/その他プラン：検証用月額プラン/);
    await page.getByLabel('初期費用5万円以下',{exact:true}).check();
    await page.getByRole('button',{name:'この条件で探す'}).click();
    await page.waitForURL('**/search.html?**condition=budget**');
    assert.equal(await page.locator('#search-results article:visible').count(),0);
    report.push('Independent oracle: 256 combinations / 0 mismatches (production function vs independent capability masks).');
    report.push(`${process.env.QA_LAYOUT_ONLY?'Layout recheck':'256 browser search combinations and primary prices'}; same-plan matching; recommended exclusion; unknown/duplicate parameters; back/forward; local links; mobile menu; 3 existing pages; no-JS; zero-monthly regression fixture: PASS`);
    fs.writeFileSync(path.join(output,'results.txt'),report.join('\n')+'\n');
    console.log(report.join('\n'));
  } finally {await browser.close();server.close();}
})().catch(err=>{console.error(err);server.close();process.exitCode=1;});
