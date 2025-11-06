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
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          const newPath = path.replace(/^\/api/, '');
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Proxy] ${path} -> ${newPath}`);
          }
          return newPath;
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('[Proxy] Error:', err);
            }
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('[Proxy] Sending Request to:', req.url);
            }
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('[Proxy] Received Response from:', req.url, 'Status:', proxyRes.statusCode);
            }
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    charset: 'utf8',  // ← جديد: تحديد صريح لترميز UTF-8
    minify: 'esbuild',
    rollupOptions: {
      output: {
        charset: 'utf8',  // ← جديد: UTF-8 للملفات الناتجة
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    css: true,
  },
})
