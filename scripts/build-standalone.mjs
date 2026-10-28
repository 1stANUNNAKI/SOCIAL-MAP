import fs from 'fs';
import path from 'path';

const dir = 'C:/Users/070425/.gemini/antigravity/scratch/cityrt-prototype';
const html = fs.readFileSync(path.join(dir, 'dist/index.html'), 'utf8');
const assetsDir = path.join(dir, 'dist/assets');
const jsFile = fs.readdirSync(assetsDir).find((f) => f.endsWith('.js'));
const jsCode = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');

const inlined = html.replace(
  /<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/,
  () => `<script type="module">\n${jsCode}\n</script>`
);

const outPath = path.join(dir, 'cityrt-standalone.html');
fs.writeFileSync(outPath, inlined, 'utf8');
console.log('Created:', outPath, 'Size:', fs.statSync(outPath).size, 'bytes');

