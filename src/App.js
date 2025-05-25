import { Copy, Moon, Sun, RefreshCw, Trash2, Code, ArrowUpDown } from 'lucide-react';
import './CodeDiff.css';
import React, { useState, useEffect } from 'react';
import DiffViewer, { DiffMethod } from 'react-diff-viewer';
import { ReactComponent as CopyIcon } from './copy.svg';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism.css';


function App() {
  const [originalText, setOriginalText] = useState('');
  const [modifiedText, setModifiedText] = useState('');
  const [originalLanguage, setOriginalLanguage] = useState('text');
  const [darkMode, setDarkMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [diffMode, setDiffMode] = useState('split'); // 'split' or 'unified'

    // Check if either text contains valid JSON
  const originalIsJSON = isValidJSON(originalText);
  const modifiedIsJSON = isValidJSON(modifiedText);

  // Beautify JSON function
  const beautifyJSON = (text) => {
    try {
      const parsed = JSON.parse(text);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return text;
    }
  };

  // Sort JSON keys function
  const sortJSON = (text) => {
    try {
      const parsed = JSON.parse(text);
      const sortedKeys = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(sortedKeys);
        } else if (obj !== null && typeof obj === 'object') {
          return Object.keys(obj)
            .sort()
            .reduce((result, key) => {
              result[key] = sortedKeys(obj[key]);
              return result;
            }, {});
        }
        return obj;
      };
      return JSON.stringify(sortedKeys(parsed), null, 2);
    } catch (e) {
      return text;
    }
  };

  // Beautify original JSON
  const beautifyOriginal = () => {
    if (originalIsJSON) {
      setOriginalText(beautifyJSON(originalText));
      showToastMessage('Original JSON beautified!');
    }
  };

  // Beautify modified JSON
  const beautifyModified = () => {
    if (modifiedIsJSON) {
      setModifiedText(beautifyJSON(modifiedText));
      showToastMessage('Modified JSON beautified!');
    }
  };

  // Sort original JSON
  const sortOriginal = () => {
    if (originalIsJSON) {
      setOriginalText(sortJSON(originalText));
      showToastMessage('Original JSON keys sorted!');
    }
  };

  // Sort modified JSON
  const sortModified = () => {
    if (modifiedIsJSON) {
      setModifiedText(sortJSON(modifiedText));
      showToastMessage('Modified JSON keys sorted!');
    }
  };

  
  // Generate diff
  const generateDiff = () => {
    if (!originalText.trim() && !modifiedText.trim()) {
      return [];
    }

    const originalLines = originalText.split('\n');
    const modifiedLines = modifiedText.split('\n');
    const maxLines = Math.max(originalLines.length, modifiedLines.length);
    const diffs = [];

    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || '';
      const modifiedLine = modifiedLines[i] || '';
      
      if (originalLine === modifiedLine) {
        diffs.push({
          type: 'equal',
          originalLine: originalLine,
          modifiedLine: modifiedLine,
          lineNumber: i + 1
        });
      } else if (originalLine && !modifiedLine) {
        diffs.push({
          type: 'removed',
          originalLine: originalLine,
          modifiedLine: '',
          lineNumber: i + 1
        });
      } else if (!originalLine && modifiedLine) {
        diffs.push({
          type: 'added',
          originalLine: '',
          modifiedLine: modifiedLine,
          lineNumber: i + 1
        });
      } else {
        diffs.push({
          type: 'modified',
          originalLine: originalLine,
          modifiedLine: modifiedLine,
          lineNumber: i + 1
        });
      }
    }

    return diffs;
  };

  const diffs = generateDiff();

  // Show toast message
  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToastMessage('Copied to clipboard!');
    });
  };

  // Clear all content
  const clearAll = () => {
    setOriginalText('');
    setModifiedText('');
    showToastMessage('All content cleared!');
  };

  // Swap content
  const swapContent = () => {
    const temp = originalText;
    setOriginalText(modifiedText);
    setModifiedText(temp);
    showToastMessage('Content swapped!');


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
    <div className={`app ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="header-left">
            <Code className="header-icon" />
            <div className="header-text">
              <h1>Code Diff</h1>
              <p>Compare and analyze code differences</p>
            </div>
          </div>
          
          <div className="header-controls">
            <button
              onClick={() => setDiffMode(diffMode === 'split' ? 'unified' : 'split')}
              className="control-btn"
              title="Toggle diff view"
            >
              <ArrowUpDown className="control-icon" />
            </button>
            
            <button
              onClick={swapContent}
              className="control-btn"
              title="Swap content"
            >
              <RefreshCw className="control-icon" />
            </button>
            
            <button
              onClick={clearAll}
              className="control-btn"
              title="Clear all"
            >
              <Trash2 className="control-icon" />
            </button>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="control-btn"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="control-icon" /> : <Moon className="control-icon" />}
            </button>
          </div>
        </div>
      </div>

      <div className="main-content">
        {/* Input Section */}
        <div className="input-grid">
          {/* Original Text */}
          <div className="input-panel">
            <div className="panel-header">
              <div className="panel-info">
                <h3>Original</h3>
                <p>{originalText.length} chars</p>
              </div>
              <button
                onClick={() => copyToClipboard(originalText)}
                className="copy-btn"
                disabled={!originalText}
              >
                <Copy className="copy-icon" />
              </button>
            </div>
            <textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="Enter original text here..."
              className="text-input"
            />
          </div>

          {/* Modified Text */}
          <div className="input-panel">
            <div className="panel-header">
              <div className="panel-info">
                <h3>Modified</h3>
                <p>{modifiedText.length} chars</p>
              </div>
              <button
                onClick={() => copyToClipboard(modifiedText)}
                className="copy-btn"
                disabled={!modifiedText}
              >
                <Copy className="copy-icon" />
              </button>
            </div>
            <textarea
              value={modifiedText}
              onChange={(e) => setModifiedText(e.target.value)}
              placeholder="Enter modified text here..."
              className="text-input"
            />
          </div>
        </div>

        {/* Differences Section */}
        <div className="diff-panel">
          <div className="diff-header">
            <div className="diff-title">
              <Code className="diff-icon" />
              <h3>Differences</h3>
            </div>
            <div className="diff-count">
              {diffs.filter(d => d.type !== 'equal').length} changes found
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
              extraLinesSurroundingDiff={5}
              useDarkTheme={darkMode}
              renderContent={(str) => highlightSyntax(str, originalLanguage)}
              styles={{
                diffContainer: {
                  overflowX: 'auto',
                  width: '100%',
                },
                contentText: {
                  wordBreak: 'break-all',
                }
              }}
            />
        </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="toast">
          <div className="toast-content">
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;