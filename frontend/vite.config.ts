import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/loom-iq/',
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})
