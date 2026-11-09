import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { zipSync, unzipSync } from 'fflate';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root)));
const paths = ['manifest.json', 'content.js', 'LICENSE', 'PRIVACY.md', 'docs/PRIVACY.ja.md',
  ...Object.values(manifest.icons), '_locales/en/messages.json', '_locales/ja/messages.json'];
const files = {};
for (const path of paths) files[path] = new Uint8Array(await readFile(new URL(path, root)));
const archive = zipSync(files, { level: 9 });
assert.deepEqual(Object.keys(unzipSync(archive)).sort(), paths.sort());
await mkdir(new URL('dist/', root), { recursive: true });
const name = `quick-google-search-${manifest.version}.zip`;
await writeFile(new URL(`dist/${name}`, root), archive);
console.log(`Created dist/${name} (${archive.length} bytes). Runtime files only; manifest at ZIP root.`);
