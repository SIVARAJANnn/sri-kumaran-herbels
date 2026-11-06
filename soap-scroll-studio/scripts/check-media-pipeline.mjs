import { mkdtemp, mkdir, copyFile, writeFile, readFile, readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { products } from '../data/products.mjs';

const root=fileURLToPath(new URL('..',import.meta.url));
const ffmpeg=createRequire(import.meta.url)('@ffmpeg-installer/ffmpeg').path;
await mkdir(path.join(root,'.work'),{recursive:true});
const fixture=await mkdtemp(path.join(root,'.work','pipeline-check-'));
for(const name of['scripts','data','dist'])await mkdir(path.join(fixture,name));
await copyFile(path.join(root,'scripts/extract-frames.mjs'),path.join(fixture,'scripts/extract-frames.mjs'));
await copyFile(path.join(root,'data/products.mjs'),path.join(fixture,'data/products.mjs'));
await writeFile(path.join(fixture,'dist/media.json'),JSON.stringify(Object.fromEntries(products.map(p=>[p.id,{landscape:null,portrait:null}]))));
function run(command,args,cwd=fixture){return new Promise((resolve,reject)=>{
  const child=spawn(command,args,{cwd,stdio:['ignore','pipe','pipe']});let text='';
  child.stdout.on('data',data=>{text+=data;});child.stderr.on('data',data=>{text+=data;});
  child.once('error',reject);child.once('exit',code=>code===0?resolve(text):reject(Error(text)));
});}
const source=path.join(fixture,'test-pattern.mp4');
await run(ffmpeg,['-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc=size=320x180:rate=10','-t','1','-c:v','libx264','-pix_fmt','yuv420p',source]);
await run(process.execPath,[path.join(fixture,'scripts/extract-frames.mjs'),'aloe',source,'--fps=10']);
const registry=JSON.parse(await readFile(path.join(fixture,'dist/media.json'),'utf8'));
for(const variant of['landscape','portrait']){
  const file=path.join(fixture,'dist',registry.aloe[variant].slice(1));
  const manifest=JSON.parse(await readFile(file,'utf8'));
  assert.equal(manifest.frameCount,10);
  assert.equal(manifest.preserveFullFrame,true);
  const frames=(await readdir(path.dirname(file))).filter(name=>name.endsWith('.webp'));
  assert.equal(frames.length,10);
}
assert.equal(registry.charcoal.landscape,null);
console.log('Verified actual MP4 → 10 landscape + 10 portrait WebP frames; real production registry remained untouched.');
console.log(`Temporary verification fixture: ${fixture}`);
