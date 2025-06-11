import React, { useEffect, useRef, useState } from 'react';
import { Copy, Moon, Sun, RefreshCw, Trash2, Code, ArrowUpDown, Wand2, ArrowUpAZ } from 'lucide-react';
import * as monaco from 'monaco-editor';
import './App.css';

export default function App() {
  const containerRef = useRef(null);
  const diffEditorRef = useRef(null);
  const [originalLanguage, setOriginalLanguage] = useState('plaintext');
  const [modifiedLanguage, setModifiedLanguage] = useState('plaintext');
  const [originalStats, setOriginalStats] = useState({ lines: 0, characters: 0 });
  const [modifiedStats, setModifiedStats] = useState({ lines: 0, characters: 0 });
  const diffMode = 'classic';

  const calculateStats = (content) => {
    const lines = content ? content.split('\n').length : 0;
    const characters = content ? content.length : 0;
    return { lines, characters };
  };

  const detectLanguage = (code) => {
    const t = code.trim();
    if (!t) return 'plaintext';
    if (t.startsWith('#!')) return 'bash';
    if (/^\s*import\s.+from/.test(t)) return 'javascript';
    if (t.startsWith('<') && t.endsWith('>')) return 'html';
    try { JSON.parse(code); return 'json'; } catch {};
    if (/^def\s+\w+\(/.test(t) || (t.includes('import ') && t.includes(':'))) return 'python';
    if (/^\s*#include/.test(t) || /int\s+main\s*\(/.test(t)) return 'c';
    if (/^\s*package\s+\w+/.test(t) || /public\s+class/.test(t)) return 'java';
    if (/^\s*using\s+System/.test(t) || /namespace\s+\w+/.test(t)) return 'csharp';
    if (/^\s*SELECT\s+/.test(t.toUpperCase()) || /^\s*CREATE\s+/.test(t.toUpperCase())) return 'sql';
    return 'plaintext';
  };

  useEffect(() => {
    if (containerRef.current && !diffEditorRef.current) {
      diffEditorRef.current = monaco.editor.createDiffEditor(containerRef.current, {
        theme: 'vs-dark',
        automaticLayout: true,
        originalEditable: true,
        selectOnLineNumbers: true,
        readOnly: false,
        renderSideBySide: diffMode !== 'split',
        useInlineViewWhenSpaceIsLimited: diffMode !== 'split',
        fontFamily: 'Monaco, Menlo, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 20,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        renderWhitespace: 'boundary',
        lineNumbers: 'on',
        glyphMargin: false,
        folding: false,
        diffAlgorithm: 'legacy',
        colors: {
          'editor.background': '#1e1e1e',
          'editor.foreground': '#f8f8f2'
        }
      });

      const originalModel = monaco.editor.createModel('', originalLanguage);
      const modifiedModel = monaco.editor.createModel('', modifiedLanguage);
      diffEditorRef.current.setModel({ original: originalModel, modified: modifiedModel });

      const updateOriginal = () => {
        const code = originalModel.getValue();
        const newLang = detectLanguage(code);
        const stats = calculateStats(code);
        if (newLang !== originalLanguage) {
          setOriginalLanguage(newLang);
          monaco.editor.setModelLanguage(originalModel, newLang);
        }
        setOriginalStats(stats);
      };

      const updateModified = () => {
        const code = modifiedModel.getValue();
        const newLang = detectLanguage(code);
        const stats = calculateStats(code);
        if (newLang !== modifiedLanguage) {
          setModifiedLanguage(newLang);
          monaco.editor.setModelLanguage(modifiedModel, newLang);
        }
        setModifiedStats(stats);
      };

      originalModel.onDidChangeContent(updateOriginal);
      modifiedModel.onDidChangeContent(updateModified);
      setOriginalStats(calculateStats(''));
      setModifiedStats(calculateStats(''));
    }
  }, [originalLanguage, modifiedLanguage]);

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
          <div className="stats-display">{originalStats.lines} lines, {originalStats.characters} characters</div>
          <div className="stats-display">{modifiedStats.lines} lines, {modifiedStats.characters} characters</div>
        </div>
      </div>
    </div>
  );
}