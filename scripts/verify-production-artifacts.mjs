import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const serverDist = path.join(root, 'dist-server');

function requireFile(file, label) {
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) throw new Error(`${label} is missing or empty: ${path.relative(root, file)}`);
}

requireFile(path.join(dist, 'index.html'), 'frontend entrypoint');
requireFile(path.join(serverDist, 'server.js'), 'server bundle');
requireFile(path.join(serverDist, 'server.js.map'), 'server source map');

const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(match => match[1]);
if (assets.length === 0) throw new Error('frontend entrypoint does not reference compiled assets');
for (const asset of assets) requireFile(path.join(dist, asset.slice(1)), `frontend asset ${asset}`);

const jsAssets = fs.readdirSync(path.join(dist, 'assets')).filter(file => file.endsWith('.js'));
const cssAssets = fs.readdirSync(path.join(dist, 'assets')).filter(file => file.endsWith('.css'));
if (jsAssets.length === 0 || cssAssets.length === 0) throw new Error('compiled frontend is missing JavaScript or CSS assets');
if (fs.existsSync(path.join(dist, 'src')) || fs.existsSync(path.join(dist, 'server'))) throw new Error('source directories leaked into production frontend artifacts');

console.log(JSON.stringify({
  frontendEntrypoint: 'dist/index.html',
  javascriptAssets: jsAssets.length,
  stylesheetAssets: cssAssets.length,
  serverBundleBytes: fs.statSync(path.join(serverDist, 'server.js')).size,
  result: 'PASS'
}, null, 2));
