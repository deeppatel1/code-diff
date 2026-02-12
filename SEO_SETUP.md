# SEO & Routing Setup

## What's Been Added

### 1. React Router
- Routes configured for `/` (main app) and `/faq`
- FAQ link added to header

### 2. SEO Meta Tags
- Dynamic meta tags using `react-helmet-async`
- Page-specific titles and descriptions
- Keywords for search engines
- Canonical URLs

### 3. Hosting Configurations
- **Netlify**: `public/_redirects` - SPA fallback routing
- **Vercel**: `vercel.json` - SPA fallback routing  
- **Apache**: `public/.htaccess` - mod_rewrite rules

### 4. SEO Files
- `public/sitemap.xml` - Search engine sitemap
- `public/robots.txt` - Crawler instructions

## Deployment

### Netlify
1. Deploy as usual - `_redirects` file will be copied to dist
2. All routes automatically redirect to index.html

### Vercel
1. Deploy as usual - `vercel.json` handles routing
2. No additional configuration needed

### GitHub Pages
If using gh-pages, you may need a 404.html workaround:
```bash
cp dist/index.html dist/404.html
```

### Other Hosts
Copy `public/.htaccess` to your web root if using Apache.

## Testing Locally

```bash
yarn dev
```

Visit:
- http://localhost:5173/ - Main app
- http://localhost:5173/faq - FAQ page

## Build & Preview

```bash
yarn build
yarn preview
```

The preview server will properly handle routing.
