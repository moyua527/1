import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: true,
    port: 1300,
    proxy: {
      '/api': {
        target: 'http://localhost:1800',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:1800',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
