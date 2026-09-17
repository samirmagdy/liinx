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
      coverage: {
        provider: 'v8',
        reporter: ['text', 'text-summary', 'lcov', 'json', 'html'],
        reportsDirectory: './coverage',
        all: true,
        include: [
          'server/**/*.ts',
          'src/config/**/*.ts',
          'src/utils/**/*.ts'
        ],
        exclude: [
          '**/*.d.ts',
          '**/types/**',
          'scripts/**',
          'dist/**',
          'server/maintenance.ts',
          'server/instagramScheduler.ts'
        ],
        thresholds: {
          statements: 76,
          lines: 79,
          functions: 80,
          branches: 72,
          'server/auth.ts': {
            statements: 85,
            lines: 90,
            functions: 100,
            branches: 75
          },
          'server/middleware/auth.ts': {
            statements: 95,
            lines: 95,
            functions: 100,
            branches: 90
          },
          'server/secretStore.ts': {
            statements: 95,
            lines: 95,
            functions: 100,
            branches: 90
          },
          'server/entitlements.ts': {
            statements: 100,
            lines: 100,
            functions: 100,
            branches: 100
          },
          'server/routes/profiles.ts': {
            statements: 80,
            lines: 80,
            functions: 85,
            branches: 80
          },
          'server/routes/billing.ts': {
            statements: 65,
            lines: 65,
            functions: 75,
            branches: 55
          },
          'server/routes/upload.ts': {
            statements: 75,
            lines: 80,
            functions: 95,
            branches: 70
          }
        }
      },
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
