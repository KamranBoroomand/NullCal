import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const rawBase = process.env.VITE_BASE ?? '/';
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    cssMinify: true,
    target: 'es2018'
  }
});
