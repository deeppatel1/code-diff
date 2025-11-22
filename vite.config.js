import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';
  const isVercel = process.env.VERCEL === '1';
  const base = isBuild ? (isVercel ? '/' : '/code-diff/') : '/';

  return {
    plugins: [react()],
    base,
    server: {
      fs: {
        // allow serving from project root (default) + monaco-editor package dir
        allow: [
          process.cwd(),
          path.dirname(require.resolve('monaco-editor/package.json'))
        ]
      },
      port: 3000
    },
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['src/**/*.test.{js,jsx}']
    }
  };
});
