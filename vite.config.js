import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/wpr-badgers-hockey/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mini: resolve(__dirname, 'mini.html'),
        'mini-season': resolve(__dirname, 'mini-season.html'),
        sponsors: resolve(__dirname, 'sponsors.html'),
      },
      output: {
        // Without this, Rollup names the shared React chunk after an
        // arbitrary module ("styles-*.js") — confusing in devtools.
        manualChunks: { vendor: ['react', 'react-dom'] },
      },
    },
  },
})
