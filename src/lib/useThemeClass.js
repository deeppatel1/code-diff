import { useEffect } from 'react';

const THEME_STORAGE_KEY = 'diffright-theme-mode';
const THEME_CLASSES = [
  'theme-dark', 'theme-light', 'theme-pink', 'theme-midnight',
  'theme-sand', 'theme-slate', 'theme-sky', 'theme-monokai',
];

export default function useThemeClass() {
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) ?? 'light';
    const themeClass = `theme-${stored}`;
    document.documentElement.classList.remove(...THEME_CLASSES);
    document.documentElement.classList.add(themeClass);
    return () => document.documentElement.classList.remove(themeClass);
  }, []);
}
