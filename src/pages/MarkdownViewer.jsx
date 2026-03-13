import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function MarkdownViewer() {
  const navigate = useNavigate();

  useEffect(() => {
    // Set sample markdown so the preview activates on load
    const sample = `# Welcome to Diff Please

Compare and preview **Markdown** files side-by-side.

## Features

- Live rendered preview
- Side-by-side diff comparison
- Syntax highlighting for code blocks

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

> All processing happens locally in your browser.`;
    sessionStorage.setItem('diffright-session-original', sample);
    sessionStorage.setItem('diffright-session-modified', sample);
    sessionStorage.setItem('diffright-shared-preview', 'markdown');
    navigate('/', { replace: true });
  }, [navigate]);

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Diff Please Markdown Viewer",
    "description": "Preview and compare Markdown files with live rendering. Privacy-first — all processing happens in your browser.",
    "url": "https://diffplease.com/markdown",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  };

  return (
    <>
      <Helmet>
        <title>Markdown Viewer & Diff Tool - Diff Please</title>
        <meta name="description" content="Preview and compare Markdown files with live rendering and side-by-side diff. Privacy-first Markdown viewer — all processing happens locally in your browser. No sign-up required." />
        <meta name="keywords" content="markdown viewer, markdown preview, markdown diff, compare markdown, markdown renderer, markdown comparison tool, privacy-first" />
        <link rel="canonical" href="https://diffplease.com/markdown" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      <div className="flex items-center justify-center h-screen bg-page-bg text-dark-text-secondary">Loading Markdown Viewer...</div>
    </>
  );
}
