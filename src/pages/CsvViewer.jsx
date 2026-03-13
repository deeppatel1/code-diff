import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function CsvViewer() {
  const navigate = useNavigate();

  useEffect(() => {
    // Set sample CSV so the viewer activates on load
    const sample = `name,age,city,role
Alice,30,New York,Engineer
Bob,25,London,Designer
Charlie,35,Paris,Manager`;
    sessionStorage.setItem('diffright-session-original', sample);
    sessionStorage.setItem('diffright-session-modified', sample);
    navigate('/', { replace: true });
  }, [navigate]);

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Diff Please CSV Viewer",
    "description": "View and compare CSV files side-by-side with table preview. Privacy-first — all processing happens in your browser.",
    "url": "https://diffplease.com/csv",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  };

  return (
    <>
      <Helmet>
        <title>CSV Viewer & Diff Tool - Diff Please</title>
        <meta name="description" content="View, compare, and diff CSV files side-by-side with table preview. Privacy-first CSV viewer — all processing happens locally in your browser. No sign-up required." />
        <meta name="keywords" content="csv viewer, csv diff, compare csv, csv table, csv preview, csv comparison tool, privacy-first" />
        <link rel="canonical" href="https://diffplease.com/csv" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      <div className="flex items-center justify-center h-screen bg-page-bg text-dark-text-secondary">Loading CSV Viewer...</div>
    </>
  );
}
