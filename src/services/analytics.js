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
  window.gtag('config', GA_ID, {
    send_page_view: false,
  });

  // Manual page_view with custom params
  window.gtag('event', 'page_view', {
    page_location: window.location.href,
    page_title: document.title,
  });

  // Set user properties
  window.gtag('set', 'user_properties', {
    screen_width: window.screen.width,
    preferred_theme: localStorage.getItem('diffright-theme-mode') || 'light',
  });

  // Start engagement time tracking
  initEngagementTracking();
};

// --- Engagement time tracking ---

let engagementStart = Date.now();
let totalEngagementMs = 0;
let isActive = true;
let heartbeatInterval = null;

function initEngagementTracking() {
  engagementStart = Date.now();
  totalEngagementMs = 0;
  isActive = true;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (isActive) {
        totalEngagementMs += Date.now() - engagementStart;
        isActive = false;
      }
    } else {
      engagementStart = Date.now();
      isActive = true;
    }
  });

  // Heartbeat every 60s for long sessions
  heartbeatInterval = setInterval(() => {
    const currentEngagement = getEngagementSeconds();
    if (currentEngagement > 0) {
      track('session_heartbeat', { duration_seconds: currentEngagement });
    }
  }, 60000);

  // Send session_duration on beforeunload
  window.addEventListener('beforeunload', () => {
    const seconds = getEngagementSeconds();
    if (seconds > 0) {
      track('session_duration', { duration_seconds: seconds });
    }
    if (heartbeatInterval) clearInterval(heartbeatInterval);
  });
}

function getEngagementSeconds() {
  let total = totalEngagementMs;
  if (isActive) {
    total += Date.now() - engagementStart;
  }
  return Math.round(total / 1000);
}

// --- Event tracking ---

function track(eventName, params = {}) {
  if (window.gtag) {
    window.gtag('event', eventName, params);
  }
}

export const analytics = {
  // Feature usage
  beautify: (language, side) => track('beautify', { language, side }),
  sortJson: (side) => track('sort_json', { side }),
  compactJson: (side) => track('compact_json', { side }),
  convertJsonToYaml: (side) => track('convert_json_yaml', { side }),
  convertYamlToJson: (side) => track('convert_yaml_json', { side }),

  // Editor interaction
  toggleView: (mode) => track('toggle_view', { mode }),
  changeTheme: (theme) => track('change_theme', { theme }),
  languageDetected: (language, side) => track('language_detected', { language, side }),

  // Session quality
  contentPasted: (side, charCount) => track('content_pasted', { side, char_count: charCount }),
  sessionDuration: (seconds) => track('session_duration', { duration_seconds: seconds }),

  // Navigation
  faqVisited: () => track('faq_visited'),

  // Button clicks
  fileOpened: (side) => track('file_opened', { side }),
  historyOpened: () => track('history_opened'),
  shareOpened: () => track('share_opened'),
  linkCopied: () => track('link_copied'),

  // Future features (Phase 1-3)
  fileImported: (side, fileExt) => track('file_imported', { side, file_extension: fileExt }),
  diffExported: (format) => track('diff_exported', { format }),
  diffShared: () => track('diff_shared'),
  sharedDiffViewed: (id) => track('shared_diff_viewed', { diff_id: id }),
  historyRestored: () => track('history_restored'),
};

export default initGoogleAnalytics;
