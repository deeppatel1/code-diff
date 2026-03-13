import React, { Suspense } from 'react';
import 'monaco-editor/min/vs/editor/editor.main.css';
import './globals.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import initGoogleAnalytics from './services/analytics';
import { getOrCreateAnonUser } from './lib/firebase';

const FAQ = React.lazy(() => import('./pages/FAQ'));
const SharedDiff = React.lazy(() => import('./pages/SharedDiff'));
const CsvViewer = React.lazy(() => import('./pages/CsvViewer'));
const MarkdownViewer = React.lazy(() => import('./pages/MarkdownViewer'));

initGoogleAnalytics();

// Initialize anonymous auth in the background
getOrCreateAnonUser();

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <HelmetProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/faq" element={<Suspense fallback={<div>Loading...</div>}><FAQ /></Suspense>} />
          <Route path="/s/:id" element={<Suspense fallback={<div>Loading...</div>}><SharedDiff /></Suspense>} />
          <Route path="/csv" element={<Suspense fallback={<div>Loading...</div>}><CsvViewer /></Suspense>} />
          <Route path="/markdown" element={<Suspense fallback={<div>Loading...</div>}><MarkdownViewer /></Suspense>} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  </ErrorBoundary>
);
