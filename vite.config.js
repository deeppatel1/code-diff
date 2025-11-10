import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/code-diff/' : '/',
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
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.{js,jsx}']
  }
}));
