import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    sourcemap: true, // Enable source maps for debugging
  },
  server: {
    open: true, // Automatically open the browser on server start
  },
})