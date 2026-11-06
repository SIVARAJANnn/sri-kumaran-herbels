import { mkdir, readdir, readFile, writeFile, copyFile, rename, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { suppliedVideos, suppliedVideoDirectory } from '../data/supplied-videos.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const ffmpeg = createRequire(import.meta.url)('@ffmpeg-installer/ffmpeg').path;
const batch = `supplied-${new Date().toISOString().replace(/[-:.TZ]/g, '')}`;
const stage = path.resolve(root, '.work', batch);
const destination = path.resolve(root, 'dist', 'frames', batch);
const archive = path.resolve(root, 'videos', batch);
for (const target of [stage, destination, archive]) {
  assert.ok(target.startsWith(path.resolve(root) + path.sep), 'Generated files must remain in this project.');
}
const fps = 24;
const variants = [
  { key: 'landscape', folder: 'desktop', width: 1920, height: 1080 },
  { key: 'portrait', folder: 'mobile', width: 1280, height: 720 }
];
const files = await readdir(suppliedVideoDirectory);
const sources = suppliedVideos.map(product => {
  const matches = files.filter(name =>
    (name.includes(product.identifier) || name === `${product.id}.mp4`) && name.toLowerCase().endsWith('.mp4'));
  assert.equal(matches.length, 1, `Expected exactly one supplied video for ${product.name}`);
  return { ...product, file: matches[0], path: path.join(suppliedVideoDirectory, matches[0]) };
});
await mkdir(stage, { recursive: true });
await mkdir(archive, { recursive: true });

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let errors = '';
    child.stderr.on('data', data => { errors = (errors + data.toString()).slice(-10000); });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`FFmpeg failed (${code}): ${errors}`)));
  });
}
async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
async function build(source) {
  console.log(`[${source.name}] Converting supplied video ${source.identifier}`);
  const result = { id: source.id, sourceIdentifier: source.identifier, sourceFile: source.file, fps, variants: {} };
  for (const variant of variants) {
    const directory = path.join(stage, source.id, variant.folder);
    await mkdir(directory, { recursive: true });
    await run(['-hide_banner', '-loglevel', 'error', '-i', source.path, '-an',
      '-vf', `fps=${fps},scale=${variant.width}:${variant.height}:flags=lanczos`,
      '-threads', '2', '-filter_threads', '1', '-c:v', 'libwebp', '-quality', variant.key === 'landscape' ? '82' : '79',
      '-compression_level', '4', '-vsync', '0', path.join(directory, '%04d.webp')]);
    const frames = (await readdir(directory)).filter(name => /^\d{4}\.webp$/.test(name)).sort();
    assert.ok(frames.length >= 180 && frames.length <= 200, `${source.name}: unexpected frame count ${frames.length}`);
    for (let i = 0; i < frames.length; i++) assert.equal(frames[i], `${String(i+1).padStart(4, '0')}.webp`);
    const basePath = `/frames/${batch}/${source.id}/${variant.folder}`;
    const manifest = {
      id: source.id, frameCount: frames.length, fps, width: variant.width, height: variant.height,
      durationSeconds: frames.length / fps, basePath, poster: `${basePath}/0001.webp`,
      sourceKind: 'user-supplied-google-flow-video', sourceIdentifier: source.identifier,
      preserveFullFrame: true, sourceAspectRatio: '16:9', optimizedFor: variant.folder
    };
    await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    result.variants[variant.key] = { manifest: `${basePath}/manifest.json`, frameCount: frames.length,
      bytes: (await Promise.all(frames.map(name => stat(path.join(directory, name))))).reduce((n, s) => n+s.size, 0) };
    console.log(`[${source.name}] ${variant.folder}: ${frames.length} frames at ${variant.width}×${variant.height}`);
  }
  assert.equal(result.variants.landscape.frameCount, result.variants.portrait.frameCount);
  await copyFile(source.path, path.join(archive, `${source.id}.mp4`));
  result.sha256 = await sha256(source.path);
  return result;
}

// Limit CPU and disk pressure to two soaps. Publish the registry once, after all
// conversions succeed, so parallel workers cannot overwrite each other's entries.
const results = [];
for (let i = 0; i < sources.length; i += 2) {
  const settled = await Promise.allSettled(sources.slice(i, i+2).map(build));
  for (const result of settled) {
    if (result.status === 'rejected') throw result.reason;
    results.push(result.value);
  }
}
console.log(`Validated move: ${stage} -> ${destination}`);
await mkdir(path.dirname(destination), { recursive: true });
await rename(stage, destination);
const media = Object.fromEntries(results.map(r => [r.id, {
  landscape: r.variants.landscape.manifest, portrait: r.variants.portrait.manifest
}]));
const previousRegistry = await readFile(path.join(root, 'dist/media.json'), 'utf8');
await writeFile(path.join(archive, 'previous-media.json'), previousRegistry);
await writeFile(path.join(root, 'dist/media.json'), JSON.stringify(media, null, 2) + '\n');
const report = { batch, generatedAt: new Date().toISOString(), sourceDirectory: suppliedVideoDirectory,
  sourceVideosUntouched: true, totalFrames: results.reduce((n, r) => n+r.variants.landscape.frameCount+r.variants.portrait.frameCount, 0),
  results };
await writeFile(path.join(root, 'supplied-video-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`COMPLETE: ${report.totalFrames} frames, six correct soap mappings, twelve optimized sequences.`);
console.log(`Registry: ${path.join(root, 'dist/media.json')}`);
