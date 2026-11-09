import { test as base, expect, chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Selection fixture</title>
<style>body{margin:64px;font:20px/1.7 system-ui;background:#f7f8fa;color:#17223b} p{max-width:650px}
button{border:12px solid red!important;background:magenta!important;padding:24px!important;border-radius:0!important}
quick-google-search{background:magenta!important;border:10px solid red!important;box-shadow:0 0 0 9px red!important}
</style><h1>Find your next thought.</h1>
<p id="text">日本語 & café + #privacy / 検索</p><p id="other">A different selection.</p>
<p id="space">   </p><input id="input" value="private input"><input id="password" type="password" value="secret">
<textarea id="textarea">private draft</textarea><div contenteditable id="editor">private editor</div>
<div style="height:1800px"></div></html>`;

const test = base.extend({
  context: async ({}, use) => {
    const profile = await mkdtemp(join(tmpdir(), 'qgs-test-'));
    const extension = resolve(process.env.QGS_EXTENSION_PATH || '.');
    const context = await chromium.launchPersistentContext(profile, {
      channel: 'chromium', headless: true,
      args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
      viewport: { width: 1000, height: 720 }
    });
    await use(context);
    await context.close();
    await rm(profile, { recursive: true, force: true });
  },
  page: async ({ context }, use) => {
    const server = createServer((req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await use(page);
    await page.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});

const icon = page => page.locator('quick-google-search').getByRole('button');
async function select(page, id = 'text') {
  await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  // Let scroll/resize events finish before beginning a new selection.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.locator(`#${id}`).evaluate(el => {
    const range = document.createRange(); range.selectNodeContents(el);
    const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
  });
}

test('real extension injects; search safely encodes Unicode and special characters', async ({ page, context }) => {
  await context.route('https://www.google.com/**', route => route.fulfill({ body: '<title>Search destination</title>' }));
  await select(page);
  await expect(icon(page)).toBeVisible();
  const popupPromise = context.waitForEvent('page');
  await icon(page).click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  expect(new URL(popup.url()).searchParams.get('q')).toBe('日本語 & café + #privacy / 検索');
  expect(await popup.evaluate(() => window.opener)).toBeNull();
  expect(await popup.evaluate(() => document.referrer)).toBe('');
  await expect(icon(page)).toBeHidden();
});

test('round button survives hostile page CSS without a square wrapper', async ({ page }) => {
  await select(page);
  await expect(icon(page)).toBeVisible();
  const style = await icon(page).evaluate(el => {
    const s = getComputedStyle(el); const h = getComputedStyle(el.getRootNode().host);
    return { radius: s.borderRadius, border: s.borderWidth, width: s.width, background: h.backgroundColor, hostBorder: h.borderWidth, shadow: h.boxShadow };
  });
  expect(style).toEqual({ radius: '50%', border: '0px', width: '40px', background: 'rgba(0, 0, 0, 0)', hostBorder: '0px', shadow: 'none' });
});

test('Escape, collapsed selection, scroll and resize dismiss the button', async ({ page }) => {
  await select(page); await expect(icon(page)).toBeVisible();
  await page.keyboard.press('Escape'); await expect(icon(page)).toBeHidden();
  await select(page, 'other'); await expect(icon(page)).toBeVisible();
  await page.evaluate(() => getSelection().removeAllRanges()); await expect(icon(page)).toBeHidden();
  await select(page); await expect(icon(page)).toBeVisible();
  await page.mouse.wheel(0, 200); await expect(icon(page)).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, 0));
  await select(page, 'other'); await expect(icon(page)).toBeVisible();
  await page.setViewportSize({ width: 800, height: 600 }); await expect(icon(page)).toBeHidden();
});

for (const key of ['Enter', 'Space']) test(`keyboard selection and ${key} activation work`, async ({ page, context }) => {
  await context.route('https://www.google.com/**', route => route.fulfill({ body: 'Search' }));
  // Begin with a real mouse selection, then change it using Shift + Arrow.
  await page.locator('#other').dblclick({ position: { x: 25, y: 15 } });
  await expect(icon(page)).toBeVisible();
  const before = await page.evaluate(() => getSelection().toString());
  await page.keyboard.press('Shift+ArrowRight');
  expect(await page.evaluate(() => getSelection().toString())).not.toBe(before);
  await expect(icon(page)).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(icon(page)).toBeFocused();
  const popup = context.waitForEvent('page');
  await page.keyboard.press(key);
  const destination = await popup;
  await destination.waitForLoadState();
  expect(new URL(destination.url()).searchParams.get('q')).not.toBe(before);
});

test('editors, password fields and empty selections are excluded', async ({ page }) => {
  for (const id of ['input', 'textarea', 'password']) {
    await page.locator(`#${id}`).focus(); await page.keyboard.press('Control+a');
    await page.waitForTimeout(60); await expect(icon(page)).toBeHidden();
  }
  await page.locator('#editor').focus(); await select(page, 'editor');
  await page.waitForTimeout(60); await expect(icon(page)).toBeHidden();
  await page.locator('#editor').blur(); await select(page, 'space');
  await page.waitForTimeout(60); await expect(icon(page)).toBeHidden();
});

test('selection changes refresh the query; synthetic clicks cannot navigate', async ({ page, context }) => {
  await select(page); await expect(icon(page)).toBeVisible();
  const count = context.pages().length;
  await icon(page).evaluate(el => el.click());
  await expect(icon(page)).toBeHidden();
  expect(context.pages()).toHaveLength(count);
  await select(page, 'other'); await expect(icon(page)).toBeVisible();
  await context.route('https://www.google.com/**', route => route.fulfill({ body: 'Search' }));
  const popup = context.waitForEvent('page'); await icon(page).click();
  const destination = await popup; await destination.waitForLoadState();
  expect(new URL(destination.url()).searchParams.get('q')).toBe('A different selection.');
});

test('button stays within a small viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 300 });
  await select(page); await expect(icon(page)).toBeVisible();
  const box = await icon(page).boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(8); expect(box.y).toBeGreaterThanOrEqual(8);
  expect(box.x + box.width).toBeLessThanOrEqual(352);
  expect(box.y + box.height).toBeLessThanOrEqual(292);
});
