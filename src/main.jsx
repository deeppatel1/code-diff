import 'monaco-editor/min/vs/editor/editor.main.css';
import './index.css';
import App from './App';
import FAQ from './pages/FAQ';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import initGoogleAnalytics from './services/analytics';

initGoogleAnalytics();

createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/faq" element={<FAQ />} />
      </Routes>
    </BrowserRouter>
  </HelmetProvider>
);
