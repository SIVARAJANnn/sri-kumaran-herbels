import { fileURLToPath } from 'node:url';

// Use the bundled originals by default; optionally rebuild from an external folder.
export const suppliedVideoDirectory = process.env.SUPPLIED_VIDEO_DIR ||
  fileURLToPath(new URL('../videos/supplied-20261106075400335/', import.meta.url));

// User-approved mapping and chapter order. The IDs are stable across file names.
export const suppliedVideos = [
  { id: 'orange', identifier: '442d7fae', name: 'Orange' },
  { id: 'avaram', identifier: '07a8ffef', name: 'Avarampoo' },
  { id: 'charcoal', identifier: '03ba9c29', name: 'Charcoal' },
  { id: 'sandal', identifier: '74cc60e6', name: 'Sandalwood' },
  { id: 'aloe', identifier: '2cd96fe2', name: 'Aloe Vera' },
  { id: 'kuppaimeni', identifier: '4fc9cdf9', name: 'Kuppaimeni' }
];
