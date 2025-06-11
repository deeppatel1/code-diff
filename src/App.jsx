import React, { useEffect, useRef, useState } from 'react';
import { Copy, Moon, Sun, RefreshCw, Trash2, Code, ArrowUpDown, Wand2, ArrowUpAZ } from 'lucide-react';
import * as monaco from 'monaco-editor';
import './App.css';

export default function App() {
  const containerRef = useRef(null);
  const diffEditorRef = useRef(null);
  const [language, setLanguage] = useState('plaintext');
  
  // Diff mode: 'split' for side-by-side, 'classic' for inline unified
  const diffMode = 'classic';
  
  // Simple language detection based on content heuristics
  const detectLanguage = (code) => {
    const t = code.trim();
    if (!t) return 'plaintext';
    if (t.startsWith('#!')) return 'bash';
    if (/^\s*import\s.+from/.test(t)) return 'javascript';
    if (t.startsWith('<') && t.endsWith('>')) return 'html';
    try { JSON.parse(code); return 'json'; } catch {};
    if (/^def\s+\w+\(/.test(t) || (t.includes('import ') && t.includes(':'))) return 'python';
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
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        renderWhitespace: 'boundary',
        lineNumbers: 'on',
        glyphMargin: false,
        folding: false,
        // Undocumented see https://github.com/Microsoft/vscode/issues/30795#issuecomment-410998882
        // lineDecorationsWidth: '5px',
        // lineNumbersMinChars: '5px',
        diffAlgorithm: "legacy",
        colors: {
          // Customize editor colors
          'editor.background': '#1e1e1e',
          'editor.foreground': '#f8f8f2'
        }
      });

      // Initialize models for original and modified panes
      const originalModel = monaco.editor.createModel('', language);
      const modifiedModel = monaco.editor.createModel('', language);
      diffEditorRef.current.setModel({ original: originalModel, modified: modifiedModel });

      // Update language dynamically when content changes
      const updateLang = () => {
        const code = originalModel.getValue();
        const newLang = detectLanguage(code);
        setLanguage(newLang);
        monaco.editor.setModelLanguage(originalModel, newLang);
        monaco.editor.setModelLanguage(modifiedModel, newLang);
      };

      originalModel.onDidChangeContent(updateLang);
      modifiedModel.onDidChangeContent(updateLang);
    }
  }, [language]);

  return (
    <div className="app">
      <div className="app-header">
          <div className="header-left">
            <Code className="header-icon" />
            <div className="header-text"><h1>Code Diff</h1></div>
          </div>
      </div>
      <div className="editor-container" ref={containerRef} />
    </div>
  );
}