import { describe, it, expect, afterEach } from 'vitest';
import initGoogleAnalytics from './analytics';

describe('initGoogleAnalytics', () => {
  afterEach(() => {
    // Clean up script tags (not handled by global setup.js)
    document.querySelectorAll('script[src*="googletagmanager"]').forEach(s => s.remove());
  });

  it('creates script tag and initializes window.dataLayer', () => {
    initGoogleAnalytics();

    const scripts = document.querySelectorAll('script[src*="googletagmanager"]');
    expect(scripts.length).toBe(1);
    expect(window.dataLayer).toBeDefined();
    expect(Array.isArray(window.dataLayer)).toBe(true);
    expect(window.dataLayer.length).toBeGreaterThan(0);
  });

  it('does not double-initialize when called twice', () => {
    initGoogleAnalytics();
    const firstLength = window.dataLayer.length;

    initGoogleAnalytics();
    const scripts = document.querySelectorAll('script[src*="googletagmanager"]');
    expect(scripts.length).toBe(1);
    expect(window.dataLayer.length).toBe(firstLength);
  });

  it('window.gtag is a function after init', () => {
    initGoogleAnalytics();
    expect(typeof window.gtag).toBe('function');
  });

  it('window.gtag pushes to window.dataLayer', () => {
    initGoogleAnalytics();
    const lengthBefore = window.dataLayer.length;

    window.gtag('event', 'test_event');
    expect(window.dataLayer.length).toBe(lengthBefore + 1);
  });
});
