import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    proxy: {
      // The status agents only accept connections from lovinoes.de, so in dev the
      // node websockets go through here with the production Origin.
      '/status/nodes': {
        target: 'https://lovinoes.de',
        changeOrigin: true,
        ws: true,
        headers: { Origin: 'https://lovinoes.de' },
      },
    },
  },
})
