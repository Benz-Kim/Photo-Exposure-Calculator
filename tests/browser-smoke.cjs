// Optional real-browser check. Requires Playwright and a local Chromium installation.
// Start the app on port 5501 before running; the Node-only CI suite has no dependencies.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1050},deviceScaleFactor:1});
 const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push([r.url(),r.status()])});
 await page.goto('http://127.0.0.1:5501/');await page.waitForURL('**/exposure-index.html');
 assert.equal(await page.locator('html').getAttribute('lang'),'en');
 assert(!/[가-힣]/.test(await page.locator('body').innerText()));
 const boxes=await page.locator('.calc-panel').evaluateAll(els=>els.map(el=>({x:el.getBoundingClientRect().x,y:el.getBoundingClientRect().y})));
 assert.equal(boxes[0].y,boxes[2].y);assert(boxes[0].x<boxes[1].x);
 await page.screenshot({path:'/tmp/exposure-desktop.png',fullPage:true});
 // Release screenshots are captured separately, so verification never changes repository assets.
 const target=await page.evaluate(()=>targetEV);
 await page.locator('#sl-shutter').focus();await page.keyboard.press('ArrowRight');
 assert.equal(await page.evaluate(()=>targetEV),target);
 assert.equal(await page.locator('#sl-iso').isDisabled(),true);
 await page.locator('#lock-aperture').click();
 assert.equal(await page.locator('#sl-aperture').isDisabled(),true);
 assert.equal(await page.locator('#lock-aperture').getAttribute('aria-pressed'),'true');
 for(const key of ['sunny','indoor','night','portrait','sport']){
  await page.locator('#preset-'+key).click();assert.equal(await page.locator('#preset-'+key).getAttribute('aria-pressed'),'true');
  assert.equal(await page.evaluate(()=>Object.values(locks).filter(Boolean).length),2);
 }
 await page.locator('.reset-button').click();assert.equal(await page.evaluate(()=>activePreset),null);
 assert.equal(await page.evaluate(()=>idx.shutter),12);
 for(const width of [320,390,640,768,1024]){
 await page.setViewportSize({width,height:900});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'overflow '+width);
 if(width<=640){await page.locator('#mpn-iso').click();assert(await page.locator('#panel-iso').isVisible());assert.equal(await page.locator('#mpn-iso').getAttribute('aria-pressed'),'true');}
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'/tmp/exposure-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});assert.equal(await page.locator('.calc-panel:visible').count(),3);
 await page.locator('#exif-file-input').setInputFiles({name:'no-metadata.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64')});
 await page.waitForFunction(()=>!document.querySelector('#exif-chips').innerText.includes('Reading'));
 assert(/No shutter|Could not read/.test(await page.locator('#exif-chips').innerText()));
 assert.equal(await page.locator('#exif-apply-btn').isVisible(),false);
 assert.equal(errors.length,0,errors.join('\n'));assert.deepEqual(failed,[]);
 console.log('PASS: English UI, desktop 3 columns, keyboard solving, mode states, 5 presets, reset, 320–1440px layouts, mobile navigation and resize, real metadata-reader loading/no-metadata recovery, no JS exceptions or HTTP errors.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
