import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  root: path.resolve(import.meta.dirname, 'src'),
  build: { emptyOutDir: true, outDir: path.resolve(import.meta.dirname, 'dist') },
  server: {
    port: 5174,
    proxy: {
      // Match backend routes without intercepting the /api/content.ts source module.
      '^/api/(admin|content)(/|$)': {
        target: 'http://localhost:3001',
        // Preserve the browser-facing host so the backend's same-origin check passes.
        changeOrigin: false
      }
    }
  }
})
