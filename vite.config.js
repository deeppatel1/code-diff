import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/code-diff/',
  server: {
    fs: {
      // allow serving from project root (default) + monaco-editor package dir
      allow: [
        // your project root
        process.cwd(),
        // monaco-editor’s install location (resolves to the folder containing package.json)
        path.dirname(require.resolve('monaco-editor/package.json'))
      ]
    },
    port: 3000
  }
});