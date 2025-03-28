import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import VitePluginRewriteAll from 'vite-plugin-rewrite-all'; // 🔄 korrekt!

export default defineConfig({
  base: '/',
  plugins: [react(), VitePluginRewriteAll()],
  server: {
    port: 5173,
  },
});
