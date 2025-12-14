const GA_ID = import.meta.env.VITE_GA_ID || 'G-EW0QWFHC82';

const initGoogleAnalytics = () => {
  if (!GA_ID) return;

  if (window.dataLayer) return; // Already initialized

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
};

export default initGoogleAnalytics;
