import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Code, Columns, AlignLeft, Sparkles, Wand, SortAsc, Minimize, Sun, Moon, Palette, Heart, ChevronDown, Upload, Clock, Share2 } from 'lucide-react';
import * as monaco from 'monaco-editor';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
import './App.css';
import { CodeBeautifier, calculateStats, detectLanguage } from './lib/codeUtils';
import { analytics } from './services/analytics';
import { saveSnapshot } from './lib/historyStore';
import { db } from './lib/firebase';
import HistoryPanel from './components/HistoryPanel';
import ShareModal from './components/ShareModal';


// Configure Monaco Environment
if (typeof window !== 'undefined') {
  window.MonacoEnvironment = {
    getWorker: async (_, label) => {
      if (label === 'json') {
        const { default: JsonWorker } = await import('monaco-editor/esm/vs/language/json/json.worker?worker');
        return new JsonWorker();
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        const { default: CssWorker } = await import('monaco-editor/esm/vs/language/css/css.worker?worker');
        return new CssWorker();
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        const { default: HtmlWorker } = await import('monaco-editor/esm/vs/language/html/html.worker?worker');
        return new HtmlWorker();
      }
      if (label === 'typescript' || label === 'javascript' || label === 'jsx') {
        const { default: TsWorker } = await import('monaco-editor/esm/vs/language/typescript/ts.worker?worker');
        return new TsWorker();
      }
      const { default: EditorWorker } = await import('monaco-editor/esm/vs/editor/editor.worker?worker');
      return new EditorWorker();
    },
  };
}

// Define custom diff themes
monaco.editor.defineTheme('airbnb-dark-diff', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '79c0ff' },
    { token: 'string.value.json', foreground: '56d364' },
    { token: 'string.json', foreground: '56d364' },
    { token: 'number.json', foreground: 'ffa657' },
    { token: 'keyword.json', foreground: 'f85149' },
    { token: 'operator.json', foreground: '8b949e' },
    { token: 'delimiter.bracket.json', foreground: '8b949e' }
  ],
  colors: {
    'editor.background': '#0d1117',
    'editor.foreground': '#c9d1d9',
    'editor.selectionBackground': '#4a5568',
    'editor.selectionHighlightBackground': '#3a4555',
    'editor.inactiveSelectionBackground': '#3a4555',
    'editor.selectionForeground': '#ffffff',
    'diffEditorGutter.removedLineBackground': '#3a1e22',
    'diffEditor.removedTextBackground': '#ca181580',
    'diffEditorGutter.insertedLineBackground': '#15372a',
    'diffEditor.insertedTextBackground': '#2ea04380',
    'diffEditor.border': '#30363d',
  }
});

monaco.editor.defineTheme('airbnb-light-diff', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '005cc5' },
    { token: 'string.value.json', foreground: '116329' },
    { token: 'string.json', foreground: '116329' },
    { token: 'number.json', foreground: '6f42c1' },
    { token: 'keyword.json', foreground: 'd73a49' },
    { token: 'operator.json', foreground: '6e7781' },
    { token: 'delimiter.bracket.json', foreground: '6e7781' }
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#24292f',
    'editor.selectionBackground': '#add6ff',
    'editor.selectionHighlightBackground': '#d4e5ff',
    'editor.inactiveSelectionBackground': '#d4e5ff',
    'editor.selectionForeground': '#000000',
    'diffEditorGutter.removedLineBackground': '#ffdce0',
    'diffEditor.removedTextBackground': '#fb383840',
    'diffEditorGutter.insertedLineBackground': '#aceebb',
    'diffEditor.insertedTextBackground': '#0c8d2650',
    'diffEditor.border': '#d0d7de',
  }
});

monaco.editor.defineTheme('airbnb-synthwave-diff', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: 'FF7EDB' },
    { token: 'string.value.json', foreground: 'FFF780' },
    { token: 'string.json', foreground: 'FFF780' },
    { token: 'number.json', foreground: '7DF9FF' },
    { token: 'keyword.json', foreground: 'FFA6FF' },
    { token: 'operator.json', foreground: 'C084F5' },
    { token: 'delimiter.bracket.json', foreground: 'C084F5' }
  ],
  colors: {
    'editor.background': '#2B213A',
    'editor.foreground': '#F8F7FF',
    'editor.selectionBackground': '#FF7EDB55',
    'editor.selectionHighlightBackground': '#FF7EDB30',
    'editor.inactiveSelectionBackground': '#FF7EDB20',
    'diffEditorGutter.removedLineBackground': '#4B2F6B80',
    'diffEditor.removedTextBackground': '#FF6B8B77',
    'diffEditorGutter.insertedLineBackground': '#1C3D6180',
    'diffEditor.insertedTextBackground': '#2ea04380',
    'diffEditor.border': '#ad7eff80',
  }
});

monaco.editor.defineTheme('airbnb-cute-diff', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: 'd43b8d' },
    { token: 'string.value.json', foreground: '8c2b64' },
    { token: 'string.json', foreground: '8c2b64' },
    { token: 'number.json', foreground: 'c2317a' },
    { token: 'keyword.json', foreground: 'b4246c' },
    { token: 'operator.json', foreground: 'a13c74' },
    { token: 'delimiter.bracket.json', foreground: 'a13c74' }
  ],
  colors: {
    'editor.background': '#ffe7f4',
    'editor.foreground': '#3f1735',
    'editor.selectionBackground': '#f7c9e855',
    'editor.selectionHighlightBackground': '#f7c9e830',
    'editor.inactiveSelectionBackground': '#f7c9e820',
    'diffEditorGutter.removedLineBackground': '#ffd6e480',
    'diffEditor.removedTextBackground': '#f9508b80',
    'diffEditorGutter.insertedLineBackground': '#e8ffe880',
    'diffEditor.insertedTextBackground': '#64f56480',
    'diffEditor.border': '#f3aacd'
  }
});

monaco.editor.defineTheme('airbnb-midnight-diff', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '6aa9ff' },
    { token: 'string.value.json', foreground: '7be3a1' },
    { token: 'string.json', foreground: '7be3a1' },
    { token: 'number.json', foreground: 'ffb86c' },
    { token: 'keyword.json', foreground: 'ff6b6b' },
    { token: 'operator.json', foreground: '97a3b6' },
    { token: 'delimiter.bracket.json', foreground: '97a3b6' }
  ],
  colors: {
    'editor.background': '#0b1020',
    'editor.foreground': '#e6edf6',
    'editor.selectionBackground': '#23305a',
    'editor.selectionHighlightBackground': '#1a2444',
    'editor.inactiveSelectionBackground': '#1a2444',
    'diffEditorGutter.removedLineBackground': '#3a1e22',
    'diffEditor.removedTextBackground': '#ca181580',
    'diffEditorGutter.insertedLineBackground': '#15372a',
    'diffEditor.insertedTextBackground': '#2ea04380',
    'diffEditor.border': '#2a355a',
  }
});

monaco.editor.defineTheme('airbnb-sand-diff', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '8a5e2c' },
    { token: 'string.value.json', foreground: '5b7a3a' },
    { token: 'string.json', foreground: '5b7a3a' },
    { token: 'number.json', foreground: '9c5fb5' },
    { token: 'keyword.json', foreground: 'b8433a' },
    { token: 'operator.json', foreground: '7a6e60' },
    { token: 'delimiter.bracket.json', foreground: '7a6e60' }
  ],
  colors: {
    'editor.background': '#faf6f0',
    'editor.foreground': '#3b2f20',
    'editor.selectionBackground': '#e8d9c5',
    'editor.selectionHighlightBackground': '#f0e4d4',
    'editor.inactiveSelectionBackground': '#f0e4d4',
    'diffEditorGutter.removedLineBackground': '#ffdce0',
    'diffEditor.removedTextBackground': '#fb383840',
    'diffEditorGutter.insertedLineBackground': '#aceebb',
    'diffEditor.insertedTextBackground': '#0c8d2650',
    'diffEditor.border': '#d9cbb8',
  }
});

monaco.editor.defineTheme('airbnb-slate-diff', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '7aa2c2' },
    { token: 'string.value.json', foreground: '9bdba5' },
    { token: 'string.json', foreground: '9bdba5' },
    { token: 'number.json', foreground: 'ffb86c' },
    { token: 'keyword.json', foreground: 'ff7b7b' },
    { token: 'operator.json', foreground: 'a5b1c2' },
    { token: 'delimiter.bracket.json', foreground: 'a5b1c2' }
  ],
  colors: {
    'editor.background': '#1b1f24',
    'editor.foreground': '#e5e9ef',
    'editor.selectionBackground': '#343d48',
    'editor.selectionHighlightBackground': '#2a323b',
    'editor.inactiveSelectionBackground': '#2a323b',
    'diffEditorGutter.removedLineBackground': '#3a1e22',
    'diffEditor.removedTextBackground': '#ca181580',
    'diffEditorGutter.insertedLineBackground': '#15372a',
    'diffEditor.insertedTextBackground': '#2ea04380',
    'diffEditor.border': '#3a424c',
  }
});

monaco.editor.defineTheme('airbnb-sky-diff', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '2d6cdf' },
    { token: 'string.value.json', foreground: '2f7a5d' },
    { token: 'string.json', foreground: '2f7a5d' },
    { token: 'number.json', foreground: '6f42c1' },
    { token: 'keyword.json', foreground: 'c13f4d' },
    { token: 'operator.json', foreground: '5f6b77' },
    { token: 'delimiter.bracket.json', foreground: '5f6b77' }
  ],
  colors: {
    'editor.background': '#eef6ff',
    'editor.foreground': '#1b2b3a',
    'editor.selectionBackground': '#cfe2ff',
    'editor.selectionHighlightBackground': '#e3efff',
    'editor.inactiveSelectionBackground': '#e3efff',
    'diffEditorGutter.removedLineBackground': '#ffdce0',
    'diffEditor.removedTextBackground': '#fb383840',
    'diffEditorGutter.insertedLineBackground': '#aceebb',
    'diffEditor.insertedTextBackground': '#0c8d2650',
    'diffEditor.border': '#c7d9f2',
  }
});

// --- New Themes ---

monaco.editor.defineTheme('monokai-diff', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '66d9ef' },
    { token: 'string.value.json', foreground: 'e6db74' },
    { token: 'string.json', foreground: 'e6db74' },
    { token: 'number.json', foreground: 'ae81ff' },
    { token: 'keyword.json', foreground: 'f92672' },
    { token: 'operator.json', foreground: 'f8f8f2' },
    { token: 'delimiter.bracket.json', foreground: 'f8f8f2' }
  ],
  colors: {
    'editor.background': '#272822',
    'editor.foreground': '#f8f8f2',
    'editor.selectionBackground': '#49483e',
    'editor.selectionHighlightBackground': '#3e3d32',
    'editor.inactiveSelectionBackground': '#3e3d32',
    'diffEditorGutter.removedLineBackground': '#4b2029',
    'diffEditor.removedTextBackground': '#f9267280',
    'diffEditorGutter.insertedLineBackground': '#1e3a1e',
    'diffEditor.insertedTextBackground': '#a6e22e50',
    'diffEditor.border': '#3e3d32',
  }
});

monaco.editor.defineTheme('dracula-diff', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '8be9fd' },
    { token: 'string.value.json', foreground: 'f1fa8c' },
    { token: 'string.json', foreground: 'f1fa8c' },
    { token: 'number.json', foreground: 'bd93f9' },
    { token: 'keyword.json', foreground: 'ff79c6' },
    { token: 'operator.json', foreground: 'f8f8f2' },
    { token: 'delimiter.bracket.json', foreground: 'f8f8f2' }
  ],
  colors: {
    'editor.background': '#282a36',
    'editor.foreground': '#f8f8f2',
    'editor.selectionBackground': '#44475a',
    'editor.selectionHighlightBackground': '#3a3c4e',
    'editor.inactiveSelectionBackground': '#3a3c4e',
    'diffEditorGutter.removedLineBackground': '#4b2030',
    'diffEditor.removedTextBackground': '#ff555580',
    'diffEditorGutter.insertedLineBackground': '#1e3a28',
    'diffEditor.insertedTextBackground': '#50fa7b50',
    'diffEditor.border': '#44475a',
  }
});

monaco.editor.defineTheme('nord-diff', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '88c0d0' },
    { token: 'string.value.json', foreground: 'a3be8c' },
    { token: 'string.json', foreground: 'a3be8c' },
    { token: 'number.json', foreground: 'b48ead' },
    { token: 'keyword.json', foreground: 'bf616a' },
    { token: 'operator.json', foreground: 'd8dee9' },
    { token: 'delimiter.bracket.json', foreground: 'd8dee9' }
  ],
  colors: {
    'editor.background': '#2e3440',
    'editor.foreground': '#d8dee9',
    'editor.selectionBackground': '#434c5e',
    'editor.selectionHighlightBackground': '#3b4252',
    'editor.inactiveSelectionBackground': '#3b4252',
    'diffEditorGutter.removedLineBackground': '#3b2230',
    'diffEditor.removedTextBackground': '#bf616a60',
    'diffEditorGutter.insertedLineBackground': '#1e3428',
    'diffEditor.insertedTextBackground': '#a3be8c50',
    'diffEditor.border': '#3b4252',
  }
});

monaco.editor.defineTheme('solarized-light-diff', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '268bd2' },
    { token: 'string.value.json', foreground: '2aa198' },
    { token: 'string.json', foreground: '2aa198' },
    { token: 'number.json', foreground: 'd33682' },
    { token: 'keyword.json', foreground: 'cb4b16' },
    { token: 'operator.json', foreground: '657b83' },
    { token: 'delimiter.bracket.json', foreground: '657b83' }
  ],
  colors: {
    'editor.background': '#fdf6e3',
    'editor.foreground': '#657b83',
    'editor.selectionBackground': '#eee8d5',
    'editor.selectionHighlightBackground': '#eee8d5',
    'editor.inactiveSelectionBackground': '#eee8d5',
    'diffEditorGutter.removedLineBackground': '#ffdce0',
    'diffEditor.removedTextBackground': '#dc322f40',
    'diffEditorGutter.insertedLineBackground': '#d5f0d5',
    'diffEditor.insertedTextBackground': '#85990050',
    'diffEditor.border': '#eee8d5',
  }
});

const indentationSize = 4;
const useTabs = false;

const THEME_STORAGE_KEY = 'diffright-theme-mode';
const ORIGINAL_STORAGE_KEY = 'diffright-session-original';
const MODIFIED_STORAGE_KEY = 'diffright-session-modified';
const VIEW_STORAGE_KEY = 'diffright-session-view';

const MONACO_THEME_BY_MODE = {
  dark: 'airbnb-dark-diff',
  light: 'airbnb-light-diff',
  synthwave: 'airbnb-synthwave-diff',
  pink: 'airbnb-cute-diff',
  midnight: 'airbnb-midnight-diff',
  sand: 'airbnb-sand-diff',
  slate: 'airbnb-slate-diff',
  sky: 'airbnb-sky-diff',
  monokai: 'monokai-diff',
  dracula: 'dracula-diff',
  nord: 'nord-diff',
  solarized: 'solarized-light-diff',
};
monaco.editor.setTheme(MONACO_THEME_BY_MODE.dark);

export default function App() {
  const containerRef = useRef(null);
  const diffEditorRef = useRef(null);
  const beautifierRef = useRef(new CodeBeautifier());
  const originalFileRef = useRef(null);
  const modifiedFileRef = useRef(null);
  const lastDetectedLangRef = useRef({ original: 'plaintext', modified: 'plaintext' });

  const [originalLanguage, setOriginalLanguage] = useState('plaintext');
  const [modifiedLanguage, setModifiedLanguage] = useState('plaintext');
  const [originalStats, setOriginalStats] = useState({ lines: 0, characters: 0, words: 0 });
  const [modifiedStats, setModifiedStats] = useState({ lines: 0, characters: 0, words: 0 });
  const [isSideBySide, setIsSideBySide] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = sessionStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === 'inline') return false;
    if (stored === 'side-by-side') return true;
    return true;
  });
  const [isBeautifying, setIsBeautifying] = useState({ original: false, modified: false });
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem(THEME_STORAGE_KEY) ?? 'light';
  });
  const [dragOver, setDragOver] = useState({ original: false, modified: false });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const themeSequence = ['dark', 'light', 'synthwave', 'pink', 'midnight', 'sand', 'slate', 'sky', 'monokai', 'dracula', 'nord', 'solarized'];
  const themeLabels = {
    dark: 'Night',
    light: 'Dawn',
    synthwave: 'Neon',
    pink: 'Rose',
    midnight: 'Midnight',
    sand: 'Sand',
    slate: 'Slate',
    sky: 'Sky',
    monokai: 'Monokai',
    dracula: 'Dracula',
    nord: 'Nord',
    solarized: 'Solarized',
  };
  const themeIcons = {
    dark: <Moon size={16} />,
    light: <Sun size={16} />,
    synthwave: <Palette size={16} />,
    pink: <Heart size={16} />,
    midnight: <Moon size={16} />,
    sand: <Sun size={16} />,
    slate: <Palette size={16} />,
    sky: <Sun size={16} />,
    monokai: <Palette size={16} />,
    dracula: <Moon size={16} />,
    nord: <Moon size={16} />,
    solarized: <Sun size={16} />,
  };
  const themeGroups = [
    { label: 'Light', items: ['light', 'sand', 'sky', 'pink', 'solarized'] },
    { label: 'Dark', items: ['dark', 'midnight', 'synthwave', 'slate', 'monokai', 'dracula', 'nord'] }
  ];
  const getNextTheme = current => {
    const idx = themeSequence.indexOf(current);
    const nextIndex = idx >= 0 ? (idx + 1) % themeSequence.length : 0;
    return themeSequence[nextIndex];
  };
  const nextTheme = getNextTheme(themeMode);
  const themeIcon = themeIcons[themeMode] ?? themeIcons.dark;
  const themeLabel = themeLabels[themeMode] ?? themeLabels.dark;
  const nextThemeLabel = themeLabels[nextTheme] ?? nextTheme;
  const getEditor = (side) => side === 'original'
    ? diffEditorRef.current.getOriginalEditor()
    : diffEditorRef.current.getModifiedEditor();

  const getLanguage = (side) => side === 'original' ? originalLanguage : modifiedLanguage;

  const createBeautifyHandler = (side) => async () => {
    if (!diffEditorRef.current) return;
    setIsBeautifying(prev => ({ ...prev, [side]: true }));
    try {
      const model = getEditor(side).getModel();
      const language = model.getLanguageId() === 'jsx' ? 'javascript' : model.getLanguageId();
      const code = model.getValue();
      if (beautifierRef.current.isBeautifiable(language)) {
        const beautified = await beautifierRef.current.beautify(code, language, { indentationSize, useTabs });
        model.setValue(beautified);
        analytics.beautify(language, side);
      } else {
        console.warn(`Beautification not supported for ${language}`);
      }
    } catch (error) {
      console.error('Beautification failed:', error);
    } finally {
      setIsBeautifying(prev => ({ ...prev, [side]: false }));
    }
  };

  const createSortHandler = (side) => async () => {
    if (diffEditorRef.current && getLanguage(side) === 'json') {
      try {
        const model = getEditor(side).getModel();
        model.setValue(beautifierRef.current.sortJson(model.getValue(), { indentationSize }));
        analytics.sortJson(side);
      } catch (error) {
        console.error('JSON sorting failed:', error);
      }
    }
  };

  const createCompactHandler = (side) => async () => {
    if (diffEditorRef.current && getLanguage(side) === 'json') {
      try {
        const model = getEditor(side).getModel();
        model.setValue(beautifierRef.current.compactJson(model.getValue()));
        analytics.compactJson(side);
      } catch (error) {
        console.error('JSON compacting failed:', error);
      }
    }
  };

  const createConvertToYamlHandler = (side) => async () => {
    if (diffEditorRef.current && getLanguage(side) === 'json') {
      try {
        const model = getEditor(side).getModel();
        model.setValue(beautifierRef.current.convertJsonToYaml(model.getValue()));
        monaco.editor.setModelLanguage(model, 'yaml');
        analytics.convertJsonToYaml(side);
      } catch (error) {
        console.error('JSON to YAML conversion failed:', error);
      }
    }
  };

  const createConvertToJsonHandler = (side) => async () => {
    if (diffEditorRef.current && getLanguage(side) === 'yaml') {
      try {
        const model = getEditor(side).getModel();
        model.setValue(beautifierRef.current.convertYamlToJson(model.getValue()));
        monaco.editor.setModelLanguage(model, 'json');
        analytics.convertYamlToJson(side);
      } catch (error) {
        console.error('YAML to JSON conversion failed:', error);
      }
    }
  };

  const isLanguageBeautifiable = (language) => {
    return beautifierRef.current.isBeautifiable(language);
  };

  // --- File import handlers ---

  const handleFileImport = useCallback((side, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!diffEditorRef.current) return;
      const model = getEditor(side).getModel();
      model.setValue(e.target.result);
      const ext = file.name.split('.').pop() || '';
      analytics.fileImported(side, ext);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((side) => (e) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [side]: false }));
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileImport(side, file);
  }, [handleFileImport]);

  const handleDragOver = useCallback((side) => (e) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [side]: true }));
  }, []);

  const handleDragLeave = useCallback((side) => () => {
    setDragOver(prev => ({ ...prev, [side]: false }));
  }, []);

  const handleFileInputChange = useCallback((side) => (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileImport(side, file);
    e.target.value = '';
  }, [handleFileImport]);

  // --- History restore ---

  const handleHistoryRestore = useCallback((original, modified) => {
    if (!diffEditorRef.current) return;
    diffEditorRef.current.getOriginalEditor().getModel().setValue(original);
    diffEditorRef.current.getModifiedEditor().getModel().setValue(modified);
  }, []);

  // --- Share content getter ---

  const getShareContent = useCallback(() => {
    if (!diffEditorRef.current) return { original: '', modified: '', originalLang: null, modifiedLang: null };
    return {
      original: diffEditorRef.current.getOriginalEditor().getModel().getValue(),
      modified: diffEditorRef.current.getModifiedEditor().getModel().getValue(),
      originalLang: originalLanguage,
      modifiedLang: modifiedLanguage,
    };
  }, [originalLanguage, modifiedLanguage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(VIEW_STORAGE_KEY, isSideBySide ? 'side-by-side' : 'inline');
  }, [isSideBySide]);

  useEffect(() => {
    const rootElement = document.documentElement;
    const themeClass = `theme-${themeMode}`;
    rootElement.classList.remove(
      'theme-dark',
      'theme-light',
      'theme-synthwave',
      'theme-pink',
      'theme-midnight',
      'theme-sand',
      'theme-slate',
      'theme-sky',
      'theme-monokai',
      'theme-dracula',
      'theme-nord',
      'theme-solarized'
    );
    rootElement.classList.add(themeClass);

    const monacoTheme = MONACO_THEME_BY_MODE[themeMode] ?? MONACO_THEME_BY_MODE.dark;
    monaco.editor.setTheme(monacoTheme);

    if (diffEditorRef.current) {
      diffEditorRef.current.updateOptions({ theme: monacoTheme });
    }

    return () => {
      rootElement.classList.remove(themeClass);
    };
  }, [themeMode]);

  useEffect(() => {
    if (!containerRef.current || diffEditorRef.current) return;

    const initialTheme = MONACO_THEME_BY_MODE[themeMode] ?? MONACO_THEME_BY_MODE.dark;
    diffEditorRef.current = monaco.editor.createDiffEditor(containerRef.current, {
      theme: initialTheme,
      automaticLayout: true,
      renderSideBySide: isSideBySide,
      splitViewDefaultRatio: 0.512,
      enableSplitViewResizing: false,
      useInlineViewWhenSpaceIsLimited: false,
      minimap: { enabled: false },
      fontFamily: 'ui-monospace, SFMono-Regular, SFMono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 13,
      lineHeight: 20,
      wordWrap: 'on',
      renderWhitespace: 'boundary',
      lineNumbers: 'on',
      glyphMargin: false,
      folding: true,
      diffAlgorithm: 'legacy',
      lineNumbersMinChars: 3,
      originalEditable: true,
      readOnly: false,
      scrollBeyondLastLine: false,
      scrollBeyondLastColumn: 3
    });

    const originalModel = monaco.editor.createModel('', originalLanguage);
    const modifiedModel = monaco.editor.createModel('', modifiedLanguage);
    diffEditorRef.current.setModel({ original: originalModel, modified: modifiedModel });
    if (typeof window !== 'undefined') {
      const savedOriginal = sessionStorage.getItem(ORIGINAL_STORAGE_KEY);
      const savedModified = sessionStorage.getItem(MODIFIED_STORAGE_KEY);
      if (savedOriginal !== null) {
        originalModel.setValue(savedOriginal);
      }
      if (savedModified !== null) {
        modifiedModel.setValue(savedModified);
      }
    }
    diffEditorRef.current.getOriginalEditor().updateOptions({
      padding: { top: 16, bottom: 16 },
      lineNumbersMinChars: 1,
    });
    diffEditorRef.current.getModifiedEditor().updateOptions({
      padding: { top: 16, bottom: 16, right: 20 }
    });
    diffEditorRef.current.updateOptions({
      splitViewDefaultRatio: 0.512
    });
    diffEditorRef.current.layout();

    // Update handlers
    const updateOriginal = () => {
      const val = originalModel.getValue();
      const stats = calculateStats(val);
      const lang = detectLanguage(val);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(ORIGINAL_STORAGE_KEY, val);
      }

      setOriginalStats(stats);
      setOriginalLanguage(lang);

      if (originalModel.getLanguageId() !== lang) {
        monaco.editor.setModelLanguage(originalModel, lang);
      }

      // Track language detection (only on change)
      if (lang !== lastDetectedLangRef.current.original) {
        lastDetectedLangRef.current.original = lang;
        if (lang !== 'plaintext') analytics.languageDetected(lang, 'original');
      }

      // Auto-save to history
      const modifiedVal = modifiedModel.getValue();
      if (val || modifiedVal) saveSnapshot(val, modifiedVal);
    };

    const updateModified = () => {
      const val = modifiedModel.getValue();
      const stats = calculateStats(val);
      const lang = detectLanguage(val);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(MODIFIED_STORAGE_KEY, val);
      }

      setModifiedStats(stats);
      setModifiedLanguage(lang);

      if (modifiedModel.getLanguageId() !== lang) {
        monaco.editor.setModelLanguage(modifiedModel, lang);
      }

      // Track language detection (only on change)
      if (lang !== lastDetectedLangRef.current.modified) {
        lastDetectedLangRef.current.modified = lang;
        if (lang !== 'plaintext') analytics.languageDetected(lang, 'modified');
      }

      // Auto-save to history
      const originalVal = originalModel.getValue();
      if (val || originalVal) saveSnapshot(originalVal, val);
    };

    originalModel.onDidChangeContent(updateOriginal);
    modifiedModel.onDidChangeContent(updateModified);
    updateOriginal();
    updateModified();

    // Paste event tracking
    const origEditor = diffEditorRef.current.getOriginalEditor();
    const modEditor = diffEditorRef.current.getModifiedEditor();

    const handleOrigPaste = (e) => {
      const text = e.clipboardData?.getData('text') || '';
      if (text.length > 0) analytics.contentPasted('original', text.length);
    };
    const handleModPaste = (e) => {
      const text = e.clipboardData?.getData('text') || '';
      if (text.length > 0) analytics.contentPasted('modified', text.length);
    };

    origEditor.getDomNode?.()?.addEventListener('paste', handleOrigPaste);
    modEditor.getDomNode?.()?.addEventListener('paste', handleModPaste);

  }, [isSideBySide, themeMode]);

  useEffect(() => {
    if (diffEditorRef.current) {
      diffEditorRef.current.updateOptions({
        renderSideBySide: isSideBySide,
        splitViewDefaultRatio: 0.512
      });
      diffEditorRef.current.layout();
    }
  }, [isSideBySide, themeMode]);

  return (
    <>
      <Helmet>
        <title>Diff Please - Fast, Privacy-First Code Comparison Tool</title>
        <meta name="description" content="Compare code side-by-side or inline with syntax highlighting. Privacy-first diff tool with beautify, JSON utilities, and theme support. No sign-up required." />
        <meta name="keywords" content="code diff, compare code, diff tool, code comparison, syntax highlighting, developer tools, privacy-first" />
        <link rel="canonical" href="https://diffplease.com/" />
      </Helmet>
      <div className="app">
      <div className="app-header">
        <div className="header-left">
          <svg width="40" height="32" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="header-icon">
            <path d="M14 19L6 12L14 5" stroke="#da3633" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 5L30 12L22 19" stroke="#2ea043" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="header-text"><h1>Diff Please</h1></div>
        </div>
        <div className="header-actions">
          {db && (
            <button
              className="header-action-btn"
              onClick={() => setHistoryOpen(true)}
              title="History"
              aria-label="View history"
            >
              <Clock size={16} />
            </button>
          )}

          {db && (
            <button
              className="header-action-btn share-btn"
              onClick={() => setShareOpen(true)}
              title="Share"
              aria-label="Share diff"
            >
              <Share2 size={14} />
              <span>Share Code</span>
            </button>
          )}

          <div className="theme-dropdown">
            <select
              className="theme-dropdown-select"
              value={themeMode}
              onChange={(e) => {
                setThemeMode(e.target.value);
                analytics.changeTheme(e.target.value);
              }}
              title="Select Theme"
              aria-label="Select theme"
            >
              {themeGroups.map(group => (
                <optgroup key={group.label} label={`${group.label} themes`}>
                  {group.items.map(theme => (
                    <option key={theme} value={theme}>
                      {themeLabels[theme]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <span className="theme-dropdown-icon">{themeIcon}</span>
            <span className="theme-dropdown-label">{themeLabel}</span>
            <ChevronDown size={14} className="theme-dropdown-arrow" />
          </div>
          <Link to="/faq" className="faq-button" title="FAQ" aria-label="Frequently Asked Questions" onClick={() => analytics.faqVisited()}>
            ?
          </Link>
        </div>
      </div>

      <div
        className="editor-container"
        ref={containerRef}
      >
        {/* Drop zone overlays */}
        <div
          className={`drop-zone drop-zone-left ${dragOver.original ? 'active' : ''}`}
          onDragOver={handleDragOver('original')}
          onDragLeave={handleDragLeave('original')}
          onDrop={handleDrop('original')}
        >
          {dragOver.original && <div className="drop-zone-label">Drop file here (Original)</div>}
        </div>
        <div
          className={`drop-zone drop-zone-right ${dragOver.modified ? 'active' : ''}`}
          onDragOver={handleDragOver('modified')}
          onDragLeave={handleDragLeave('modified')}
          onDrop={handleDrop('modified')}
        >
          {dragOver.modified && <div className="drop-zone-label">Drop file here (Modified)</div>}
        </div>
      </div>

      <div className="app-footer">
        <div className="footer-stats">
          <div className="stats-display">
            <div className="metric-group" aria-live="polite" role="status">
              <span className="metric">{originalStats.lines} lines</span>
              <span className="metric">{originalStats.words} words</span>
              <span className="metric">{originalStats.characters} chars</span>
            </div>
            {originalLanguage !== 'plaintext' && (
              <span className="language-indicator">{originalLanguage}</span>
            )}
            <button
              className="beautify-btn file-import-btn"
              onClick={() => originalFileRef.current?.click()}
              title="Open file"
            >
              <Upload size={12} /> Open
            </button>
            <input
              ref={originalFileRef}
              type="file"
              className="hidden-file-input"
              onChange={handleFileInputChange('original')}
              accept=".js,.jsx,.ts,.tsx,.json,.html,.css,.scss,.less,.md,.yaml,.yml,.xml,.py,.java,.c,.cpp,.go,.rs,.rb,.sql,.txt,.sh,.php,.swift,.kt"
            />
            {isLanguageBeautifiable(originalLanguage) && (
              <button
                className={`beautify-btn ${isBeautifying.original ? 'beautifying' : ''}`}
                onClick={createBeautifyHandler('original')}
                disabled={isBeautifying.original}
                title={`Beautify ${originalLanguage}`}
                aria-busy={isBeautifying.original}
              >
                {isBeautifying.original ? (
                  <>
                    <Sparkles size={12} className="spinning" />
                    Beautifying...
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    Beautify
                  </>
                )}
              </button>
            )}
            {originalLanguage === 'json' && (
              <>
                <button
                  className="beautify-btn"
                  onClick={createSortHandler('original')}
                  title="Sort JSON"
                >
                  <SortAsc size={12} /> Sort
                </button>
                <button
                  className="beautify-btn"
                  onClick={createCompactHandler('original')}
                  title="Minify JSON"
                >
                  <Minimize size={12} /> Minify
                </button>
                <button
                  className="beautify-btn convert-btn"
                  onClick={createConvertToYamlHandler('original')}
                  title="Convert JSON to YAML"
                >
                  <Wand size={12} /> JSON to YAML
                </button>
              </>
            )}
            {originalLanguage === 'yaml' && (
              <>
                <button
                  className="beautify-btn convert-btn"
                  onClick={createConvertToJsonHandler('original')}
                  title="Convert YAML to JSON"
                >
                  <Wand size={12} /> YAML to JSON
                </button>
              </>
            )}
          </div>
          <div className="view-toggle-container">
            <button
              className="view-toggle-btn"
              onClick={() => {
                const newMode = !isSideBySide;
                setIsSideBySide(newMode);
                analytics.toggleView(newMode ? 'side-by-side' : 'inline');
              }}
              title={isSideBySide ? "Switch to Unified View" : "Switch to Side-by-Side View"}
            >
              {isSideBySide ? <AlignLeft size={20} /> : <Columns size={16} />}
            </button>
          </div>
          <div className="stats-display modified-panel">
            <div className="modified-actions">
              {modifiedLanguage !== 'plaintext' && (
                <span className="language-indicator">{modifiedLanguage}</span>
              )}
              <button
                className="beautify-btn file-import-btn"
                onClick={() => modifiedFileRef.current?.click()}
                title="Open file"
              >
                <Upload size={12} /> Open
              </button>
              <input
                ref={modifiedFileRef}
                type="file"
                className="hidden-file-input"
                onChange={handleFileInputChange('modified')}
                accept=".js,.jsx,.ts,.tsx,.json,.html,.css,.scss,.less,.md,.yaml,.yml,.xml,.py,.java,.c,.cpp,.go,.rs,.rb,.sql,.txt,.sh,.php,.swift,.kt"
              />
              {isLanguageBeautifiable(modifiedLanguage) && (
                <button
                  className={`beautify-btn ${isBeautifying.modified ? 'beautifying' : ''}`}
                  onClick={createBeautifyHandler('modified')}
                  disabled={isBeautifying.modified}
                  title={`Beautify ${modifiedLanguage}`}
                  aria-busy={isBeautifying.modified}
                >
                  {isBeautifying.modified ? (
                    <>
                      <Sparkles size={12} className="spinning" />
                      Beautifying...
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} />
                      Beautify
                    </>
                  )}
                </button>
              )}
              {modifiedLanguage === 'json' && (
                <>
                  <button
                    className="beautify-btn"
                    onClick={createSortHandler('modified')}
                    title="Sort JSON"
                  >
                    <SortAsc size={12} /> Sort
                  </button>
                  <button
                    className="beautify-btn"
                    onClick={createCompactHandler('modified')}
                    title="Minify JSON"
                  >
                    <Minimize size={12} /> Minify
                  </button>
                  <button
                    className="beautify-btn convert-btn"
                    onClick={createConvertToYamlHandler('modified')}
                    title="Convert JSON to YAML"
                  >
                    <Wand size={12} /> JSON to YAML
                  </button>
                </>
              )}
              {modifiedLanguage === 'yaml' && (
                <>
                  <button
                    className="beautify-btn convert-btn"
                    onClick={createConvertToJsonHandler('modified')}
                    title="Convert YAML to JSON"
                  >
                    <Wand size={12} /> YAML to JSON
                  </button>
                </>
              )}
            </div>
            <div className="metric-group align-right" aria-live="polite" role="status">
              <span className="metric">{modifiedStats.lines} lines</span>
              <span className="metric">{modifiedStats.words} words</span>
              <span className="metric">{modifiedStats.characters} chars</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <HistoryPanel
      isOpen={historyOpen}
      onClose={() => setHistoryOpen(false)}
      onRestore={handleHistoryRestore}
    />

    <ShareModal
      isOpen={shareOpen}
      onClose={() => setShareOpen(false)}
      getContent={getShareContent}
    />
    </>
  );
}
