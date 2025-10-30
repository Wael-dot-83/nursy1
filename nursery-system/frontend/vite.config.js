import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: '.',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/admin': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        secure: false,
      },
      '/users': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        secure: false,
      },
      '/children': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        secure: false,
      },
      '/attendance': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        secure: false,
      },
      '/reports': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        secure: false,
      },
      '/files': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        secure: false,
      },
      '/notifications': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        secure: false,
      },
      '/audit-logs': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        secure: false,
      },
      '/system': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    css: true,
  },
})
