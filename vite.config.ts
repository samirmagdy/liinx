import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_PROXY_TARGET || `http://localhost:${env.PORT || 3050}`;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    test: {
      globals: true,
      environment: 'node',
      globalSetup: ['./tests/global-setup.ts'],
      fileParallelism: false,
      maxWorkers: 1,
      minWorkers: 1,
    },
    server: {
      hmr: true,
      proxy: {
        '/api': apiTarget,
        '/r': apiTarget,
        '/uploads': apiTarget,
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            routing: ['wouter'],
            icons: ['lucide-react'],
            gsap: ['gsap', '@gsap/react', 'gsap/ScrollTrigger', 'gsap/SplitText'],
            confetti: ['canvas-confetti']
          }
        }
      }
    },
  };
});
