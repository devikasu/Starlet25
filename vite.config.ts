import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: '.'  // Copies to dist root
        },
        {
          src: 'public/icon.png',
          dest: '.'  // Also copy icon if needed
        },
        {
          src: 'public/sounds',
          dest: 'sounds'  // Copy sounds directory
        }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    // Ensure all dependencies are bundled
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      input: {
        popup: 'index.html',
        background: 'src/background/background.ts',
        content: 'src/content/contentScript.ts'
      },
      // Prevent external dependencies
      external: [],
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          // Keep icon.png in root for Chrome extension
          if (assetInfo.name === 'icon.png') {
            return 'icon.png';
          }
          return 'assets/[name].[ext]';
        }
      }
    },
    // Ensure public directory is copied
    copyPublicDir: true
  }
})
