// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })







import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Exclude pdfjs-dist from pre-bundling — it handles its own worker
    exclude: ['pdfjs-dist'],
  },
  build: {
    rollupOptions: {
      // Ensure pdf.worker is copied to the build output
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  // Allow Vite to serve the worker file during dev
  worker: {
    format: 'es',
  },
})