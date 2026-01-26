const fs = require('node:fs');
const path = require('node:path');

const distDir = path.resolve(__dirname, '../dist');
const indexPath = path.join(distDir, 'index.html');
const notFoundPath = path.join(distDir, '404.html');

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('Generated 404.html for GitHub Pages SPA fallback.');
} else {
  console.warn('index.html not found. Skipping 404.html generation.');
}
