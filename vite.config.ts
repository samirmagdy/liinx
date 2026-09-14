import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig(() => {
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
    },
  };
});
