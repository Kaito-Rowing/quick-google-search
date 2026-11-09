import { chromium } from '@playwright/test';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const profile = await mkdtemp(join(tmpdir(), 'qgs-demo-'));
const extension = resolve('.');
const context = await chromium.launchPersistentContext(profile, {
  channel: 'chromium', headless: true,
  viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1,
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
});
try {
  await context.route('http://qgs-demo.test/**', route => route.fulfill({ contentType: 'text/html', body: `
    <!doctype html><html lang="en"><meta charset="utf-8"><title>Quick Google Search demo</title>
    <style>
      *{box-sizing:border-box} body{margin:0;background:#f3f5f8;color:#172b3e;font-family:Arial,sans-serif}
      header{height:76px;padding:0 68px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #dce2e9;font-size:15px}
      header strong{letter-spacing:-.5px;font-size:20px} header span{color:#69788a}
      main{display:grid;grid-template-columns:1fr 300px;gap:68px;padding:66px 88px}
      .eyebrow{color:#43715b;letter-spacing:2px;font-size:12px;font-weight:bold}
      h1{font-size:56px;line-height:1.1;letter-spacing:-2px;margin:20px 0 22px;font-weight:600}
      .meta{font-size:14px;color:#7b8795;margin-bottom:38px}
      p{font-size:21px;line-height:1.85;color:#435267;margin:0 0 22px}
      ::selection{background:#cdddff;color:#123e88}
      aside{margin-top:102px;border-left:2px solid #dce2e9;padding:0 0 0 28px}
      aside small{font-size:12px;letter-spacing:2px;color:#69788a} aside h2{font-size:26px;line-height:1.3;margin:20px 0 14px}
      aside p{font-size:16px;line-height:1.7} .step{display:inline-block;background:#e1eae5;color:#276344;border-radius:20px;font-size:12px;padding:7px 12px;margin-top:14px}
      footer{margin:4px 88px;border-top:1px solid #dce2e9;padding-top:22px;display:flex;justify-content:space-between;color:#7b8795;font-size:12px}
    </style>
    <header><strong>Fieldnotes</strong><span>A sample reading page</span></header>
    <main><article><div class="eyebrow">IDEAS WORTH FOLLOWING</div><h1>Let curiosity<br>lead the way.</h1>
    <div class="meta">A quiet moment for a new idea · 3 min read</div>
    <p>Every good question starts with something small: a phrase in an article, a surprising connection, a word you want to understand.</p>
    <p>That spark has a name: <span id="selection">serendipity</span>.</p>
    <p>Follow it. There is always a little more to discover.</p></article>
    <aside><small>QUICK GOOGLE SEARCH</small><h2>Your next search,<br>right here.</h2><p>Select a word or passage.<br>Click the round search button.<br>Explore in a new tab.</p><span class="step">Select → Click → Explore</span></aside></main>
    <footer><span>Actual extension · Demonstration page</span><span>No setup. No saved selections.</span></footer></html>
  ` }));
  const page = await context.newPage();
  await page.goto('http://qgs-demo.test');
  await page.locator('#selection').evaluate(el => {
    const range = document.createRange(); range.selectNodeContents(el);
    getSelection().removeAllRanges(); getSelection().addRange(range);
  });
  await page.locator('quick-google-search').getByRole('button').waitFor({ state: 'visible' });
  await mkdir('docs', { recursive: true });
  await page.screenshot({ path: 'docs/store-screenshot.png' });
  await sharp('docs/store-screenshot.png').resize(1120, 700).png().toFile('docs/demo.png');
  console.log('Captured actual selection button: docs/demo.png and docs/store-screenshot.png');
} finally {
  await context.close();
  await rm(profile, { recursive: true, force: true });
}
