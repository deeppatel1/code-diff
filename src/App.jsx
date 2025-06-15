// App.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Code } from 'lucide-react';
import * as monaco from 'monaco-editor';
import './App.css';

// 1) Define & apply your custom diff theme
monaco.editor.defineTheme('airbnb-dark-diff', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#181A1B',
    'editor.foreground': '#c5c5c5',
    'diffEditor.removedLineBackground': '#2d1b1b',
    'diffEditorGutter.removedLineBackground': '#3d1f1f',
    'diffEditor.removedTextBackground': '#4d2424',
    'diffEditor.insertedLineBackground': '#1b2d1f',
    'diffEditorGutter.insertedLineBackground': '#1f3d23',
    'diffEditor.insertedTextBackground': '#2d5a35',
    'diffEditor.border': '#3C3C3C',
  }
});
monaco.editor.setTheme('airbnb-dark-diff');

export default function App() {
  const containerRef = useRef(null);
  const diffEditorRef = useRef(null);

  const [originalLanguage, setOriginalLanguage] = useState('plaintext');
  const [modifiedLanguage, setModifiedLanguage] = useState('plaintext');
  const [originalStats, setOriginalStats] = useState({ lines: 0, characters: 0 });
  const [modifiedStats, setModifiedStats] = useState({ lines: 0, characters: 0 });

  // helpers
  const calculateStats = code => ({
    lines: code ? code.split('\n').length : 0,
    characters: code ? code.length : 0
  });
  const detectLanguage = code => {
    const t = code.trim();
    if (!t) return 'plaintext';
    if (t.startsWith('#!')) return 'bash';
    if (/^\s*import\s.+from/.test(t)) return 'javascript';
    if (t.startsWith('<') && t.endsWith('>')) return 'html';
    try { JSON.parse(code); return 'json'; } catch {}
    if (/^def\s+\w+\(/.test(t) || (t.includes('import ') && t.includes(':'))) return 'python';
    if (/^\s*#include/.test(t) || /int\s+main\s*\(/.test(t)) return 'c';
    if (/^\s*package\s+\w+/.test(t) || /public\s+class/.test(t)) return 'java';
    if (/^\s*using\s+System/.test(t) || /namespace\s+\w+/.test(t)) return 'csharp';
    if (/^\s*SELECT\s+/.test(t.toUpperCase()) || /^\s*CREATE\s+/.test(t.toUpperCase())) return 'sql';
    return 'plaintext';
  };

  useEffect(() => {
    if (!containerRef.current || diffEditorRef.current) return;

    // 2) Inject a failproof <style> at the end of <head>
    const style = document.createElement('style');
    style.textContent = `
      /* hide everything sash-related */
      .monaco-editor .sash,
      .monaco-sash,
      .sash,
      .monaco-split-view2 .sash,
      .sash-horizontal,
      .sash-vertical,
      [class*="sash"] {
        display: none !important;
        visibility: hidden !important;
        width: 0 !important;
        height: 0 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);

    // 3) Create the Monaco diff editor
    diffEditorRef.current = monaco.editor.createDiffEditor(containerRef.current, {
      theme: 'airbnb-dark-diff',
      automaticLayout: true,
      renderSideBySide: true,
      enableSplitViewResizing: false,   // disables drag‐to‐resize
      useInlineViewWhenSpaceIsLimited: false,
      minimap: { enabled: true },
      fontFamily: 'Monaco, Menlo, "Courier New", monospace',
      fontSize: 14,
      lineHeight: 20,
      scrollBeyondLastLine: true,
      wordWrap: 'on',
      renderWhitespace: 'boundary',
      lineNumbers: 'on',
      glyphMargin: false,
      folding: false,
      diffAlgorithm: 'legacy',
      overviewRulerLanes: 2,
      lineNumbersMinChars: 3,
      originalEditable: true,    
      readOnly:      false,       // ← ensure modified side remains editable
    });

    const originalModel = monaco.editor.createModel('', originalLanguage);
    const modifiedModel = monaco.editor.createModel('', modifiedLanguage);
    diffEditorRef.current.setModel({ original: originalModel, modified: modifiedModel });

    // 4) Wire up language & stats updates
    const updateOriginal = () => {
      const val = originalModel.getValue();
      const stats = calculateStats(val);
      const lang = detectLanguage(val);
      if (lang !== originalLanguage) {
        setOriginalLanguage(lang);
        monaco.editor.setModelLanguage(originalModel, lang);
      }
      setOriginalStats(stats);
    };
    const updateModified = () => {
      const val = modifiedModel.getValue();
      const stats = calculateStats(val);
      const lang = detectLanguage(val);
      if (lang !== modifiedLanguage) {
        setModifiedLanguage(lang);
        monaco.editor.setModelLanguage(modifiedModel, lang);
      }
      setModifiedStats(stats);
    };
    originalModel.onDidChangeContent(updateOriginal);
    modifiedModel.onDidChangeContent(updateModified);
    setOriginalStats(calculateStats(''));
    setModifiedStats(calculateStats(''));

    // 5) Purge any sash nodes
    const purge = () => {
      document.querySelectorAll('[class*="sash"]').forEach(el => el.remove());
    };
    purge(); // initial
    const observer = new MutationObserver(purge);
    observer.observe(containerRef.current, { childList: true, subtree: true });

    // fallback periodic purge
    const interval = setInterval(purge, 200);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [originalLanguage, modifiedLanguage]);

  // also do a final purge whenever stats change
  useEffect(() => {
    document.querySelectorAll('[class*="sash"]').forEach(el => el.remove());
  }, [originalStats, modifiedStats]);

  return (
    <div className="app">
      <div className="app-header">
        <div className="header-left">
          <Code className="header-icon" />
          <div className="header-text"><h1>Code Diff</h1></div>
        </div>
      </div>
      <div className="editor-container" ref={containerRef} />
      <div className="app-footer">
        <div className="footer-stats">
          <div className="stats-display">
            {originalStats.lines} lines, {originalStats.characters} characters
          </div>
          <div className="stats-display">
            {modifiedStats.lines} lines, {modifiedStats.characters} characters
          </div>
        </div>
      </div>
    </div>
  );
}