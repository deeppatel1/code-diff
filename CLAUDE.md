# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Diff Please** — a privacy-first, client-side code diff tool at diffplease.com. Built with React 18, Vite, and Monaco Editor (used directly, not via `@monaco-editor/react` wrapper for the diff editor). All processing happens locally in the browser; no server-side code.

## Commands

- `yarn` — install dependencies (uses Yarn 4 via Corepack; `packageManager` is pinned in package.json)
- `yarn dev` — start dev server on port 3000
- `yarn build` — production build to `dist/`
- `yarn test` — run tests with Vitest (jsdom environment)
- `yarn test src/lib/codeUtils.test.js` — run a single test file

## Architecture

**Single-page app with two routes** (`/` and `/faq`) via `react-router-dom`, wrapped in `HelmetProvider` for SEO meta tags.

### Key files

- `src/App.jsx` — Main component. Creates the Monaco diff editor directly via `monaco.editor.createDiffEditor()` (not the React wrapper). Defines 8 custom Monaco themes. Handles beautification, JSON utilities, and YAML conversion by operating on Monaco models directly.
- `src/lib/codeUtils.js` — `CodeBeautifier` class (Prettier-based for JS/TS/HTML/CSS/MD/YAML; custom indent-based formatters for Python, Java, C, Go, Rust, Ruby, SQL, etc.), `detectLanguage()` heuristic, and `calculateStats()`.
- `src/lib/editorActions.js` — Small helper for model-level JSON operations.
- `src/pages/FAQ.jsx` — Static FAQ page with structured data.
- `src/services/analytics.js` — Google Analytics init.

### Build/Deploy

- **GitHub Pages**: CI deploys on push to `master` via `.github/workflows/deploy-pages.yml`. Uses `base: '/code-diff/'` in the build.
- **Vercel**: Detects `VERCEL=1` env var and uses `base: '/'`. Config in `vercel.json`.
- The `vite.config.js` has a custom `faq-rewrite` plugin to serve `/faq` routes in dev/preview.

### State persistence

Editor content is stored in `sessionStorage`; theme preference in `localStorage`. Keys are prefixed `diffright-`.

### Monaco integration notes

- Monaco workers are configured via `window.MonacoEnvironment.getWorker` with Vite's `?worker` import syntax.
- The diff editor is created once in a `useEffect` and models are attached. Language is auto-detected on content change via `detectLanguage()` and set with `monaco.editor.setModelLanguage()`.
- Both sides of the diff editor are editable (`originalEditable: true`).
