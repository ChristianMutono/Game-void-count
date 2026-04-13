import { readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const audioDir = join(__dirname, '..', 'public', 'audio');
const manifestPath = join(audioDir, 'manifest.json');

const files = readdirSync(audioDir)
  .filter(f => f.endsWith('.mp3') && f !== 'homescreen_background.mp3')
  .sort();

writeFileSync(manifestPath, JSON.stringify(files, null, 2) + '\n');
console.log(`Audio manifest updated: ${files.length} tracks`);
files.forEach(f => console.log(`  ${f}`));
