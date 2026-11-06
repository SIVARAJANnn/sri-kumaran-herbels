import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { products } from '../data/products.mjs';
import { suppliedVideos, suppliedVideoDirectory } from '../data/supplied-videos.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const json = async file => JSON.parse(await readFile(file, 'utf8'));
const data = await json(path.join(root, 'dist/products.json'));
const media = await json(path.join(root, 'dist/media.json'));
const report = await json(path.join(root, 'supplied-video-report.json'));
assert.deepEqual(data.map(product => product.id), ['orange','avaram','charcoal','sandal','aloe','kuppaimeni']);
assert.deepEqual(data.map(product => product.number), ['01','02','03','04','05','06']);
assert.deepEqual(products.map(product => product.id), data.map(product => product.id));
assert.equal(report.sourceVideosUntouched, true);
let totalFrames = 0, totalBytes = 0, variants = 0;

for (const product of products) {
  for (const suffix of ['photo','bar','box']) await access(path.join(root, `dist/assets/${product.id}-${suffix}.jpg`));
  const supplied = suppliedVideos.find(video => video.id === product.id);
  const result = report.results.find(video => video.id === product.id);
  assert.equal(result.sourceIdentifier, supplied.identifier);
  for (const [variant, width, height] of [['landscape',1920,1080],['portrait',1280,720]]) {
    const url = media[product.id][variant];
    assert.equal(url, result.variants[variant].manifest);
    assert.ok(url.startsWith(`/frames/${report.batch}/${product.id}/`));
    const file = path.join(root, 'dist', url.slice(1));
    const manifest = await json(file);
    assert.equal(manifest.id, product.id);
    assert.equal(manifest.sourceIdentifier, supplied.identifier);
    assert.equal(manifest.sourceKind, 'user-supplied-google-flow-video');
    assert.equal(manifest.frameCount, 190);
    assert.equal(manifest.fps, 24);
    assert.equal(manifest.width, width);
    assert.equal(manifest.height, height);
    assert.equal(manifest.preserveFullFrame, true);
    assert.equal(manifest.poster, `${manifest.basePath}/0001.webp`);
    const frames = (await readdir(path.dirname(file))).filter(name => /^\d{4}\.webp$/.test(name)).sort();
    assert.equal(frames.length, manifest.frameCount);
    for (let index = 0; index < frames.length; index++) {
      assert.equal(frames[index], `${String(index+1).padStart(4,'0')}.webp`);
      const content = await readFile(path.join(path.dirname(file), frames[index]));
      assert.equal(content.toString('ascii',0,4), 'RIFF');
      assert.equal(content.toString('ascii',8,12), 'WEBP');
      totalBytes += content.length;
    }
    totalFrames += frames.length; variants++;
  }
  const originals = await readdir(suppliedVideoDirectory);
  const original = originals.find(name => name === result.sourceFile || name === `${product.id}.mp4`);
  assert.ok(original, `${product.name}: supplied original is missing`);
  for (const file of new Set([path.join(suppliedVideoDirectory,original), path.join(root,'videos',report.batch,`${product.id}.mp4`)])) {
    const digest = createHash('sha256').update(await readFile(file)).digest('hex');
    assert.equal(digest, result.sha256, `${product.name}: original/archive integrity`);
  }
}
assert.equal(variants, 12);
assert.equal(totalFrames, 2280);
assert.equal(report.totalFrames, totalFrames);
console.log(`Verified all six soaps in the approved order, 18 product photos, ${variants} complete sequences and ${totalFrames} valid WebP frames.`);
console.log(`Frame assets: ${(totalBytes/1024/1024).toFixed(1)} MiB. Every supplied original and archived video matches its SHA-256 checksum.`);
