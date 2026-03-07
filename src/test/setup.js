import '@testing-library/jest-dom';
import { afterEach } from 'vitest';

// Polyfill localStorage/sessionStorage if jsdom doesn't provide full API
if (typeof window !== 'undefined') {
  for (const storageName of ['localStorage', 'sessionStorage']) {
    const storage = window[storageName];
    if (storage && typeof storage.getItem !== 'function') {
      const store = {};
      window[storageName] = {
        getItem: (key) => key in store ? store[key] : null,
        setItem: (key, value) => { store[key] = String(value); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); },
        get length() { return Object.keys(store).length; },
        key: (i) => Object.keys(store)[i] ?? null,
      };
    }
  }
}

afterEach(() => {
  try { window.localStorage.clear(); } catch { /* noop */ }
  try { window.sessionStorage.clear(); } catch { /* noop */ }
  delete window.dataLayer;
  delete window.gtag;
});
