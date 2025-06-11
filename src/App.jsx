import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import './App.css';

export default function App() {
  const containerRef = useRef(null);
  const diffEditorRef = useRef(null);
  const [language, setLanguage] = useState('plaintext');

  // Simple language detection based on content heuristics
  const detectLanguage = (code) => {
    const t = code.trim();
    if (!t) return 'plaintext';
    if (t.startsWith('#!')) return 'bash';
    if (/^\s*import\s.+from/.test(t)) return 'javascript';
    if (t.startsWith('<') && t.endsWith('>')) return 'html';
    try { JSON.parse(code); return 'json'; } catch {};
    if (/^def\s+\w+\(/.test(t) || t.includes('import ') && t.includes(':')) return 'python';
    return 'plaintext';
  };

  useEffect(() => {
    if (containerRef.current && !diffEditorRef.current) {
      // Create diff editor with both sides editable
      diffEditorRef.current = monaco.editor.createDiffEditor(containerRef.current, {
        theme: 'vs-dark',
        automaticLayout: true,
        originalEditable: true,
        readOnly: false,
        renderSideBySide: true,
        fontSize: 14,
        lineHeight: 20,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        renderWhitespace: 'boundary'
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
  }, [language, detectLanguage]);

  return <div className="app" ref={containerRef} />;
}