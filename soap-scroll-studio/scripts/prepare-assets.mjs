import { copyFile, mkdir, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { products, videoPrompt } from '../data/products.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = path.resolve(root, '..', 'SRI KUMARAN HERBALS collection');
await mkdir(path.join(root, 'dist/assets'), { recursive: true });
await mkdir(path.join(root, 'references'), { recursive: true });
for (const product of products) {
  await copyFile(path.join(source, product.photo), path.join(root, `dist/assets/${product.id}-photo.jpg`));
  await copyFile(path.join(source, product.bar), path.join(root, `dist/assets/${product.id}-bar.jpg`));
  await copyFile(path.join(source, product.box), path.join(root, `dist/assets/${product.id}-box.jpg`));
  await copyFile(path.join(source, product.bar), path.join(root, `references/${product.id}.jpg`));
}
const publicProducts = products.map(({ id, number, name, botanical, line, description, color, light, dark }) =>
  ({ id, number, name, botanical, line, description, color, light, dark }));
await writeFile(path.join(root, 'dist/products.json'), JSON.stringify(publicProducts, null, 2) + '\n');
await writeFile(path.join(root, 'video-prompts.json'), JSON.stringify(products.map(p => ({
  id: p.id, name: p.name, reference: `references/${p.id}.jpg`, durationSeconds: 8,
  prompt: videoPrompt(p), status: 'reference-only-user-videos-supplied'
})), null, 2) + '\n');
const mediaPath = path.join(root, 'dist/media.json');
try { await access(mediaPath); } catch {
  await writeFile(mediaPath, JSON.stringify(Object.fromEntries(products.map(p => [p.id, {
    landscape: null, portrait: null
  }])), null, 2) + '\n');
}
console.log('Prepared 18 original product images, six video references, and six generation briefs.');
