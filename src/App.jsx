import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Code, Columns, AlignLeft, Sparkles, Wand, SortAsc, Minimize, Sun, Moon, Palette, Heart, Upload, Clock, Share2 } from 'lucide-react';
import * as monaco from 'monaco-editor';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
import './globals.css';
import { CodeBeautifier, calculateStats, detectLanguage } from './lib/codeUtils';
import { analytics } from './services/analytics';
import { saveSnapshot } from './lib/historyStore';
import { db } from './lib/firebase';
import HistoryPanel from './components/HistoryPanel';
import ShareModal from './components/ShareModal';
import { Toaster, toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './components/ui/tooltip';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectValue,
} from './components/ui/select';


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



const indentationSize = 4;
const useTabs = false;

const THEME_STORAGE_KEY = 'diffright-theme-mode';
const ORIGINAL_STORAGE_KEY = 'diffright-session-original';
const MODIFIED_STORAGE_KEY = 'diffright-session-modified';
const VIEW_STORAGE_KEY = 'diffright-session-view';

const MONACO_THEME_BY_MODE = {
  dark: 'airbnb-dark-diff',
  light: 'airbnb-light-diff',
  pink: 'airbnb-cute-diff',
  midnight: 'airbnb-midnight-diff',
  sand: 'airbnb-sand-diff',
  slate: 'airbnb-slate-diff',
  sky: 'airbnb-sky-diff',
  monokai: 'monokai-diff',
};
monaco.editor.setTheme(MONACO_THEME_BY_MODE.dark);

const btnBase = 'flex items-center gap-1 px-2.5 py-1 bg-btn-bg text-btn-text border border-btn-border rounded-md text-[0.65rem] font-semibold cursor-pointer transition-all duration-200 uppercase tracking-wide whitespace-nowrap hover:enabled:bg-btn-hover hover:enabled:-translate-y-px disabled:opacity-70 disabled:cursor-not-allowed';

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
  const [diffStats, setDiffStats] = useState({ additions: 0, deletions: 0 });

  const themeLabels = {
    dark: 'Night',
    light: 'Dawn',
    pink: 'Rose',
    midnight: 'Midnight',
    sand: 'Sand',
    slate: 'Slate',
    sky: 'Sky',
    monokai: 'Monokai',
  };
  const themeIcons = {
    dark: <Moon size={16} />,
    light: <Sun size={16} />,
    pink: <Heart size={16} />,
    midnight: <Moon size={16} />,
    sand: <Sun size={16} />,
    slate: <Palette size={16} />,
    sky: <Sun size={16} />,
    monokai: <Palette size={16} />,
  };
  const themeGroups = [
    { label: 'Light', items: ['light', 'sand', 'sky', 'pink'] },
    { label: 'Dark', items: ['dark', 'midnight', 'slate', 'monokai'] }
  ];
  const themeIcon = themeIcons[themeMode] ?? themeIcons.dark;
  const themeLabel = themeLabels[themeMode] ?? themeLabels.dark;
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
        toast.success(`Beautified ${language}`);
        analytics.beautify(language, side);
      } else {
        console.warn(`Beautification not supported for ${language}`);
      }
    } catch (error) {
      console.error('Beautification failed:', error);
      toast.error('Beautification failed');
    } finally {
      setIsBeautifying(prev => ({ ...prev, [side]: false }));
    }
  };

  const createSortHandler = (side) => async () => {
    if (diffEditorRef.current && getLanguage(side) === 'json') {
      try {
        const model = getEditor(side).getModel();
        model.setValue(beautifierRef.current.sortJson(model.getValue(), { indentationSize }));
        toast.success('JSON sorted');
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
        toast.success('JSON minified');
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
        toast.success('Converted to YAML');
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
        toast.success('Converted to JSON');
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
      'theme-pink',
      'theme-midnight',
      'theme-sand',
      'theme-slate',
      'theme-sky',
      'theme-monokai',
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

      if (lang !== lastDetectedLangRef.current.original) {
        lastDetectedLangRef.current.original = lang;
        if (lang !== 'plaintext') analytics.languageDetected(lang, 'original');
      }

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

      if (lang !== lastDetectedLangRef.current.modified) {
        lastDetectedLangRef.current.modified = lang;
        if (lang !== 'plaintext') analytics.languageDetected(lang, 'modified');
      }

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

    // Track diff stats (additions/deletions)
    diffEditorRef.current.onDidUpdateDiff(() => {
      const changes = diffEditorRef.current.getLineChanges() || [];
      let additions = 0;
      let deletions = 0;
      for (const change of changes) {
        if (change.originalEndLineNumber >= change.originalStartLineNumber) {
          deletions += change.originalEndLineNumber - change.originalStartLineNumber + 1;
        }
        if (change.modifiedEndLineNumber >= change.modifiedStartLineNumber) {
          additions += change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1;
        }
        // Pure addition (no original lines removed)
        if (change.originalEndLineNumber === 0) deletions -= 1;
        // Pure deletion (no modified lines added)
        if (change.modifiedEndLineNumber === 0) additions -= 1;
      }
      setDiffStats({ additions: Math.max(0, additions), deletions: Math.max(0, deletions) });
    });

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

  const TipButton = ({ tip, children, ...props }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button {...props}>{children}</button>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );

  const renderSideButtons = (side, language, isBeautifyingState) => (
    <>
      {language !== 'plaintext' && (
        <span className="text-lang-indicator font-semibold uppercase py-0.5 px-1.5 bg-[rgba(88,166,255,0.12)] rounded text-[0.7rem]">
          {language}
        </span>
      )}
      <TipButton
        tip="Open file"
        className={`${btnBase} text-[0.6rem]`}
        onClick={() => { (side === 'original' ? originalFileRef : modifiedFileRef).current?.click(); analytics.fileOpened(side); }}
        title="Open file"
      >
        <Upload size={12} /> Open
      </TipButton>
      <input
        ref={side === 'original' ? originalFileRef : modifiedFileRef}
        type="file"
        className="hidden"
        onChange={handleFileInputChange(side)}
        accept=".js,.jsx,.ts,.tsx,.json,.html,.css,.scss,.less,.md,.yaml,.yml,.xml,.py,.java,.c,.cpp,.go,.rs,.rb,.sql,.txt,.sh,.php,.swift,.kt"
      />
      {isLanguageBeautifiable(language) && (
        <TipButton
          tip={`Beautify ${language}`}
          className={`${btnBase} ${isBeautifyingState ? 'bg-btn-hover' : ''}`}
          onClick={createBeautifyHandler(side)}
          disabled={isBeautifyingState}
          title={`Beautify ${language}`}
          aria-busy={isBeautifyingState}
        >
          {isBeautifyingState ? (
            <>
              <Sparkles size={12} className="animate-spin" />
              Beautifying...
            </>
          ) : (
            <>
              <Sparkles size={12} />
              Beautify
            </>
          )}
        </TipButton>
      )}
      {language === 'json' && (
        <>
          <TipButton tip="Sort JSON keys alphabetically" className={btnBase} onClick={createSortHandler(side)} title="Sort JSON">
            <SortAsc size={12} /> Sort
          </TipButton>
          <TipButton tip="Minify JSON (remove whitespace)" className={btnBase} onClick={createCompactHandler(side)} title="Minify JSON">
            <Minimize size={12} /> Minify
          </TipButton>
          <TipButton tip="Convert JSON to YAML" className={btnBase} onClick={createConvertToYamlHandler(side)} title="Convert JSON to YAML">
            <Wand size={12} /> JSON to YAML
          </TipButton>
        </>
      )}
      {language === 'yaml' && (
        <TipButton tip="Convert YAML to JSON" className={btnBase} onClick={createConvertToJsonHandler(side)} title="Convert YAML to JSON">
          <Wand size={12} /> YAML to JSON
        </TipButton>
      )}
    </>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <Helmet>
        <title>Diff Please - Fast, Privacy-First Code Comparison Tool</title>
        <meta name="description" content="Compare code side-by-side or inline with syntax highlighting. Privacy-first diff tool with beautify, JSON utilities, and theme support. No sign-up required." />
        <meta name="keywords" content="code diff, compare code, diff tool, code comparison, syntax highlighting, developer tools, privacy-first" />
        <link rel="canonical" href="https://diffplease.com/" />
      </Helmet>
      <div className="flex flex-col h-screen font-[-apple-system,BlinkMacSystemFont,'Segoe_UI','Noto_Sans',Helvetica,Arial,sans-serif]">
      <div className="flex justify-center items-center p-2.5 text-dark-text shrink-0 relative z-10 bg-header-bg border-b border-header-border">
        <div className="flex items-center gap-3 -ml-14">
          <svg width="40" height="32" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="header-icon w-10 h-8 transition-all duration-300 shrink-0 cursor-pointer hover:scale-[1.08] hover:-rotate-2 hover:drop-shadow-[0_6px_12px_rgba(0,0,0,0.15)]">
            <path d="M14 19L6 12L14 5" stroke="#da3633" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 5L30 12L22 19" stroke="#2ea043" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div><h1 className="m-0 text-2xl font-extrabold font-mono tracking-tighter text-dark-text">Diff Please</h1></div>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full border border-btn-border bg-btn-bg text-btn-text cursor-pointer transition-all duration-200 mr-2 hover:bg-btn-hover hover:-translate-y-px"
                onClick={() => {
                  const newMode = !isSideBySide;
                  setIsSideBySide(newMode);
                  analytics.toggleView(newMode ? 'side-by-side' : 'inline');
                }}
                title={isSideBySide ? "Switch to Unified View" : "Switch to Side-by-Side View"}
                aria-label={isSideBySide ? "Switch to Unified View" : "Switch to Side-by-Side View"}
              >
                {isSideBySide ? <AlignLeft size={16} /> : <Columns size={16} />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{isSideBySide ? 'Unified View' : 'Side-by-Side View'}</TooltipContent>
          </Tooltip>

          {db && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center justify-center w-8 h-8 rounded-full border border-btn-border bg-btn-bg text-btn-text cursor-pointer transition-all duration-200 mr-2 hover:bg-btn-hover hover:-translate-y-px"
                  onClick={() => { setHistoryOpen(true); analytics.historyOpened(); }}
                  title="History"
                  aria-label="View history"
                >
                  <Clock size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>View history</TooltipContent>
            </Tooltip>
          )}

          {db && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center justify-center h-8 w-auto rounded-full border border-btn-border bg-btn-bg text-btn-text cursor-pointer transition-all duration-200 mr-2 px-2.5 gap-1.5 text-[0.7rem] font-semibold tracking-wide hover:bg-btn-hover hover:-translate-y-px"
                  onClick={() => { setShareOpen(true); analytics.shareOpened(); }}
                  title="Share"
                  aria-label="Share diff"
                >
                  <Share2 size={14} />
                  <span>Share Diff</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Share this diff with a link</TooltipContent>
            </Tooltip>
          )}

          <Select
            value={themeMode}
            onValueChange={(value) => {
              setThemeMode(value);
              analytics.changeTheme(value);
            }}
          >
            <SelectTrigger aria-label="Select theme">
              <span className="flex items-center">{themeIcon}</span>
              <span className="leading-none">{themeLabel}</span>
            </SelectTrigger>
            <SelectContent>
              {themeGroups.map(group => (
                <SelectGroup key={group.label}>
                  <SelectLabel>{group.label} themes</SelectLabel>
                  {group.items.map(theme => (
                    <SelectItem key={theme} value={theme}>
                      <span className="flex items-center gap-2">
                        {themeIcons[theme]}
                        {themeLabels[theme]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/faq"
                className="flex items-center justify-center w-8 h-8 rounded-full border border-dropdown-border bg-dropdown-bg text-dropdown-text text-base font-bold no-underline transition-all duration-200 cursor-pointer ml-2 hover:bg-dropdown-hover hover:-translate-y-px"
                title="FAQ"
                aria-label="Frequently Asked Questions"
                onClick={() => analytics.faqVisited()}
              >
                ?
              </Link>
            </TooltipTrigger>
            <TooltipContent>Frequently Asked Questions</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div
        className="flex-1 overflow-hidden relative"
        ref={containerRef}
      >
        {/* Drop zone overlays */}
        <div
          className={`absolute top-0 bottom-0 w-1/2 left-0 z-[5] pointer-events-none ${dragOver.original ? 'pointer-events-auto bg-[rgba(46,160,67,0.08)] border-2 border-dashed border-[rgba(46,160,67,0.5)] rounded' : ''}`}
          onDragOver={handleDragOver('original')}
          onDragLeave={handleDragLeave('original')}
          onDrop={handleDrop('original')}
        >
          {dragOver.original && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 py-3 px-6 bg-[rgba(46,160,67,0.15)] border border-[rgba(46,160,67,0.4)] rounded-lg text-page-text text-[0.9rem] font-semibold pointer-events-none">
              Drop file here (Original)
            </div>
          )}
        </div>
        <div
          className={`absolute top-0 bottom-0 w-1/2 right-0 z-[5] pointer-events-none ${dragOver.modified ? 'pointer-events-auto bg-[rgba(46,160,67,0.08)] border-2 border-dashed border-[rgba(46,160,67,0.5)] rounded' : ''}`}
          onDragOver={handleDragOver('modified')}
          onDragLeave={handleDragLeave('modified')}
          onDrop={handleDrop('modified')}
        >
          {dragOver.modified && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 py-3 px-6 bg-[rgba(46,160,67,0.15)] border border-[rgba(46,160,67,0.4)] rounded-lg text-page-text text-[0.9rem] font-semibold pointer-events-none">
              Drop file here (Modified)
            </div>
          )}
        </div>
      </div>

      <div className="py-1 px-4 bg-footer-bg relative z-10 border-t border-footer-border">
        <div className="grid grid-cols-[1fr_auto_1fr] w-full items-center">
          <div className="text-dark-text-secondary text-[0.85rem] font-medium text-center opacity-90 flex items-center gap-2 flex-wrap justify-self-start">
            <div className="flex gap-1.5 flex-wrap font-semibold text-[0.78rem] text-dark-text" aria-live="polite" role="status">
              <span className="tabular-nums">{originalStats.lines} lines</span>
              <span className="tabular-nums">{originalStats.words} words</span>
              <span className="tabular-nums">{originalStats.characters} chars</span>
            </div>
            {renderSideButtons('original', originalLanguage, isBeautifying.original)}
          </div>
          <div className="flex justify-center items-center -ml-8">
            {(diffStats.additions > 0 || diffStats.deletions > 0) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-grid grid-cols-2 rounded-md overflow-hidden border border-dark-border text-[0.7rem] font-bold tabular-nums leading-none cursor-default">
                    <span className="flex items-center justify-center py-1 px-2.5 bg-[rgba(46,160,67,0.15)] text-green-500 min-w-[2.5rem]">
                      +{diffStats.additions}
                    </span>
                    <span className="flex items-center justify-center py-1 px-2.5 bg-[rgba(248,81,73,0.15)] text-red-500 min-w-[2.5rem] border-l border-dark-border">
                      -{diffStats.deletions}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{diffStats.additions} additions, {diffStats.deletions} deletions</TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="text-dark-text-secondary text-[0.85rem] font-medium text-center opacity-90 flex items-center gap-2 flex-wrap justify-self-end justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {renderSideButtons('modified', modifiedLanguage, isBeautifying.modified)}
            </div>
            <div className="flex gap-1.5 flex-wrap font-semibold text-[0.78rem] text-dark-text justify-end text-right" aria-live="polite" role="status">
              <span className="tabular-nums">{modifiedStats.lines} lines</span>
              <span className="tabular-nums">{modifiedStats.words} words</span>
              <span className="tabular-nums">{modifiedStats.characters} chars</span>
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

    <Toaster
      position="bottom-center"
      toastOptions={{
        style: {
          background: 'var(--dark-bg-secondary)',
          color: 'var(--page-text-color)',
          border: '1px solid var(--dark-border)',
          fontSize: '0.8rem',
        },
      }}
    />
    </TooltipProvider>
  );
}
