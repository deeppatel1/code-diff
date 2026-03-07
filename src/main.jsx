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
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  </ErrorBoundary>
);
