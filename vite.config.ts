import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    // Geliştirmede /api isteklerini `npm run dev:api` (wrangler dev) sunucusuna yönlendir
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
});
