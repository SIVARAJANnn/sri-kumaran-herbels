import { mkdir, readFile, writeFile, readdir, rename, access, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { products } from '../data/products.mjs';

const root=fileURLToPath(new URL('..',import.meta.url));
const [id,inputArg,...options]=process.argv.slice(2);
if(!products.some(p=>p.id===id)||!inputArg){
  console.error('Usage: npm run frames -- <aloe|avaram|kuppaimeni|orange|sandal|charcoal> <accepted-video.mp4> [--fps=15]');
  process.exit(1);
}
const fps=Number(options.find(v=>v.startsWith('--fps='))?.split('=')[1]||15);
if(!Number.isInteger(fps)||fps<6||fps>30)throw Error('FPS must be an integer between 6 and 30.');
const selectedVariant=options.find(v=>v.startsWith('--variant='))?.split('=')[1]||'both';
if(!['both','landscape','portrait'].includes(selectedVariant))throw Error('Variant must be landscape, portrait, or both.');
const input=path.resolve(inputArg);await access(input);
let ffmpeg=process.env.FFMPEG_PATH;
if(!ffmpeg){try{ffmpeg=createRequire(import.meta.url)('@ffmpeg-installer/ffmpeg').path;}catch{throw Error('Install development dependencies first, or configure FFMPEG_PATH.');}}
const token=`${id}-${Date.now()}`;
const work=path.join(root,'.work',token);
const target=path.join(root,'dist','frames',id,token);
await mkdir(work,{recursive:true});
async function run(args){await new Promise((resolve,reject)=>{
  const child=spawn(ffmpeg,args,{stdio:['ignore','ignore','pipe']});let errors='';
  child.stderr.on('data',b=>{errors=(errors+b.toString()).slice(-8000);});
  child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error(`FFmpeg failed (${code}): ${errors}`)));
});}
const media=JSON.parse(await readFile(path.join(root,'dist/media.json'),'utf8'));
for(const [variant,width,height]of[['landscape',1280,720],['portrait',720,1280]]){
  if(selectedVariant!=='both'&&selectedVariant!==variant)continue;
  const directory=path.join(work,variant);await mkdir(directory,{recursive:true});
  const background=products.find(p=>p.id===id).dark.replace('#','0x');
  await run(['-hide_banner','-loglevel','error','-i',input,'-an','-vf',`fps=${fps},scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${background}`, '-c:v','libwebp','-quality','80','-compression_level','5','-vsync','0',path.join(directory,'%04d.webp')]);
  const frames=(await readdir(directory)).filter(n=>/^\d{4}\.webp$/.test(n)).sort();
  if(frames.length<2)throw Error('Video did not yield a usable frame sequence.');
  const basePath=`/frames/${id}/${token}/${variant}`;
  const manifest={id,variant,frameCount:frames.length,fps,width,height,durationSeconds:frames.length/fps,basePath,sourceKind:'accepted-video',fit:'contain',preserveFullFrame:true};
  await writeFile(path.join(directory,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  media[id][variant]=`${basePath}/manifest.json`;
  console.log(`${id}/${variant}: ${frames.length} WebP frames, ${width}×${height}, ${fps} fps.`);
}
await mkdir(path.dirname(target),{recursive:true});await rename(work,target);
await writeFile(path.join(root,'dist/media.json'),JSON.stringify(media,null,2)+'\n');
await mkdir(path.join(root,'videos'),{recursive:true});
const archive=path.join(root,'videos',`${token}${path.extname(input)}`);
await copyFile(input,archive);
console.log(`Both responsive sequences registered. Accepted source archived at ${archive}`);
