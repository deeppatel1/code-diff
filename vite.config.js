import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';
  const isVercel = process.env.VERCEL === '1';
  const base = isBuild ? (isVercel ? '/' : '/code-diff/') : '/';
  const faqRewritePlugin = {
    name: 'faq-rewrite',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/faq' || req.url === '/faq/') {
          req.url = '/faq/index.html';
        }
        if (req.url?.startsWith('/s/')) {
          req.url = '/index.html';
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/faq' || req.url === '/faq/') {
          req.url = '/faq/index.html';
        }
        if (req.url?.startsWith('/s/')) {
          req.url = '/index.html';
        }
        next();
      });
    }
  };

  return {
    plugins: [react(), tailwindcss(), faqRewritePlugin],
    base,
    server: {
      fs: {
        allow: [
          process.cwd(),
          path.dirname(require.resolve('monaco-editor/package.json'))
        ]
      },
      port: 3000
    }
  };
});
