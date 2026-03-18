import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Use the light version of lottie-web which doesn't use eval()
      // This fixes the [EVAL] warning during build
      'lottie-web': 'lottie-web/build/player/lottie_light.js'
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress EVAL warnings from lottie-web or others
        if (warning.code === 'EVAL' || warning.message?.includes('direct `eval`')) return;
        warn(warning);
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('antd') || id.includes('lucide-react') || id.includes('framer-motion')) {
              return 'vendor-ui';
            }
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('lottie')) return 'vendor-lottie';
            return 'vendor';
          }
        },
      },
    },
    // For Rolldown specifically in Vite 8
    rolldownOptions: {
      onLog(level, log) {
        // Suppress the direct eval warning from lottie-web
        if (log.code === 'EVAL' || log.message?.includes('direct `eval`')) return false;
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('antd') || id.includes('lucide-react') || id.includes('framer-motion')) {
              return 'vendor-ui';
            }
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('lottie')) return 'vendor-lottie';
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/player': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
})
