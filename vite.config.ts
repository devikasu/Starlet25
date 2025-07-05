import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup/popup.tsx',
        background: 'src/background/background.ts',
        content: 'src/content/contentScript.ts'
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          // Keep icon.png in root for Chrome extension
          if (assetInfo.name === 'icon.png') {
            return 'icon.png';
          }
          return '[name].[ext]';
        }
      }
    },
    // Ensure public directory is copied
    copyPublicDir: true
  }
})
