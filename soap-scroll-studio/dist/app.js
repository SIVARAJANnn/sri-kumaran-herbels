const $ = selector => document.querySelector(selector);
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobileViewport = matchMedia('(max-width: 760px)');
// Keep a stable 16:9 composition inside the supplied film's edges.
// This excludes the corner stars from both the film and its background surround.
const filmInset = .125;
const filmTop = { charcoal: .08 };
const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));
const splitLine = text => Array.from(text).map((character, index) =>
  `<span class="char" aria-hidden="true" style="--letter:${index}">${character === ' ' ? '&nbsp;' : escapeHTML(character)}</span>`).join('');

let products, media;
try {
  const responses = await Promise.all([fetch('/products.json'), fetch('/media.json')]);
  if (responses.some(response => !response.ok)) throw Error('Collection data is unavailable.');
  [products, media] = await Promise.all(responses.map(response => response.json()));
} catch {
  $('.preloader-caption').textContent = 'The collection needs another moment.';
  $('.preloader-retry').hidden = false;
  $('.preloader-retry').onclick = () => location.reload();
  throw Error('Unable to load collection metadata.');
}

$('#stories').innerHTML = products.map((product, index) => {
  const [first, second] = product.line.split('\n');
  const heading = index === 0 ? 'h1' : 'h2';
  return `<section class="story" id="${product.id}" aria-label="${escapeHTML(product.name)} Herbal Soap"
      style="--color:${product.color};--light:${product.light};--dark:${product.dark}">
    <div class="stage">
      <canvas role="img" aria-label="${escapeHTML(product.name)} soap: animation controlled by scrolling"></canvas>
      <div class="stage-light" aria-hidden="true"></div>
      <div class="chapter-header">
        <p class="eyebrow">SRI KUMARAN HERBALS · THE ${escapeHTML(product.name.toUpperCase())} RITUAL</p>
        <${heading} aria-label="${escapeHTML(first)} ${escapeHTML(second)}"><span class="line">${splitLine(first)}</span><span class="line line-italic">${splitLine(second)}</span></${heading}>
        <p class="chapter-subtitle">${index === 0 ? 'Handmade herbal soaps. Six botanical stories to make your own.' : escapeHTML(product.description)}</p>
      </div>
      <div class="chapter-label"><span class="number">${product.number}</span><div><div class="label-title">${escapeHTML(product.name)}</div><div class="label-meta">HERBAL BATH SOAP · 100 G</div></div></div>
      <aside class="story-notes" aria-label="About ${escapeHTML(product.name)} soap" inert>
        <p class="eyebrow">BOTANICAL ${product.number} / 06</p><h3>${escapeHTML(product.name)}<br><em>Herbal Soap</em></h3>
        <p class="notes-description">${escapeHTML(product.description)}</p>
        <a href="#${products[index+1]?.id || 'collection'}">${index < products.length-1 ? `Discover ${escapeHTML(products[index+1].name)}` : 'Explore the collection'}<span aria-hidden="true">↗</span></a>
      </aside>
      <div class="scroll-cue" aria-hidden="true"><span>SCROLL TO DISCOVER</span><i></i></div>
      <div class="scene-progress" aria-hidden="true"><i></i></div>
    </div>
  </section>`;
}).join('');

$('.product-grid').innerHTML = products.map(product => `<article class="product-card">
  <a class="product-image" href="#${product.id}" aria-label="Explore ${escapeHTML(product.name)} soap">
    <img src="/assets/${product.id}-box.jpg" alt="${escapeHTML(product.name)} Herbal Soap packaging" width="1024" height="1024" loading="lazy">
    <span class="product-view">Explore the ritual <i aria-hidden="true">↗</i></span>
  </a>
  <div class="product-description"><h3>${escapeHTML(product.name)}</h3><span>100 G</span></div>
  <p>Handmade herbal bath soap</p></article>`).join('');
$('.chapter-rail').innerHTML = products.map(product => `<a href="#${product.id}" aria-label="Chapter ${product.number}: ${escapeHTML(product.name)}"><span>${escapeHTML(product.name)}</span></a>`).join('');
$('#collection-menu').innerHTML = `<p class="eyebrow">SIX BOTANICAL STORIES</p>${products.map(product =>
  `<a href="#${product.id}"><small>${product.number}</small>${escapeHTML(product.name)}<span aria-hidden="true">↗</span></a>`).join('')}<a class="menu-all" href="#collection">The complete collection<span aria-hidden="true">↗</span></a>`;

// One global queue bounds concurrent downloads and lets the active frame move to
// the front immediately when scrolling changes direction or jumps chapters.
class FrameQueue {
  constructor() { this.tasks = []; this.running = 0; this.limit = 5; }
  add(task) { this.tasks.push(task); this.pump(); }
  pump() {
    this.tasks.sort((a,b) => a.priority-b.priority);
    while (this.running < this.limit && this.tasks.length) {
      const task = this.tasks.shift();
      if (task.cancelled) continue;
      this.running++;
      task.run().finally(() => { this.running--; this.pump(); });
    }
  }
  cancel(owner, keep = () => false) {
    for (const task of owner.pending.values()) {
      if (keep(task)) continue;
      task.cancelled = true;
      task.controller.abort();
      if (!task.started) { owner.pending.delete(task.index); task.resolve(null); }
    }
    this.tasks = this.tasks.filter(task => !task.cancelled);
  }
}
const frameQueue = new FrameQueue();
let raf = 0, ready = false, activeIndex = -1, smoothedProgress = 0;
let lastScroll = scrollY, direction = 1;
function schedule() { if (!raf) raf = requestAnimationFrame(update); }

class SoapSequence {
  constructor(product, element) {
    this.product = product; this.element = element;
    this.canvas = element.querySelector('canvas');
    this.context = this.canvas.getContext('2d', { alpha: false });
    this.surround = document.createElement('canvas');
    this.surround.width = this.surround.height = 2;
    this.surroundContext = this.surround.getContext('2d', { alpha: false });
    this.header = element.querySelector('.chapter-header');
    this.notes = element.querySelector('.story-notes');
    this.cue = element.querySelector('.scroll-cue');
    this.progressBar = element.querySelector('.scene-progress i');
    this.cache = new Map(); this.pending = new Map(); this.failed = new Set();
    this.epoch = 0; this.manifest = null; this.url = null; this.metadataPromise = null; this.loadError = false;
    this.active = false; this.warm = false; this.wantedIndex = 0; this.drawnIndex = -1;
    this.poster = new Image(); this.poster.decoding = 'async';
    this.poster.onload = () => { this.dirty = true; schedule(); };
    this.dirty = true; this.currentProgress = 0;
  }
  async prepare() {
    const entry = media[this.product.id];
    const url = mobileViewport.matches ? entry?.portrait || entry?.landscape : entry?.landscape || entry?.portrait;
    if (!url) throw Error(`No video sequence registered for ${this.product.name}.`);
    if (this.url === url && this.manifest) return this.manifest;
    if (this.url === url && this.metadataPromise) return this.metadataPromise;
    this.clear(); this.url = url; const epoch = this.epoch;
    this.metadataPromise = (async () => {
      const response = await fetch(url);
      if (!response.ok) throw Error(`Unable to load ${this.product.name}.`);
      const manifest = await response.json();
      if (!Number.isInteger(manifest.frameCount) || manifest.frameCount < 2 || !manifest.basePath) throw Error('Invalid video frame manifest.');
      if (this.epoch !== epoch) return null;
      this.manifest = manifest; this.poster.src = manifest.poster || `${manifest.basePath}/0001.webp`;
      return manifest;
    })();
    try { return await this.metadataPromise; }
    catch (error) { if (this.epoch === epoch) this.loadError = true; throw error; }
    finally { if (this.epoch === epoch) this.metadataPromise = null; }
  }
  clear() {
    this.epoch++; frameQueue.cancel(this);
    for (const image of this.cache.values()) image.close?.();
    this.cache.clear(); this.pending.clear(); this.failed.clear(); this.manifest = null; this.loadError = false;
    this.metadataPromise = null; this.url = null; this.drawnIndex = -1; this.dirty = true;
  }
  trim() {
    const limit = this.active ? (mobileViewport.matches ? 14 : 26) : 2;
    for (const [index, image] of this.cache) {
      if (this.cache.size <= limit) break;
      if (index === this.wantedIndex || index === 0) continue;
      image.close?.(); this.cache.delete(index);
    }
  }
  request(index, priority = 10, essential = false) {
    if (!this.manifest || index < 0 || index >= this.manifest.frameCount) return Promise.resolve(null);
    if (this.cache.has(index)) return Promise.resolve(this.cache.get(index));
    if (this.failed.has(index)) return Promise.resolve(null);
    if (this.pending.has(index)) {
      const task = this.pending.get(index); task.priority = Math.min(task.priority, priority); return task.promise;
    }
    const epoch = this.epoch;
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    const task = { index, owner: this, priority, essential, resolve, promise, started: false,
      cancelled: false, controller: new AbortController(), run: async () => {
        task.started = true;
        try {
          const url = `${this.manifest.basePath}/${String(index+1).padStart(4,'0')}.webp`;
          const response = await fetch(url, { signal: task.controller.signal });
          if (!response.ok) throw Error('Frame unavailable');
          const blob = await response.blob();
          let image;
          if ('createImageBitmap' in window) image = await createImageBitmap(blob);
          else {
            const objectURL = URL.createObjectURL(blob); image = new Image(); image.src = objectURL;
            try { await image.decode(); } finally { URL.revokeObjectURL(objectURL); }
          }
          if (task.cancelled || this.epoch !== epoch) { image.close?.(); resolve(null); return; }
          this.cache.set(index, image); this.trim(); this.dirty = true;
          resolve(image); if (this.active || !ready) schedule();
        } catch (error) {
          if (error.name !== 'AbortError' && this.epoch === epoch) this.failed.add(index);
          resolve(null);
        } finally { if (this.pending.get(index) === task) this.pending.delete(index); }
      }
    };
    this.pending.set(index, task); frameQueue.add(task); return promise;
  }
  windowAt(index) {
    this.wantedIndex = index;
    frameQueue.cancel(this, task => task.essential || (reducedMotion.matches ? task.index === 0 : Math.abs(task.index-index) <= 18));
    this.request(index, 0);
    if (reducedMotion.matches) { this.trim(); return; }
    for (let distance = 1; distance <= (mobileViewport.matches ? 7 : 10); distance++) {
      this.request(index + direction*distance, distance);
      if (distance <= 4) this.request(index-direction*distance, 10+distance);
    }
    this.trim();
  }
  setActivity(active, warm) {
    this.active = active; this.warm = warm;
    if (!active) {
      frameQueue.cancel(this, task => warm && task.index === 0);
      this.trim();
      if (!warm) {
        for (const image of this.cache.values()) image.close?.();
        this.cache.clear(); this.drawnIndex = -1; this.dirty = true;
      }
    }
  }
  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const width = Math.round(bounds.width*dpr), height = Math.round(bounds.height*dpr);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width; this.canvas.height = height; this.dirty = true;
    }
  }
  paint(image) {
    const context = this.context, width = this.canvas.width, height = this.canvas.height;
    const iw = image.naturalWidth || image.width, ih = image.naturalHeight || image.height;
    if (!iw || !ih) return;
    const sx = Math.round(iw*filmInset), sy = Math.round(ih*(filmTop[this.product.id] ?? filmInset));
    const sw = iw-2*sx, sh = Math.round(ih*(1-2*filmInset));
    const scale = Math.min(width/sw, height/sh);
    const drawWidth = sw*scale, drawHeight = sh*scale;
    const x = (width-drawWidth)/2;
    const center = mobileViewport.matches ? .59 : .5;
    const y = clamp(height*center-drawHeight/2, 0, height-drawHeight);
    // Four tiny samples make a soft, live background. Avoid stretching the
    // soap's shadow into vertical bands, or sampling the excluded corner.
    for (const [column,row] of [[0,0],[1,0],[0,1],[1,1]]) {
      this.surroundContext.drawImage(image,
        column ? sx+sw-4 : sx, row ? sy+sh-4 : sy, 4,4,
        column,row,1,1);
    }
    context.imageSmoothingEnabled = true;
    context.drawImage(this.surround,0,0,width,height);
    context.drawImage(image,sx,sy,sw,sh,x,y,drawWidth,drawHeight);
    this.canvas.dataset.sourceWindow = [sx,sy,sw,sh].join(',');
  }
  render(progress) {
    this.currentProgress = progress; this.resize();
    const desired = this.manifest && !reducedMotion.matches ? Math.round(progress*(this.manifest.frameCount-1)) : 0;
    if (this.manifest) this.windowAt(desired);
    let index = desired, image = this.cache.get(desired);
    if (!image && this.cache.size) {
      index = [...this.cache.keys()].reduce((nearest, candidate) => Math.abs(candidate-desired) < Math.abs(nearest-desired) ? candidate : nearest);
      image = this.cache.get(index);
    }
    if (!image && this.poster.complete && this.poster.naturalWidth) { image = this.poster; index = -2; }
    if (image && (this.dirty || this.drawnIndex !== index)) {
      this.paint(image); this.drawnIndex = index; this.dirty = false;
    }
    this.canvas.dataset.frame = String(index >= 0 ? index : 0);
    this.canvas.dataset.requestedFrame = String(desired);
    this.canvas.dataset.ready = String(!!image);
    const intro = reducedMotion.matches ? 1 : 1-clamp((progress-.025)/.32);
    this.header.style.opacity = intro;
    this.header.style.transform = `translateY(${-70*(1-intro)}px)`;
    const notes = reducedMotion.matches ? 0 : clamp((progress-.54)/.14);
    this.notes.style.opacity = notes;
    this.notes.style.transform = `translate(${(1-notes)*28}px,${(1-notes)*12}px)`;
    this.notes.inert = notes < .9;
    this.cue.style.opacity = 1-clamp(progress/.13);
    this.progressBar.style.transform = `scaleX(${progress})`;
    return !!image;
  }
}

const sequences = products.map((product,index) => new SoapSequence(product, document.querySelectorAll('.story')[index]));
const railLinks = [...$('.chapter-rail').querySelectorAll('a')];
const navigation = $('.navigation');
const status = $('.scene-status');
const menu = $('#collection-menu'), menuButton = $('.menu-button');

function closeMenu(restoreFocus = false) {
  menu.hidden = true; menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Open collection menu');
  if (restoreFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => {
  const open = menu.hidden; menu.hidden = !open;
  menuButton.setAttribute('aria-expanded',String(open)); menuButton.setAttribute('aria-label',open?'Close collection menu':'Open collection menu');
  if (open) menu.querySelector('a')?.focus();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !menu.hidden) closeMenu(true);
});
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (link) {
    const id = link.getAttribute('href').slice(1), index = products.findIndex(product => product.id === id);
    if (index >= 0) {
      sequences[index].warm = true;
      sequences[index].prepare().then(() => sequences[index].request(0,0)).catch(() => {});
    }
    closeMenu();
  } else if (!menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
});

async function activate(index) {
  activeIndex = index; smoothedProgress = -1;
  sequences.forEach((sequence,i) => sequence.setActivity(i === index, Math.abs(i-index) <= 1));
  const sequence = sequences[index];
  sequence.element.classList.add('is-in');
  document.documentElement.style.setProperty('--active-color',sequence.product.color);
  $('meta[name="theme-color"]').setAttribute('content',sequence.product.dark);
  railLinks.forEach((link,i) => {
    link.classList.toggle('active',i === index);
    if (i === index) link.setAttribute('aria-current','step'); else link.removeAttribute('aria-current');
  });
  $('.chapter-position span').textContent = sequence.product.number;
  try {
    await sequence.prepare();
    if (activeIndex === index) { sequence.request(sequence.wantedIndex,0); schedule(); }
    const next = sequences[index+1];
    if (next?.warm) next.prepare().then(() => next.request(0,50)).catch(() => {});
  } catch {
    if (activeIndex === index) {
      status.querySelector('span').textContent = `${sequence.product.name} needs another moment.`;
      status.hidden = false;
    }
  }
}

function update() {
  raf = 0; if (!ready) return;
  const y = scrollY, delta = y-lastScroll;
  if (Math.abs(delta) > .3) direction = Math.sign(delta);
  let index = sequences.findIndex(sequence => {
    const bounds = sequence.element.getBoundingClientRect();
    return bounds.top <= innerHeight*.12 && bounds.bottom > innerHeight*.12;
  });
  if (index < 0 && y < 10) index = 0;
  if (index >= 0) {
    if (index !== activeIndex) activate(index);
    const sequence = sequences[index], bounds = sequence.element.getBoundingClientRect();
    const target = reducedMotion.matches ? 0 : clamp(-bounds.top/Math.max(1,bounds.height-innerHeight));
    if (smoothedProgress < 0 || Math.abs(y-lastScroll) > innerHeight*1.4) smoothedProgress = target;
    const difference = target-smoothedProgress;
    smoothedProgress = Math.abs(difference) < .0007 ? target : smoothedProgress+difference*.22;
    const hasImage = sequence.render(smoothedProgress);
    status.hidden = hasImage || (!sequence.failed.size && !sequence.loadError);
    if (!status.hidden) status.querySelector('span').textContent = `${sequence.product.name} needs another moment.`;
    if (smoothedProgress !== target) schedule();
  } else {
    status.hidden = true;
    if (activeIndex !== -1) {
      sequences.forEach(sequence => sequence.setActivity(false,false)); activeIndex = -1;
    }
  }
  navigation.classList.toggle('scrolled', y > 60);
  navigation.classList.toggle('on-paper', index < 0);
  $('.chapter-rail').classList.toggle('is-hidden',index < 0);
  $('.chapter-rail').inert = index < 0;
  $('.chapter-position').classList.toggle('is-hidden',index < 0);
  $('.overall-progress i').style.transform = `scaleX(${clamp(y/Math.max(1,document.documentElement.scrollHeight-innerHeight))})`;
  lastScroll = y;
}

status.querySelector('button').onclick = async () => {
  if (activeIndex < 0) return;
  const sequence = sequences[activeIndex]; sequence.failed.clear();
  if (!sequence.manifest) { sequence.clear(); await sequence.prepare().catch(() => {}); }
  sequence.dirty = true; sequence.request(sequence.wantedIndex,0); schedule();
};
addEventListener('scroll',schedule,{ passive:true });
addEventListener('resize',() => {
  sequences.forEach(sequence => { sequence.dirty = true; });
  if (activeIndex >= 0) {
    sequences[activeIndex].prepare().then(() => schedule()).catch(() => {});
    smoothedProgress = -1;
  }
  schedule();
},{ passive:true });
reducedMotion.addEventListener('change', () => { smoothedProgress = -1; schedule(); });
mobileViewport.addEventListener('change', () => {
  sequences.forEach(sequence => sequence.clear());
  const index = activeIndex; activeIndex = -1;
  if (index >= 0) activate(index);
  schedule();
});
document.fonts?.ready.then(schedule);

async function start() {
  const hashIndex = products.findIndex(product => `#${product.id}` === location.hash);
  const initial = Math.max(0,hashIndex), sequence = sequences[initial];
  sequence.active = true; sequence.warm = true;
  try {
    await sequence.prepare();
    const count = sequence.manifest.frameCount;
    const startup = reducedMotion.matches ? [0] : [...new Set([...Array.from({length:8},(_,i)=>i), ...[.25,.5,.75,1].map(value=>Math.round((count-1)*value))])];
    let settled = 0;
    await Promise.all(startup.map(index => sequence.request(index,index === 0 ? 0 : 10,true).then(() => {
      settled++; const percent = Math.round(settled/startup.length*100);
      $('.preloader-track i').style.transform = `scaleX(${percent/100})`;
      $('.preloader-percent').textContent = `${percent}%`;
    })));
    if (!sequence.cache.has(0) && !sequence.poster.naturalWidth) throw Error('The opening image did not load.');
    if (hashIndex >= 0) window.scrollTo({ top:sequence.element.offsetTop, behavior:'instant' });
    else if (location.hash === '#collection') window.scrollTo({ top:Math.max(0,$('#collection').offsetTop-80), behavior:'instant' });
    sequence.render(0);
    ready = true; document.body.classList.remove('is-loading'); document.body.classList.add('is-ready');
    $('.preloader').classList.add('is-done');
    setTimeout(() => { $('.preloader').hidden = true; }, 850);
    activeIndex = -1; schedule();
  } catch {
    $('.preloader-caption').textContent = 'Your botanical ritual needs another moment.';
    $('.preloader-retry').hidden = false;
    $('.preloader-retry').onclick = () => location.reload();
  }
}
await start();
