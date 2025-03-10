import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from "@codemirror/view";
import DiffViewer, { DiffMethod } from 'react-diff-viewer';
import { ReactComponent as CopyIcon } from './copy.svg';
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
  const [darkMode, setDarkMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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
      showToastNotification('Invalid JSON in text field');
      return text;
    }
  };

  // Format handlers using the detected language
  const handleFormatOriginal = () => {
    if (detectLanguage(originalText) === 'json') {
      const formatted = formatJSON(originalText);
      if (formatted) {
        setOriginalText(formatted);
        showToastNotification('JSON formatted successfully');
      }
    }
  };

  const handleFormatModified = () => {
    if (detectLanguage(modifiedText) === 'json') {
      const formatted = formatJSON(modifiedText);
      if (formatted) {
        setModifiedText(formatted);
        showToastNotification('JSON formatted successfully');
      }
    }
  };

  // Toast notification
  const showToastNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Clear both text areas
  const handleClearAll = () => {
    setOriginalText('');
    setModifiedText('');
    showToastNotification('All content cleared');
  };

  // Swap content between original and modified
  const handleSwapContent = () => {
    const temp = originalText;
    setOriginalText(modifiedText);
    setModifiedText(temp);
    showToastNotification('Content swapped');
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
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
    <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
      <header className="app-header">
        <h1>Diff Checker</h1>
        <div className="toolbar">
          <button className="icon-button" onClick={toggleDarkMode} title="Toggle Dark Mode">
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button className="action-button" onClick={handleClearAll}>
            Clear All
          </button>
          <button className="action-button" onClick={handleSwapContent}>
            Swap Content
          </button>
        </div>
      </header>

      <div className="input-container">
        {/* ORIGINAL TEXT AREA */}
        <div className="text-input">
          <div className="text-input-header">
            <h2>Original</h2>
            {detectLanguage(originalText) === 'json' && (
              <span className="language-badge">JSON</span>
            )}
          </div>
          <div className="editor-container">
            <CodeMirror
              extensions={[EditorView.lineWrapping]}
              className="code-mirror-original"
              value={originalText}
              placeholder="Enter original text here..."
              height="300px"
              width="100%"
              onChange={(value) => setOriginalText(value)}
              theme={darkMode ? 'dark' : 'light'}
            />
          </div>
          <div className="button-row">
            <div className="left-side">
              {detectLanguage(originalText) === 'json' && (
                <button className="format-button" onClick={handleFormatOriginal}>
                  Format JSON
                </button>
              )}
            </div>
            <div className="right-side">
              <button
                className="copy-button"
                onClick={() => {
                  navigator.clipboard.writeText(originalText);
                  showToastNotification('Original text copied!');
                }}
                title="Copy original text"
              >
                <CopyIcon width={15} height={15} />
              </button>
              <div className="characters-count">
                {originalText.length} characters
              </div>
            </div>
          </div>
        </div>
        
        {/* MODIFIED TEXT AREA */}
        <div className="text-input">
          <div className="text-input-header">
            <h2>Modified</h2>
            {detectLanguage(modifiedText) === 'json' && (
              <span className="language-badge">JSON</span>
            )}
          </div>
          <div className="editor-container">
            <CodeMirror
              extensions={[EditorView.lineWrapping]}
              className="code-mirror-modified"
              value={modifiedText}
              placeholder="Enter modified text here..."
              height="300px"
              width="100%"
              onChange={(value) => setModifiedText(value)}
              theme={darkMode ? 'dark' : 'light'}
            />
          </div>
          <div className="button-row">
            <div className="left-side">
              {detectLanguage(modifiedText) === 'json' && (
                <button className="format-button" onClick={handleFormatModified}>
                  Format JSON
                </button>
              )}
            </div>
            <div className="right-side">
              <button
                className="copy-button"
                onClick={() => {
                  navigator.clipboard.writeText(modifiedText);
                  showToastNotification('Modified text copied!');
                }}
                title="Copy modified text"
              >
                <CopyIcon width={15} height={15} />
              </button>
              <div className="characters-count">
                {modifiedText.length} characters
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="diff-container">
        <div className="diff-header">
          <h2>Difference</h2>
          <div className="diff-stats">
            {originalText.length > 0 && modifiedText.length > 0 && (
              <span className="similarity-indicator">
                Similarity: {Math.round((1 - Math.abs(originalText.length - modifiedText.length) / Math.max(originalText.length, modifiedText.length)) * 100)}%
              </span>
            )}
          </div>
        </div>
        <div className="diff-viewer-wrapper">
          <DiffViewer
            oldValue={originalText}
            newValue={modifiedText}
            splitView={true}
            compareMethod={DiffMethod.CHARS}
            disableWordDiff={false}
            showDiffOnly={false}
            renderContent={(str) => highlightSyntax(str, originalLanguage)}
            styles={{
              diffContainer: {
                overflowX: 'auto',
                width: '100%',
              },
              contentText: {
                wordBreak: 'break-all',
              },
              useDarkTheme: darkMode
            }}
          />
        </div>
      </div>

      {/* Toast notification */}
      {showToast && (
        <div className="toast-notification">
          <div className="toast-content">
            <div className="toast-message">{toastMessage}</div>
          </div>
        </div>
      )}

      {/* <footer className="app-footer">
        <p></p>
      </footer> */}
    </div>
  );
}

export default App;