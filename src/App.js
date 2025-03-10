import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from "@codemirror/view";
import DiffViewer, { DiffMethod } from 'react-diff-viewer';
import JSONFormatter from 'json-formatter-js';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism.css';
import './App.css';

function App() {
  const [originalText, setOriginalText] = useState('');
  const [modifiedText, setModifiedText] = useState('');
  const [originalLanguage, setOriginalLanguage] = useState('text');

  // Auto-detect language based on the content of the original text
  const detectLanguage = (text) => {
    if (!text.trim()) return 'text';

    try {
      JSON.parse(text);
      return 'json';
    } catch (e) {
      // Not JSON, continue detection
    }

    if (text.includes('def ') || text.includes('import ') || text.includes('class ') || /:\s*\n\s+/.test(text)) {
      return 'python';
    }

    if (text.includes('<html>') || text.includes('<!DOCTYPE html>') ||
        (text.includes('<') && text.includes('</') && text.includes('>'))) {
      return 'html';
    }

    if (text.includes('{') && text.includes('}') &&
        (/[a-z-]+\s*:\s*[^{]+;/.test(text) || text.includes('@media'))) {
      return 'css';
    }

    if (text.includes('{') && text.includes('}') &&
        (text.includes('function') || text.includes('=>') || text.includes('const ') ||
         text.includes('var ') || text.includes('let '))) {
      return 'javascript';
    }

    return 'text';
  };

  // Update the language detection when the original text changes
  useEffect(() => {
    setOriginalLanguage(detectLanguage(originalText));
  }, [originalText]);

  // Format JSON using json-formatter-js
  const formatJSON = (text) => {
    if (!text.trim()) return '';
    try {
      const parsed = JSON.parse(text);
      return JSON.stringify(parsed, null, 2);
    } catch (err) {
      alert('Invalid JSON in text field');
      return text;
    }
  };

  // Format handlers using the detected language
  const handleFormatOriginal = () => {
    if (detectLanguage(originalText) === 'json') {
      const formatted = formatJSON(originalText);
      if (formatted) setOriginalText(formatted);
    }
  };

  const handleFormatModified = () => {
    if (detectLanguage(modifiedText) === 'json') {
      const formatted = formatJSON(modifiedText);
      if (formatted) setModifiedText(formatted);
    }
  };

  // Syntax highlighting function
  const highlightSyntax = (str, language) => {
    if (!str) return '';
    const stringValue = typeof str === 'object' ? JSON.stringify(str, null, 2) : String(str);
    let prismLanguage = Prism.languages[language] || Prism.languages.text;
    return (
      <pre
        style={{ display: 'inline', margin: 0 }}
        dangerouslySetInnerHTML={{
          __html: Prism.highlight(stringValue, prismLanguage),
        }}
      />
    );
  };

  return (
    <div className="App">
      <h1>Diff Checker</h1>
      <div className="input-container">
        {/* ORIGINAL TEXT AREA */}
        <div className="text-input">
          <h2>Original Text</h2>
          <CodeMirror
            extensions={[EditorView.lineWrapping]}
            className="code-mirror-original"
            value={originalText}
            placeholder="Enter original text here..."
            height="200px"
            onChange={(value) => setOriginalText(value)}
          />
          {detectLanguage(originalText) === 'json' && (
            <div className="button-row">
              <button className="format-button" onClick={handleFormatOriginal}>
                Format JSON
              </button>
              <span className="language-indicator">
                Detected: JSON
              </span>
            </div>
          )}
        </div>
        {/* MODIFIED TEXT AREA */}
        <div className="text-input">
          <h2>Modified Text</h2>
          <CodeMirror
            extensions={[EditorView.lineWrapping]}
            className="code-mirror-modified"
            value={modifiedText}
            placeholder="Enter modified text here..."
            height="200px"
            onChange={(value) => setModifiedText(value)}
          />
          {detectLanguage(modifiedText) === 'json' && (
            <div className="button-row">
              <button className="format-button" onClick={handleFormatModified}>
                Format JSON
              </button>
              <span className="language-indicator">
                Detected: JSON
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="diff-container">
        <h2>Difference</h2>
        <div className="diff-viewer-wrapper">
          <DiffViewer
            oldValue={originalText}
            newValue={modifiedText}
            splitView={true}
            compareMethod={DiffMethod.CHARS}
            disableWordDiff={false}
            showDiffOnly={false}
            leftTitle="Original"
            rightTitle="Modified"
            renderContent={(str) => highlightSyntax(str, originalLanguage)}
            styles={{
              diffContainer: {
                overflowX: 'auto',
                width: '100%',
              },
              contentText: {
                wordBreak: 'break-all',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;