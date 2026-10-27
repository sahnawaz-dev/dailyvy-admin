import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Where the Express API runs in development (see server/.env PORT).
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:4000'

  return {
    // GitHub Pages serves the site from /<repo>/ — set VITE_BASE=/dailyvy-admin/ when building for it
    base: env.VITE_BASE || '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5175,
      proxy: { '/api': { target: apiTarget, changeOrigin: true } },
    },
  }
})
