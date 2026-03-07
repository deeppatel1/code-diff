import { defineConfig } from 'vitest/config';
import path from 'path';

const monacoMock = path.resolve(__dirname, 'src/test/__mocks__/monaco-editor.js');

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: ['./src/test/setup.js'],
  },
  resolve: {
    alias: [
      { find: /^monaco-editor(\/.*)?$/, replacement: monacoMock },
    ]
  },
  esbuild: {
    jsx: 'automatic',
  },
});
