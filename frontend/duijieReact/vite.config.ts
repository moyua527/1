import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync } from 'fs'

const versionInfo = JSON.parse(readFileSync(path.resolve(__dirname, '../../version.json'), 'utf-8'))

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(versionInfo.version),
    __APP_VERSION_CODE__: versionInfo.versionCode,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['zustand', 'socket.io-client'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
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
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
