/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@components': path.resolve(__dirname, './components'),
      '@viewers': path.resolve(__dirname, './viewers'),
      '@hooks': path.resolve(__dirname, './hooks'),
      '@services': path.resolve(__dirname, './services'),
      '@pages': path.resolve(__dirname, './pages'),
      '@contexts': path.resolve(__dirname, './contexts'),
      '@core': path.resolve(__dirname, '../../core'),
      '@shared': path.resolve(__dirname, '../../shared'),
    }
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },

})