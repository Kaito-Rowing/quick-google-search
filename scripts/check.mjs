import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const read = path => readFile(new URL(`../${path}`, import.meta.url));
const manifest = JSON.parse(await read('manifest.json'));
const pkg = JSON.parse(await read('package.json'));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.version, pkg.version);
assert.deepEqual(manifest.permissions, []);
assert.deepEqual(manifest.content_scripts[0].matches, ['http://*/*', 'https://*/*']);
for (const script of manifest.content_scripts[0].js) await read(script);
for (const [size, path] of Object.entries(manifest.icons)) {
  const metadata = await sharp(await read(path)).metadata();
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.width, Number(size));
  assert.equal(metadata.height, Number(size));
}
for (const locale of ['en', 'ja']) {
  const messages = JSON.parse(await read(`_locales/${locale}/messages.json`));
  assert.ok(messages.searchLabel.message);
  assert.ok(messages.extensionDescription.message.length <= 132);
}
console.log('Manifest, locales, assets and versions verified.');
