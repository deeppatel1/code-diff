import React, { useEffect, useRef, useState } from 'react';
import { Code, Columns, AlignLeft, Sparkles, Wand, SortAsc, Minimize, Sun, Moon, Palette, Heart, ChevronDown } from 'lucide-react';
import * as monaco from 'monaco-editor';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
import './App.css';
import { CodeBeautifier, calculateStats, detectLanguage } from './lib/codeUtils';


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
    // 'diffEditor.removedLineBackground': '#2d1618',
    'diffEditorGutter.removedLineBackground': '#3a1e22',
    'diffEditor.removedTextBackground': '#da363355',
    // 'diffEditor.insertedLineBackground': '#102820',
    'diffEditorGutter.insertedLineBackground': '#15372a',
    'diffEditor.insertedTextBackground': '#2ea04340',
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
    // 'diffEditor.removedLineBackground': '#ffebe9',
    'diffEditorGutter.removedLineBackground': '#ffdce0',
    'diffEditor.removedTextBackground': '#ff818240',
    // 'diffEditor.insertedLineBackground': '#dafbe1',
    'diffEditorGutter.insertedLineBackground': '#aceebb',
    'diffEditor.insertedTextBackground': '#2ea04329',
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
    // 'diffEditor.removedLineBackground': '#3B264F80',
    'diffEditorGutter.removedLineBackground': '#4B2F6B80',
    'diffEditor.removedTextBackground': '#FF6B8B77',
    // 'diffEditor.insertedLineBackground': '#142F4B80',
    'diffEditorGutter.insertedLineBackground': '#1C3D6180',
    'diffEditor.insertedTextBackground': '#7DF9FF77',
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
    'diffEditor.removedTextBackground': '#ffb3ce80',
    'diffEditorGutter.insertedLineBackground': '#e8ffe880',
    'diffEditor.insertedTextBackground': '#c0f5c080',
    'diffEditor.border': '#f3aacd'
  }
});

const THEME_STORAGE_KEY = 'diffright-theme-mode';

const MONACO_THEME_BY_MODE = {
  dark: 'airbnb-dark-diff',
  light: 'airbnb-light-diff',
  synthwave: 'airbnb-synthwave-diff',
  pink: 'airbnb-cute-diff'
};
monaco.editor.setTheme(MONACO_THEME_BY_MODE.dark);

export default function App() {
  const containerRef = useRef(null);
  const diffEditorRef = useRef(null);
  const beautifierRef = useRef(new CodeBeautifier());


  const [originalLanguage, setOriginalLanguage] = useState('plaintext');
  const [modifiedLanguage, setModifiedLanguage] = useState('plaintext');
  const [originalStats, setOriginalStats] = useState({ lines: 0, characters: 0, words: 0 });
  const [modifiedStats, setModifiedStats] = useState({ lines: 0, characters: 0, words: 0 });
  const [isSideBySide, setIsSideBySide] = useState(true);
  const [isBeautifying, setIsBeautifying] = useState({ original: false, modified: false });
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem(THEME_STORAGE_KEY) ?? 'light';
  });
  const [indentationSize] = useState(4);
  const [useTabs] = useState(false);
  const themeSequence = ['dark', 'light', 'synthwave', 'pink'];
  const themeLabels = {
    dark: 'Dark',
    light: 'Light',
    synthwave: 'Purple',
    pink: 'Pink'
  };
  const themeIcons = {
    dark: <Moon size={16} />,
    light: <Sun size={16} />,
    synthwave: <Palette size={16} />,
    pink: <Heart size={16} />
  };
  const getNextTheme = current => {
    const idx = themeSequence.indexOf(current);
    const nextIndex = idx >= 0 ? (idx + 1) % themeSequence.length : 0;
    return themeSequence[nextIndex];
  };
  const nextTheme = getNextTheme(themeMode);
  const themeIcon = themeIcons[themeMode] ?? themeIcons.dark;
  const themeLabel = themeLabels[themeMode] ?? themeLabels.dark;
  const nextThemeLabel = themeLabels[nextTheme] ?? nextTheme;
  // Enhanced beautification handlers
  const handleBeautifyOriginal = async () => {
    if (!diffEditorRef.current) return;

    setIsBeautifying(prev => ({ ...prev, original: true }));

    try {
      const model = diffEditorRef.current.getOriginalEditor().getModel();
      // if Monaco ever reports 'jsx', force it back to 'javascript'
      const language = model.getLanguageId() === 'jsx'
        ? 'javascript'
        : model.getLanguageId();

      const code = model.getValue();

      if (beautifierRef.current.isBeautifiable(language)) {
        const beautified = await beautifierRef.current.beautify(code, language, { indentationSize, useTabs });
        model.setValue(beautified);
      } else {
        console.warn(`Beautification not supported for ${language}`);
      }
    } catch (error) {
      console.error('Beautification failed:', error);
      // You could show a toast notification here
    } finally {
      setIsBeautifying(prev => ({ ...prev, original: false }));
    }
  };

  const handleBeautifyModified = async () => {
    if (!diffEditorRef.current) return;

    setIsBeautifying(prev => ({ ...prev, modified: true }));

    try {
      const model = diffEditorRef.current.getModifiedEditor().getModel();
      const language = model.getLanguageId() === 'jsx' ? 'javascript' : model.getLanguageId();

      const code = model.getValue();

      if (beautifierRef.current.isBeautifiable(language)) {
        const beautified = await beautifierRef.current.beautify(code, language, { indentationSize, useTabs });
        model.setValue(beautified);
      } else {
        console.warn(`Beautification not supported for ${language}`);
      }
    } catch (error) {
      console.error('Beautification failed:', error);
    } finally {
      setIsBeautifying(prev => ({ ...prev, modified: false }));
    }
  };

  // JSON utility handlers
  const handleSortOriginal = async () => {
    if (diffEditorRef.current && originalLanguage === 'json') {
      try {
        const model = diffEditorRef.current.getOriginalEditor().getModel();
        const sorted = beautifierRef.current.sortJson(model.getValue(), { indentationSize });
        model.setValue(sorted);
      } catch (error) {
        console.error('JSON sorting failed:', error);
      }
    }
  };

  const handleCompactOriginal = async () => {
    if (diffEditorRef.current && originalLanguage === 'json') {
      try {
        const model = diffEditorRef.current.getOriginalEditor().getModel();
        const compacted = beautifierRef.current.compactJson(model.getValue());
        model.setValue(compacted);
      } catch (error) {
        console.error('JSON compacting failed:', error);
      }
    }
  };

  // Conversion handlers
  const handleConvertOriginalToYaml = async () => {
    if (diffEditorRef.current && originalLanguage === 'json') {
      try {
        const model = diffEditorRef.current.getOriginalEditor().getModel();
        const yamlContent = beautifierRef.current.convertJsonToYaml(model.getValue());
        model.setValue(yamlContent);
        monaco.editor.setModelLanguage(model, 'yaml'); // Change language to YAML
      } catch (error) {
        console.error('JSON to YAML conversion failed:', error);
      }
    }
  };

  const handleConvertOriginalToJson = async () => {
    if (diffEditorRef.current && originalLanguage === 'yaml') {
      try {
        const model = diffEditorRef.current.getOriginalEditor().getModel();
        const jsonContent = beautifierRef.current.convertYamlToJson(model.getValue());
        model.setValue(jsonContent);
        monaco.editor.setModelLanguage(model, 'json'); // Change language to JSON
      } catch (error) {
        console.error('YAML to JSON conversion failed:', error);
      }
    }
  };


  const handleSortModified = async () => {
    if (diffEditorRef.current && modifiedLanguage === 'json') {
      try {
        const model = diffEditorRef.current.getModifiedEditor().getModel();
        const sorted = beautifierRef.current.sortJson(model.getValue(), { indentationSize });
        model.setValue(sorted);
      } catch (error) {
        console.error('JSON sorting failed:', error);
      }
    }
  };

  const handleCompactModified = async () => {
    if (diffEditorRef.current && modifiedLanguage === 'json') {
      try {
        const model = diffEditorRef.current.getModifiedEditor().getModel();
        const compacted = beautifierRef.current.compactJson(model.getValue());
        model.setValue(compacted);
      } catch (error) {
        console.error('JSON compacting failed:', error);
      }
    }
  };

  const handleConvertModifiedToYaml = async () => {
    if (diffEditorRef.current && modifiedLanguage === 'json') {
      try {
        const model = diffEditorRef.current.getModifiedEditor().getModel();
        const yamlContent = beautifierRef.current.convertJsonToYaml(model.getValue());
        model.setValue(yamlContent);
        monaco.editor.setModelLanguage(model, 'yaml'); // Change language to YAML
      } catch (error) {
        console.error('JSON to YAML conversion failed:', error);
      }
    }
  };

  const handleConvertModifiedToJson = async () => {
    if (diffEditorRef.current && modifiedLanguage === 'yaml') {
      try {
        const model = diffEditorRef.current.getModifiedEditor().getModel();
        const jsonContent = beautifierRef.current.convertYamlToJson(model.getValue());
        model.setValue(jsonContent);
        monaco.editor.setModelLanguage(model, 'json'); // Change language to JSON
      } catch (error) {
        console.error('YAML to JSON conversion failed:', error);
      }
    }
  };

  // Check if a language is beautifiable
  const isLanguageBeautifiable = (language) => {
    return beautifierRef.current.isBeautifiable(language);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    const rootElement = document.documentElement;
    const themeClass = `theme-${themeMode}`;
    rootElement.classList.remove('theme-dark', 'theme-light', 'theme-synthwave', 'theme-pink');
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
    // Add breathing room above/below the first and last lines in both panes
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

      setOriginalStats(stats);
      setOriginalLanguage(lang);

      if (originalModel.getLanguageId() !== lang) {
        monaco.editor.setModelLanguage(originalModel, lang);
      }
    };

    const updateModified = () => {
      const val = modifiedModel.getValue();
      const stats = calculateStats(val);
      const lang = detectLanguage(val);

      setModifiedStats(stats);
      setModifiedLanguage(lang);

      if (modifiedModel.getLanguageId() !== lang) {
        monaco.editor.setModelLanguage(modifiedModel, lang);
      }
    };

    originalModel.onDidChangeContent(updateOriginal);
    modifiedModel.onDidChangeContent(updateModified);
    updateOriginal();
    updateModified();

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

          <div className="theme-dropdown">
            <select
              className="theme-dropdown-select"
              value={themeMode}
              onChange={(e) => setThemeMode(e.target.value)}
              title="Select Theme"
            >
              {themeSequence.map(theme => (
                <option key={theme} value={theme}>
                  {themeLabels[theme]}
                </option>
              ))}
            </select>
            <span className="theme-dropdown-icon">{themeIcon}</span>
            <span className="theme-dropdown-label">{themeLabel}</span>
            <ChevronDown size={14} className="theme-dropdown-arrow" />
          </div>
        </div>
      </div>

      <div className="editor-container" ref={containerRef} />
      <div className="app-footer">
        <div className="footer-stats">
          <div className="stats-display">
            <div className="metric-group">
              <span className="metric">{originalStats.lines} lines</span>
              <span className="metric">{originalStats.words} words</span>
              <span className="metric">{originalStats.characters} chars</span>
            </div>
            {originalLanguage !== 'plaintext' && (
              <span className="language-indicator">{originalLanguage}</span>
            )}
            {isLanguageBeautifiable(originalLanguage) && (
              <button
                className="beautify-btn"
                onClick={handleBeautifyOriginal}
                title={`Beautify ${originalLanguage}`}
              >
                <Sparkles size={12} />
                Beautify
              </button>
            )}
            {originalLanguage === 'json' && (
              <>
                <button
                  className="beautify-btn"
                  onClick={handleSortOriginal}
                  title="Sort JSON"
                >
                  <SortAsc size={12} /> Sort
                </button>
                <button
                  className="beautify-btn"
                  onClick={handleCompactOriginal}
                  title="Minify JSON"
                >
                  <Minimize size={12} /> Minify
                </button>
                <button
                  className="beautify-btn convert-btn"
                  onClick={handleConvertOriginalToYaml}
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
                  onClick={handleConvertOriginalToJson}
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
              onClick={() => setIsSideBySide(!isSideBySide)}
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
              {isLanguageBeautifiable(modifiedLanguage) && (
                <button
                  className={`beautify-btn ${isBeautifying.modified ? 'beautifying' : ''}`}
                  onClick={handleBeautifyModified}
                  disabled={isBeautifying.modified}
                  title={`Beautify ${modifiedLanguage}`}
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
                    onClick={handleSortModified}
                    title="Sort JSON"
                  >
                    <SortAsc size={12} /> Sort
                  </button>
                  <button
                    className="beautify-btn"
                    onClick={handleCompactModified}
                    title="Minify JSON"
                  >
                    <Minimize size={12} /> Minify
                  </button>
                  <button
                    className="beautify-btn convert-btn"
                    onClick={handleConvertModifiedToYaml}
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
                    onClick={handleConvertModifiedToJson}
                    title="Convert YAML to JSON"
                  >
                    <Wand size={12} /> YAML to JSON
                  </button>
                </>
              )}
            </div>
            <div className="metric-group align-right">
              <span className="metric">{modifiedStats.lines} lines</span>
              <span className="metric">{modifiedStats.words} words</span>
              <span className="metric">{modifiedStats.characters} chars</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
