import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { IconCode, IconColumns, IconAlignLeft, IconSparkles, IconWand, IconSortAscending, IconMinimize, IconSun, IconMoon, IconPalette, IconHeart, IconUpload, IconClock, IconShare, IconChevronUp, IconChevronDown, IconFold, IconEye, IconTable, IconX, IconBulb, IconHighlight, IconDeviceFloppy, IconMessageCircle } from '@tabler/icons-react';
import * as monaco from 'monaco-editor';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
import './globals.css';
import { CodeBeautifier, calculateStats, detectLanguage } from './lib/codeUtils';
import { MONACO_THEME_BY_MODE } from './lib/themes';
import { analytics } from './services/analytics';
import { saveSnapshotNow } from './lib/historyStore';
import { db } from './lib/firebase';
import HistoryPanel from './components/HistoryPanel';
import ShareModal from './components/ShareModal';
import MarkdownDiffPreview from './components/MarkdownDiffPreview';
import PreviewOverlay from './components/PreviewOverlay';
import FeedbackModal from './components/FeedbackModal';
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


const indentationSize = 4;
const useTabs = false;

const THEME_STORAGE_KEY = 'diffright-theme-mode';
const ORIGINAL_STORAGE_KEY = 'diffright-session-original';
const MODIFIED_STORAGE_KEY = 'diffright-session-modified';
const VIEW_STORAGE_KEY = 'diffright-session-view';
const COLLAPSE_STORAGE_KEY = 'diffright-collapse-unchanged';

monaco.editor.setTheme(MONACO_THEME_BY_MODE.dark);

const btnBase = 'flex items-center gap-1 px-2.5 py-1 bg-btn-bg text-btn-text border border-btn-border rounded-md text-[0.65rem] font-semibold cursor-pointer transition-all duration-200 uppercase tracking-wide whitespace-nowrap hover:enabled:bg-btn-hover hover:enabled:-translate-y-px disabled:opacity-70 disabled:cursor-not-allowed';
const btnAccent = `${btnBase} border-lang-indicator/40 text-lang-indicator`;

const TIPS = [
  'Auto-format code in any language',
  'Sort JSON keys alphabetically',
  'Minify JSON to remove whitespace',
  'Convert JSON to YAML and back',
  'Drag any type of file to compare or preview its contents',
  'Preview CSV files as tables',
  'Preview rendered Markdown',
  'Share a diff link or preview link',
  'Save diffs and rename them for later',
  'View and restore your diff history',
];

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
  const [collapseUnchanged, setCollapseUnchanged] = useState(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem(COLLAPSE_STORAGE_KEY) !== 'false';
  });
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [previewOverlay, setPreviewOverlay] = useState(null);
  const [diffHighlight, setDiffHighlight] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [jsonMinified, setJsonMinified] = useState({ original: false, modified: false });
  const formatHintShownRef = useRef(false);

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
    dark: <IconMoon size={16} />,
    light: <IconSun size={16} />,
    pink: <IconHeart size={16} />,
    midnight: <IconMoon size={16} />,
    sand: <IconSun size={16} />,
    slate: <IconPalette size={16} />,
    sky: <IconSun size={16} />,
    monokai: <IconPalette size={16} />,
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

  const replaceModelContent = (model, newText, side) => {
    const editor = getEditor(side);
    const fullRange = model.getFullModelRange();
    editor.executeEdits('diffplease', [{
      range: fullRange,
      text: newText,
    }]);
  };

  const createBeautifyHandler = (side) => async () => {
    if (!diffEditorRef.current) return;
    setIsBeautifying(prev => ({ ...prev, [side]: true }));
    try {
      const model = getEditor(side).getModel();
      const language = model.getLanguageId() === 'jsx' ? 'javascript' : model.getLanguageId();
      const code = model.getValue();
      if (beautifierRef.current.isBeautifiable(language)) {
        const beautified = await beautifierRef.current.beautify(code, language, { indentationSize, useTabs });
        replaceModelContent(model, beautified, side);
        toast.success(`Beautified ${language}`);
        analytics.beautify(language, side);
      } else {
        console.warn(`Beautification not supported for ${language}`);
      }
    } catch (error) {
      console.error('Beautification failed:', error);
      toast.error(error.message || 'Beautification failed');
    } finally {
      setIsBeautifying(prev => ({ ...prev, [side]: false }));
    }
  };

  const createSortHandler = (side) => async () => {
    if (diffEditorRef.current && getLanguage(side) === 'json') {
      try {
        const model = getEditor(side).getModel();
        replaceModelContent(model, beautifierRef.current.sortJson(model.getValue(), { indentationSize }), side);
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
        const original = model.getValue();
        const compacted = beautifierRef.current.compactJson(original);
        if (compacted === original) {
          setJsonMinified(prev => ({ ...prev, [side]: true }));
          toast.success('Already minified');
        } else {
          replaceModelContent(model, compacted, side);
          setJsonMinified(prev => ({ ...prev, [side]: true }));
          toast.success('JSON minified');
        }
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
        replaceModelContent(model, beautifierRef.current.convertJsonToYaml(model.getValue()), side);
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
        replaceModelContent(model, beautifierRef.current.convertYamlToJson(model.getValue()), side);
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

  const handleContainerDragOver = useCallback((e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const side = e.clientX < midpoint ? 'original' : 'modified';
    const other = side === 'original' ? 'modified' : 'original';
    setDragOver(prev => {
      if (prev[side] && !prev[other]) return prev;
      return { [side]: true, [other]: false };
    });
  }, []);

  const handleContainerDragLeave = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX <= rect.left || e.clientX >= rect.right || e.clientY <= rect.top || e.clientY >= rect.bottom) {
      setDragOver({ original: false, modified: false });
    }
  }, []);

  const handleContainerDrop = useCallback((e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const side = e.clientX < midpoint ? 'original' : 'modified';
    setDragOver({ original: false, modified: false });
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileImport(side, file);
  }, [handleFileImport]);

  const handleFileInputChange = useCallback((side) => (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileImport(side, file);
    e.target.value = '';
  }, [handleFileImport]);

  // --- History restore ---

  const handleHistoryRestore = useCallback((original, modified, options = {}) => {
    if (!diffEditorRef.current) return;
    diffEditorRef.current.getOriginalEditor().getModel().setValue(original);
    diffEditorRef.current.getModifiedEditor().getModel().setValue(modified);
    if (options.diffHighlight !== undefined) setDiffHighlight(options.diffHighlight !== false);
    if (options.sideBySide !== undefined) setIsSideBySide(options.sideBySide !== false);
  }, []);

  // --- Share content getter ---

  const getShareContent = useCallback(() => {
    if (!diffEditorRef.current) return { original: '', modified: '', originalLang: null, modifiedLang: null, lineChanges: [], preview: null, diffHighlight: true };
    return {
      original: diffEditorRef.current.getOriginalEditor().getModel().getValue(),
      modified: diffEditorRef.current.getModifiedEditor().getModel().getValue(),
      originalLang: originalLanguage,
      modifiedLang: modifiedLanguage,
      lineChanges: diffEditorRef.current.getLineChanges() || [],
      preview: previewOverlay || null,
      diffHighlight,
      sideBySide: isSideBySide,
    };
  }, [originalLanguage, modifiedLanguage, previewOverlay, diffHighlight, isSideBySide]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(VIEW_STORAGE_KEY, isSideBySide ? 'side-by-side' : 'inline');
  }, [isSideBySide]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(i => (i + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const id = 'diffright-no-highlight';
    if (diffHighlight) {
      document.getElementById(id)?.remove();
    } else {
      if (!document.getElementById(id)) {
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
          .line-insert, .line-delete, .char-insert, .char-delete,
          .diff-range-empty, .inline-deleted-margin-view-zone,
          .gutter-delete, .delete-sign, .insert-sign { background: transparent !important; background-color: transparent !important; }
        `;
        document.head.appendChild(style);
      }
    }
    return () => document.getElementById(id)?.remove();
  }, [diffHighlight]);

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
      fontFamily: "'Fira Code', ui-monospace, SFMono-Regular, SFMono, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      fontLigatures: true,
      fontSize: 13,
      lineHeight: 20,
      wordWrap: 'on',
      renderWhitespace: 'boundary',
      lineNumbers: 'on',
      glyphMargin: false,
      folding: true,
      stickyScroll: { enabled: true },
      diffAlgorithm: 'advanced',
      lineNumbersMinChars: 3,
      originalEditable: true,
      readOnly: false,
      scrollBeyondLastLine: false,
      scrollBeyondLastColumn: 3,
      find: {
        seedSearchStringFromSelection: 'always',
        autoFindInSelection: 'multiline',
        loop: true,
      },
      hideUnchangedRegions: {
        enabled: collapseUnchanged,
        revealLineCount: 20,
        minimumLineCount: 3,
        contextLineCount: 3,
      },
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
      // Restore preview mode from shared link
      const sharedPreview = sessionStorage.getItem('diffright-shared-preview');
      if (sharedPreview) {
        sessionStorage.removeItem('diffright-shared-preview');
        setPreviewOverlay(sharedPreview === 'markdown-full' ? 'markdown' : sharedPreview);
      }
      // Restore diff highlight setting from shared link
      const sharedDiffHighlight = sessionStorage.getItem('diffright-shared-diff-highlight');
      if (sharedDiffHighlight !== null) {
        sessionStorage.removeItem('diffright-shared-diff-highlight');
        setDiffHighlight(sharedDiffHighlight !== 'false');
      }
    }
    diffEditorRef.current.getOriginalEditor().updateOptions({
      padding: { top: 16, bottom: 16 },
      lineNumbersMinChars: 2,
    });
    diffEditorRef.current.getModifiedEditor().updateOptions({
      padding: { top: 16, bottom: 16, right: 20 }
    });
    diffEditorRef.current.updateOptions({
      splitViewDefaultRatio: 0.512
    });
    diffEditorRef.current.layout();

    // Diff editor doesn't propagate folding options to child editors, so set them directly after all other options
    const editorOpts = { folding: true, showFoldingControls: 'always', stickyScroll: { enabled: true } };
    diffEditorRef.current.getOriginalEditor().updateOptions(editorOpts);
    diffEditorRef.current.getModifiedEditor().updateOptions(editorOpts);

    // Register command palette and custom actions
    const registerActions = (editor, side) => {
      editor.addAction({
        id: `diffplease.commandPalette`,
        label: 'Command Palette',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP],
        run: (ed) => ed.trigger('keyboard', 'editor.action.quickCommand', null),
      });
      editor.addAction({
        id: `diffplease.format.${side}`,
        label: `Format Code (${side})`,
        contextMenuGroupId: '1_modification',
        contextMenuOrder: 1,
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyB],
        run: () => createBeautifyHandler(side)(),
      });
      editor.addAction({
        id: `diffplease.sortJson.${side}`,
        label: `Sort JSON Keys (${side})`,
        contextMenuGroupId: '1_modification',
        contextMenuOrder: 2,
        run: () => createSortHandler(side)(),
      });
      editor.addAction({
        id: `diffplease.compactJson.${side}`,
        label: `Minify JSON (${side})`,
        contextMenuGroupId: '1_modification',
        contextMenuOrder: 3,
        run: () => createCompactHandler(side)(),
      });
      editor.addAction({
        id: `diffplease.goToNextDiff.${side}`,
        label: 'Go to Next Change',
        keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.DownArrow],
        run: () => diffEditorRef.current?.goToDiff('next'),
      });
      editor.addAction({
        id: `diffplease.goToPrevDiff.${side}`,
        label: 'Go to Previous Change',
        keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.UpArrow],
        run: () => diffEditorRef.current?.goToDiff('previous'),
      });
    };
    registerActions(diffEditorRef.current.getOriginalEditor(), 'original');
    registerActions(diffEditorRef.current.getModifiedEditor(), 'modified');

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
      setJsonMinified(prev => prev.original ? { ...prev, original: false } : prev);

      if (originalModel.getLanguageId() !== lang) {
        monaco.editor.setModelLanguage(originalModel, lang);
      }

      if (lang !== lastDetectedLangRef.current.original) {
        lastDetectedLangRef.current.original = lang;
        if (lang !== 'plaintext') analytics.languageDetected(lang, 'original');
      }

      if (!formatHintShownRef.current && val.length > 20 && beautifierRef.current.isBeautifiable(lang) && !localStorage.getItem('diffright-format-hint-shown')) {
        formatHintShownRef.current = true;
        localStorage.setItem('diffright-format-hint-shown', '1');
        toast('Tip: Right-click or press Ctrl+Shift+B to format code', { duration: 5000 });
      }

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
      setJsonMinified(prev => prev.modified ? { ...prev, modified: false } : prev);

      if (modifiedModel.getLanguageId() !== lang) {
        monaco.editor.setModelLanguage(modifiedModel, lang);
      }

      if (lang !== lastDetectedLangRef.current.modified) {
        lastDetectedLangRef.current.modified = lang;
        if (lang !== 'plaintext') analytics.languageDetected(lang, 'modified');
      }

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
        splitViewDefaultRatio: 0.512,
        hideUnchangedRegions: {
          enabled: collapseUnchanged,
          revealLineCount: 20,
          minimumLineCount: 3,
          contextLineCount: 3,
        },
      });
      const editorOpts = { folding: true, showFoldingControls: 'always', stickyScroll: { enabled: true } };
      diffEditorRef.current.getOriginalEditor().updateOptions(editorOpts);
      diffEditorRef.current.getModifiedEditor().updateOptions(editorOpts);
      diffEditorRef.current.layout();
    }
  }, [isSideBySide, themeMode, collapseUnchanged]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(COLLAPSE_STORAGE_KEY, collapseUnchanged ? 'true' : 'false');
  }, [collapseUnchanged]);

  // --- Keyboard shortcuts (global, not handled by Monaco) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.shiftKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        setIsSideBySide(prev => {
          const next = !prev;
          analytics.toggleView(next ? 'side-by-side' : 'inline');
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePreviewOverlay = (type) => {
    setPreviewOverlay(prev => prev === type ? null : type);
    setShowMarkdownPreview(false);
  };

  // Dismiss overlay when language changes away from preview type
  useEffect(() => {
    if (previewOverlay && originalLanguage !== previewOverlay) setPreviewOverlay(null);
  }, [originalLanguage, previewOverlay]);

  // Dismiss overlay when switching to unified mode
  useEffect(() => {
    if (!isSideBySide && previewOverlay) setPreviewOverlay(null);
  }, [isSideBySide]);

  const TipButton = ({ tip, children, ...props }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button {...props}>{children}</button>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );

  const btnPill = 'flex items-center justify-center h-8 rounded-full border border-btn-border bg-btn-bg text-btn-text cursor-pointer transition-all duration-200 px-2.5 gap-1.5 text-[0.8rem] font-semibold tracking-wide hover:enabled:bg-btn-hover hover:enabled:-translate-y-px disabled:opacity-70 disabled:cursor-not-allowed backdrop-blur-sm';
  const btnPillAccent = `${btnPill} border-lang-indicator/40 text-lang-indicator`;

  const renderEditorActions = (side, language, isBeautifyingState) => (
    <>
      {isLanguageBeautifiable(language) && (
        <TipButton
          tip={`Auto-format ${language} (Ctrl+Shift+B)`}
          className={btnPill}
          onClick={createBeautifyHandler(side)}
          disabled={isBeautifyingState}
          title={`Format ${language}`}
          aria-busy={isBeautifyingState}
        >
          {isBeautifyingState ? (
            <>
              <IconSparkles size={14} className="animate-spin" />
              <span className="hidden md:inline">Formatting...</span>
            </>
          ) : (
            <>
              <IconSparkles size={14} />
              <span className="hidden md:inline">Format</span>
            </>
          )}
        </TipButton>
      )}
      {language === 'json' && (
        <>
          <TipButton tip="Sort JSON keys alphabetically" className={btnPill} onClick={createSortHandler(side)} title="Sort JSON">
            <IconSortAscending size={14} /> <span className="hidden md:inline">Sort</span>
          </TipButton>
          {!jsonMinified[side] && (
            <TipButton tip="Minify JSON (remove whitespace)" className={btnPill} onClick={createCompactHandler(side)} title="Minify JSON">
              <IconMinimize size={14} /> <span className="hidden md:inline">Minify</span>
            </TipButton>
          )}
          <TipButton tip="Convert JSON to YAML" className={btnPill} onClick={createConvertToYamlHandler(side)} title="Convert JSON to YAML">
            <IconWand size={14} /> <span className="hidden md:inline">→ YAML</span>
          </TipButton>
        </>
      )}
      {language === 'yaml' && (
        <TipButton tip="Convert YAML to JSON" className={btnPill} onClick={createConvertToJsonHandler(side)} title="Convert YAML to JSON">
          <IconWand size={14} /> <span className="hidden md:inline">→ JSON</span>
        </TipButton>
      )}
      {side === 'original' && (language === 'markdown' || language === 'csv') && (
        <TipButton
          tip={language === 'csv' ? 'Preview as table' : 'Preview rendered markdown'}
          className={previewOverlay === language ? btnPillAccent : btnPill}
          onClick={() => handlePreviewOverlay(language)}
        >
          {language === 'csv' ? <IconTable size={14} /> : <IconEye size={14} />}
          <span className="hidden md:inline">Preview</span>
        </TipButton>
      )}
    </>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <Helmet>
        <title>Diff Please - Fast, Privacy-First Code Comparison Tool</title>
        <meta name="description" content="Compare code side-by-side or inline with syntax highlighting. Privacy-first diff tool with beautify, JSON utilities, CSV viewer, Markdown preview, and theme support. No sign-up required." />
        <meta name="keywords" content="code diff, compare code, diff tool, code comparison, syntax highlighting, developer tools, privacy-first, csv viewer, markdown preview, json formatter" />
        <link rel="canonical" href="https://diffplease.com/" />
      </Helmet>
      <div className="flex flex-col h-screen font-[-apple-system,BlinkMacSystemFont,'Segoe_UI','Noto_Sans',Helvetica,Arial,sans-serif]">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center p-2.5 text-dark-text shrink-0 z-10 bg-header-bg border-b border-header-border gap-3">
        <div className="flex items-center justify-self-start overflow-hidden gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={`flex items-center justify-center h-8 rounded-full border cursor-pointer transition-all duration-200 px-2.5 gap-1.5 text-[0.8rem] font-semibold tracking-wide hover:-translate-y-px ${diffHighlight ? 'border-btn-border bg-btn-bg text-btn-text hover:bg-btn-hover' : 'border-btn-border bg-btn-bg text-dark-text-secondary hover:bg-btn-hover opacity-50'}`}
                onClick={() => setDiffHighlight(h => !h)}
                title={diffHighlight ? 'Disable diff' : 'Enable diff'}
                aria-label={diffHighlight ? 'Disable diff' : 'Enable diff'}
              >
                <IconHighlight size={14} />
                <span className="hidden md:inline">Diff</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>{diffHighlight ? 'Disable diff' : 'Enable diff'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex items-center justify-center h-8 rounded-full border border-btn-border bg-btn-bg text-btn-text cursor-pointer transition-all duration-200 px-2.5 gap-1.5 text-[0.8rem] font-semibold tracking-wide hover:bg-btn-hover hover:-translate-y-px"
                onClick={() => {
                  const newMode = !isSideBySide;
                  setIsSideBySide(newMode);
                  analytics.toggleView(newMode ? 'side-by-side' : 'inline');
                }}
                title={isSideBySide ? "Switch to Unified View" : "Switch to Side-by-Side View"}
                aria-label={isSideBySide ? "Switch to Unified View" : "Switch to Side-by-Side View"}
              >
                {isSideBySide ? <IconAlignLeft size={14} /> : <IconColumns size={14} />}
                <span className="hidden md:inline">{isSideBySide ? 'Unified' : 'Split'}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>{isSideBySide ? 'Unified View' : 'Side-by-Side View'} (Ctrl+Shift+V)</TooltipContent>
          </Tooltip>
          <div className="hidden md:flex items-center h-8 rounded-full border border-btn-border bg-btn-bg text-btn-text px-2.5 gap-1.5 text-[0.75rem] font-medium tracking-wide opacity-70 whitespace-nowrap">
            <IconBulb size={14} className="shrink-0 text-tip-icon" />
            <span key={tipIndex} className="animate-tip-fade"><span className="font-semibold">Tip:</span> {TIPS[tipIndex]}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 -ml-8">
          <svg width="40" height="32" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="header-icon w-10 h-8 transition-all duration-300 shrink-0 cursor-pointer hover:scale-[1.08] hover:-rotate-2 hover:drop-shadow-[0_6px_12px_rgba(0,0,0,0.15)]">
            <path d="M14 19L6 12L14 5" stroke="#da3633" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 5L30 12L22 19" stroke="#2ea043" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div><h1 className="m-0 text-lg md:text-2xl font-medium tracking-tighter font-['Fira_Code'] text-dark-text whitespace-nowrap">diff please</h1></div>
        </div>
        <div className="flex items-center shrink-0 justify-self-end">
          {db && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center justify-center h-8 rounded-full border border-btn-border bg-btn-bg text-btn-text cursor-pointer transition-all duration-200 mr-2 px-2.5 gap-1.5 text-[0.8rem] font-semibold tracking-wide hover:bg-btn-hover hover:-translate-y-px"
                  onClick={async () => {
                    if (!diffEditorRef.current) return;
                    const original = diffEditorRef.current.getOriginalEditor().getModel().getValue();
                    const modified = diffEditorRef.current.getModifiedEditor().getModel().getValue();
                    const ok = await saveSnapshotNow(original, modified, 'save', { diffHighlight, sideBySide: isSideBySide });
                    if (ok) {
                      toast.success('Saved');
                    } else {
                      toast.error('Save failed');
                    }
                  }}
                  title="Save"
                  aria-label="Save diff"
                >
                  <IconDeviceFloppy size={14} />
                  <span className="hidden md:inline">Save</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Save to history</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex items-center justify-center h-8 w-auto rounded-full border border-btn-border bg-btn-bg text-btn-text cursor-pointer transition-all duration-200 mr-2 px-2.5 gap-1.5 text-[0.8rem] font-semibold tracking-wide hover:bg-btn-hover hover:-translate-y-px"
                onClick={() => { setShareOpen(true); analytics.shareOpened(); }}
                title="Share"
                aria-label="Share diff"
              >
                <IconShare size={14} />
                <span className="hidden md:inline">{previewOverlay ? 'Share Preview' : 'Share Diff'}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>{previewOverlay ? 'Share preview link' : 'Share diff link'}</TooltipContent>
          </Tooltip>

          {db && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center justify-center h-8 rounded-full border border-btn-border bg-btn-bg text-btn-text cursor-pointer transition-all duration-200 mr-2 px-2.5 gap-1.5 text-[0.8rem] font-semibold tracking-wide hover:bg-btn-hover hover:-translate-y-px"
                  onClick={() => { setHistoryOpen(true); analytics.historyOpened(); }}
                  title="History"
                  aria-label="View history"
                >
                  <IconClock size={16} />
                  <span className="hidden md:inline">History</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>History of saves and shares</TooltipContent>
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
              <span className="hidden md:inline leading-none">{themeLabel}</span>
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
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full border border-dropdown-border bg-dropdown-bg text-dropdown-text transition-all duration-200 cursor-pointer ml-2 hover:bg-dropdown-hover hover:-translate-y-px"
                onClick={() => setFeedbackOpen(true)}
                title="Feedback"
                aria-label="Send feedback"
              >
                <IconMessageCircle size={15} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Send feedback</TooltipContent>
          </Tooltip>
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


      <div className="flex-1 overflow-hidden relative">
        <div
          className={`absolute inset-0 ${showMarkdownPreview ? 'hidden' : ''} ${previewOverlay ? 'preview-active' : ''}`}
          ref={containerRef}
          onDragOver={handleContainerDragOver}
          onDragLeave={handleContainerDragLeave}
          onDrop={handleContainerDrop}
        >
          {/* Empty state placeholders */}
          {originalStats.characters === 0 && modifiedStats.characters === 0 && (
            <>
              <div className="absolute top-0 bottom-0 w-1/2 left-0 z-[3] pointer-events-none flex items-center justify-center">
                <div className="text-center select-none flex flex-col items-center gap-2">
                  <svg width="48" height="48" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-25">
                    <path d="M14 19L6 12L14 5" stroke="#da3633" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-[0.85rem] font-medium text-dark-text-secondary m-0 opacity-55">Paste, type, or drop a file</p>
                  <p className="text-[0.7rem] text-dark-text-secondary m-0 opacity-40">Ctrl+V to paste · or drag a file</p>
                  <p className="text-[0.8rem] font-semibold text-dark-text-secondary m-0 mt-1 opacity-50 uppercase tracking-wide">Original</p>
                </div>
              </div>
              <div className="absolute top-0 bottom-0 w-1/2 right-0 z-[3] pointer-events-none flex items-center justify-center">
                <div className="text-center select-none flex flex-col items-center gap-2">
                  <svg width="48" height="48" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-25">
                    <path d="M22 5L30 12L22 19" stroke="#2ea043" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-[0.85rem] font-medium text-dark-text-secondary m-0 opacity-55">Paste, type, or drop a file</p>
                  <p className="text-[0.7rem] text-dark-text-secondary m-0 opacity-40">Ctrl+V to paste · or drag a file</p>
                  <p className="text-[0.8rem] font-semibold text-dark-text-secondary m-0 mt-1 opacity-50 uppercase tracking-wide">Modified</p>
                </div>
              </div>
            </>
          )}

          {/* Drop zone visual overlays */}
          {(dragOver.original || dragOver.modified) && (
            <>
              <div className={`absolute top-0 bottom-0 w-1/2 left-0 z-[5] pointer-events-none ${dragOver.original ? 'bg-[rgba(46,160,67,0.08)] border-2 border-dashed border-[rgba(46,160,67,0.5)] rounded' : ''}`}>
                {dragOver.original && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 py-3 px-6 bg-[rgba(46,160,67,0.15)] border border-[rgba(46,160,67,0.4)] rounded-lg text-page-text text-[0.9rem] font-semibold">
                    Drop file here (Original)
                  </div>
                )}
              </div>
              <div className={`absolute top-0 bottom-0 w-1/2 right-0 z-[5] pointer-events-none ${dragOver.modified ? 'bg-[rgba(46,160,67,0.08)] border-2 border-dashed border-[rgba(46,160,67,0.5)] rounded' : ''}`}>
                {dragOver.modified && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 py-3 px-6 bg-[rgba(46,160,67,0.15)] border border-[rgba(46,160,67,0.4)] rounded-lg text-page-text text-[0.9rem] font-semibold">
                    Drop file here (Modified)
                  </div>
                )}
              </div>
            </>
          )}

          {/* Floating action buttons at bottom of each pane */}
          {isSideBySide ? (
            <>
              <div className="absolute bottom-3 left-0 w-1/2 z-[4] flex items-center justify-center gap-1.5">
                {renderEditorActions('original', originalLanguage, isBeautifying.original)}
              </div>
              <div className="absolute bottom-3 right-0 w-1/2 z-[4] flex items-center justify-center gap-1.5">
                {renderEditorActions('modified', modifiedLanguage, isBeautifying.modified)}
              </div>
            </>
          ) : (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[4] flex items-center gap-1.5">
              {renderEditorActions('modified', modifiedLanguage, isBeautifying.modified)}
            </div>
          )}

          {previewOverlay && (
            <PreviewOverlay
              type={previewOverlay}
              content={diffEditorRef.current?.getOriginalEditor().getModel().getValue() || ''}
              onClose={() => setPreviewOverlay(null)}
            />
          )}
        </div>

        {showMarkdownPreview && (
          <MarkdownDiffPreview
            original={diffEditorRef.current?.getOriginalEditor().getModel().getValue() || ''}
            modified={diffEditorRef.current?.getModifiedEditor().getModel().getValue() || ''}
          />
        )}
      </div>

      <div className="py-1.5 px-4 bg-footer-bg relative z-10 border-t border-footer-border">
        <div className="grid grid-cols-[1fr_auto_1fr] w-full items-center gap-3">
          {/* Left side — original stats + open */}
          <div className="flex items-center gap-2.5 justify-self-start overflow-x-auto min-w-0 scrollbar-none">
            <TipButton
              tip="Open file (original)"
              className={`${btnBase} text-[0.6rem]`}
              onClick={() => { originalFileRef.current?.click(); analytics.fileOpened('original'); }}
              title="Open file"
            >
              <IconUpload size={14} /> <span className="hidden md:inline">Open</span>
            </TipButton>
            <input
              ref={originalFileRef}
              type="file"
              className="hidden"
              onChange={handleFileInputChange('original')}
              accept=".js,.jsx,.ts,.tsx,.json,.html,.css,.scss,.less,.md,.yaml,.yml,.xml,.py,.java,.c,.cpp,.go,.rs,.rb,.sql,.txt,.sh,.php,.swift,.kt"
            />
            <div className="flex items-center gap-1.5 text-[0.75rem] text-dark-text-secondary tabular-nums" aria-live="polite" role="status">
              <span>{originalStats.lines} <span className="opacity-60">lines</span></span>
              <span className="opacity-30 hidden md:inline">·</span>
              <span className="hidden md:inline">{originalStats.words} <span className="opacity-60">words</span></span>
              <span className="opacity-30 hidden md:inline">·</span>
              <span className="hidden md:inline">{originalStats.characters} <span className="opacity-60">chars</span></span>
            </div>
            {originalLanguage !== 'plaintext' && (
              <>
                <span className="opacity-20 text-dark-text-secondary">|</span>
                <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-lang-indicator/90 bg-lang-indicator/10 px-1.5 py-0.5 rounded">{originalLanguage}</span>
              </>
            )}
          </div>

          {/* Center — diff nav + stats badge */}
          <div className="flex justify-center items-center shrink-0 -ml-8 gap-1.5">
            {(diffStats.additions > 0 || diffStats.deletions > 0) && (
              <>
                <TipButton
                  tip="Previous change (Alt+Up)"
                  className="flex items-center justify-center w-6 h-6 rounded border border-dark-border bg-transparent text-dark-text-secondary cursor-pointer transition-all hover:bg-btn-hover hover:text-dark-text"
                  onClick={() => diffEditorRef.current?.goToDiff('previous')}
                >
                  <IconChevronUp size={14} />
                </TipButton>
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
                <TipButton
                  tip="Next change (Alt+Down)"
                  className="flex items-center justify-center w-6 h-6 rounded border border-dark-border bg-transparent text-dark-text-secondary cursor-pointer transition-all hover:bg-btn-hover hover:text-dark-text"
                  onClick={() => diffEditorRef.current?.goToDiff('next')}
                >
                  <IconChevronDown size={14} />
                </TipButton>
              </>
            )}
          </div>

          {/* Right side — modified stats + open */}
          <div className="flex items-center gap-2.5 justify-self-end overflow-x-auto min-w-0 scrollbar-none">
            {modifiedLanguage !== 'plaintext' && (
              <>
                <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-lang-indicator/90 bg-lang-indicator/10 px-1.5 py-0.5 rounded">{modifiedLanguage}</span>
                <span className="opacity-20 text-dark-text-secondary">|</span>
              </>
            )}
            <div className="flex items-center gap-1.5 text-[0.75rem] text-dark-text-secondary tabular-nums" aria-live="polite" role="status">
              <span>{modifiedStats.lines} <span className="opacity-60">lines</span></span>
              <span className="opacity-30 hidden md:inline">·</span>
              <span className="hidden md:inline">{modifiedStats.words} <span className="opacity-60">words</span></span>
              <span className="opacity-30 hidden md:inline">·</span>
              <span className="hidden md:inline">{modifiedStats.characters} <span className="opacity-60">chars</span></span>
            </div>
            <TipButton
              tip="Open file (modified)"
              className={`${btnBase} text-[0.6rem]`}
              onClick={() => { modifiedFileRef.current?.click(); analytics.fileOpened('modified'); }}
              title="Open file"
            >
              <IconUpload size={14} /> <span className="hidden md:inline">Open</span>
            </TipButton>
            <input
              ref={modifiedFileRef}
              type="file"
              className="hidden"
              onChange={handleFileInputChange('modified')}
              accept=".js,.jsx,.ts,.tsx,.json,.html,.css,.scss,.less,.md,.yaml,.yml,.xml,.py,.java,.c,.cpp,.go,.rs,.rb,.sql,.txt,.sh,.php,.swift,.kt"
            />
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

    <FeedbackModal
      isOpen={feedbackOpen}
      onClose={() => setFeedbackOpen(false)}
    />

    <Toaster
      position="bottom-center"
      toastOptions={{
        style: {
          background: 'var(--button-bg)',
          color: 'var(--page-text-color)',
          border: '1px solid var(--button-border)',
          borderRadius: '9999px',
          fontSize: '0.8rem',
          fontWeight: 500,
          padding: '8px 16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          gap: '8px',
          opacity: 1,
        },
      }}
    />
    </TooltipProvider>
  );
}
