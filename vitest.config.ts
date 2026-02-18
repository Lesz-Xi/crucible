import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Fix: Next.js SWC binary uses TMPDIR to create an SSR temp dir.
    // /var/folders is EPERM in the sandbox — set TMPDIR=/tmp in the npm script.
    // Run tests with: TMPDIR=/tmp npx vitest run
    setupFiles: ['./vitest-setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Stub Next.js server modules to prevent SSR transform crashes in test env
      'next/server': path.resolve(__dirname, 'src/__mocks__/next-server.ts'),
      'next/headers': path.resolve(__dirname, 'src/__mocks__/next-headers.ts'),
      'next/navigation': path.resolve(__dirname, 'src/__mocks__/next-navigation.ts'),
      'next/cache': path.resolve(__dirname, 'src/__mocks__/next-cache.ts'),
    },
  },
});
