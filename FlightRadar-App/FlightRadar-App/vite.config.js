import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    cssCodeSplit: true,
    assetsInlineLimit: 0, // prefer separate files to avoid base64 bloat
    sourcemap: false,
    target: 'es2018',
    rollupOptions: {
      input: { main: './index.html' },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'leaflet', 'react-leaflet']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'leaflet', 'react-leaflet']
  },
  esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : undefined,
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  }
}))
