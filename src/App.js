import { Copy, Moon, Sun, RefreshCw, Trash2, Code, ArrowUpDown, Wand2, ArrowUpAZ } from 'lucide-react'; // ArrowUpDown is still needed
import './App.css'; // Your existing CSS file
import React, { useState, useEffect } from 'react';
import DiffViewer, { DiffMethod } from 'react-diff-viewer';
import Editor from '@monaco-editor/react'; // Monaco Editor for input

// Helper to map detected language to Monaco's language identifiers
const getMonacoLanguage = (detectedLang) => {
  switch (detectedLang) {
    case 'text':
      return 'plaintext';
    case 'bash':
      return 'shell';
    case 'html':
      return 'html';
    case 'cpp':
      return 'cpp';
    default:
      return detectedLang; // Works for js, python, json, css, sql etc.
  }
};

function App() {
  const [originalText, setOriginalText] = useState('');
  const [modifiedText, setModifiedText] = useState('');
  const [originalLanguage, setOriginalLanguage] = useState('text');
  const [modifiedLanguage, setModifiedLanguage] = useState('text');
  const [darkMode, setDarkMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [diffMode, setDiffMode] = useState('split'); // 'split' or 'unified'

  // Language options (for potential dropdown, not directly used for auto-detect)
  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'css', label: 'CSS' },
    { value: 'html', label: 'HTML' },
    { value: 'json', label: 'JSON' },
    { value: 'xml', label: 'XML' },
    { value: 'sql', label: 'SQL' },
    { value: 'bash', label: 'Bash' },
    { value: 'text', label: 'Plain Text' }
  ];

  // JSON detection function
  const isValidJSON = (str) => {
    if (!str.trim()) return false;
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Auto-detect language based on content
  const detectLanguage = (text) => {
    if (!text.trim()) return 'text';
    if (isValidJSON(text)) return 'json';
    if (text.includes('<!DOCTYPE') || text.includes('<html>') || text.includes('<body')) return 'html';
    if ((text.includes('def ') || text.includes('import ') || text.includes('class ')) && !text.includes('{') && text.includes(':')) return 'python';
    if (text.includes('function ') || text.includes('=>') || text.includes('const ') || text.includes('let ') || text.includes('var ')) return 'javascript';
    if (text.includes('SELECT ') || text.includes('FROM ') || text.includes('INSERT INTO ') || text.includes('UPDATE ') || text.includes('DELETE FROM ')) return 'sql';
    if (text.includes('#include') || text.includes('int main(') || text.includes('using namespace std;')) return 'cpp';
    if (text.includes('{') && text.includes(';') && (text.includes(':') || text.includes('body')) && !isValidJSON(text)) return 'css';
    if (text.startsWith('#!/bin/bash') || text.startsWith('#!/bin/sh') || (text.includes('echo ') && text.includes('fi') && !text.includes('<?php'))) return 'bash';
    return 'text';
  };

  useEffect(() => {
    setOriginalLanguage(detectLanguage(originalText));
  }, [originalText]);

  useEffect(() => {
    setModifiedLanguage(detectLanguage(modifiedText));
  }, [modifiedText]);

  // Beautify JSON function
  const beautifyJSONText = (text) => {
    try {
      const parsed = JSON.parse(text);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      showToastMessage('Failed to beautify: Invalid JSON.');
      return text;
    }
  };

  // Sort JSON keys function
  const sortJSONText = (text) => {
    try {
      const parsed = JSON.parse(text);
      const sortedRecursive = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(sortedRecursive);
        } else if (obj !== null && typeof obj === 'object') {
          return Object.keys(obj).sort().reduce((result, key) => {
            result[key] = sortedRecursive(obj[key]);
            return result;
          }, {});
        }
        return obj;
      };
      return JSON.stringify(sortedRecursive(parsed), null, 2);
    } catch (e) {
      showToastMessage('Failed to sort: Invalid JSON.');
      return text;
    }
  };

  const beautifyOriginal = () => {
    if (originalLanguage === 'json') {
      setOriginalText(beautifyJSONText(originalText));
      showToastMessage('Original JSON beautified!');
    } else {
      showToastMessage('Beautify is only available for JSON.');
    }
  };

  const beautifyModified = () => {
    if (modifiedLanguage === 'json') {
      setModifiedText(beautifyJSONText(modifiedText));
      showToastMessage('Modified JSON beautified!');
    } else {
      showToastMessage('Beautify is only available for JSON.');
    }
  };

  const sortOriginal = () => {
    if (originalLanguage === 'json') {
      setOriginalText(sortJSONText(originalText));
      showToastMessage('Original JSON keys sorted!');
    } else {
      showToastMessage('Sort Keys is only available for JSON.');
    }
  };

  const sortModified = () => {
    if (modifiedLanguage === 'json') {
      setModifiedText(sortJSONText(modifiedText));
      showToastMessage('Modified JSON keys sorted!');
    } else {
      showToastMessage('Sort Keys is only available for JSON.');
    }
  };
  
  // Generate diff for the count display
  const generateDiff = () => {
    if (!originalText.trim() && !modifiedText.trim()) {
      return [];
    }
    const originalLines = originalText.split('\n');
    const modifiedLines = modifiedText.split('\n');
    const maxLines = Math.max(originalLines.length, modifiedLines.length);
    const diffs = [];

    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i]; 
      const modifiedLine = modifiedLines[i]; 

      if (originalLine === modifiedLine) {
        diffs.push({ type: 'equal', originalLine: originalLine ?? '', modifiedLine: modifiedLine ?? '', lineNumber: i + 1 });
      } else if (originalLine !== undefined && modifiedLine === undefined) {
        diffs.push({ type: 'removed', originalLine: originalLine, modifiedLine: '', lineNumber: i + 1 });
      } else if (originalLine === undefined && modifiedLine !== undefined) {
        diffs.push({ type: 'added', originalLine: '', modifiedLine: modifiedLine, lineNumber: i + 1 });
      } else {
        diffs.push({ type: 'modified', originalLine: originalLine ?? '', modifiedLine: modifiedLine ?? '', lineNumber: i + 1 });
      }
    }
    return diffs;
  };
  const diffs = generateDiff(); // Used for the count display

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToastMessage('Copied to clipboard!');
    });
  };

  const clearAll = () => {
    setOriginalText('');
    setModifiedText('');
    showToastMessage('All content cleared!');
  };

  const swapContent = () => {
    const tempOText = originalText;
    const tempOLang = originalLanguage;
    setOriginalText(modifiedText);
    setOriginalLanguage(modifiedLanguage);
    setModifiedText(tempOText);
    setModifiedLanguage(tempOLang);
    showToastMessage('Content swapped!');
  };

  const monacoEditorOptions = {
    selectOnLineNumbers: true,
    automaticLayout: true,
    wordWrap: 'on', // You had this 'on' in your last version
    minimap: { enabled: true }, // You had this 'true'
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: 'on',
    tabSize: 2,
    insertSpaces: true,
  };

  return (
    <div className={`app ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="header">
        <div className="header-content">
          <div className="header-left">
            <Code className="header-icon" />
            <div className="header-text"><h1>Code Diff</h1></div>
          </div>
          <div className="header-controls">
            {/* <button onClick={() => setDiffMode(diffMode === 'split' ? 'unified' : 'split')} className="control-btn" title="Toggle diff view"><ArrowUpDown className="control-icon" /></button> */}
            <button onClick={swapContent} className="control-btn" title="Swap content"><RefreshCw className="control-icon" /></button>
            <button onClick={clearAll} className="control-btn" title="Clear all"><Trash2 className="control-icon" /></button>
            <button onClick={() => setDarkMode(!darkMode)} className="control-btn" title="Toggle theme">{darkMode ? <Sun className="control-icon" /> : <Moon className="control-icon" />}</button>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="input-grid">
          <div className="input-panel">
            <div className="panel-header">
              <div className="panel-info">
                <h3 className="panel-title">Original
                  {originalLanguage !== 'text' && <span className="json-badge">{originalLanguage.toUpperCase()}</span>}
                </h3>
                <p>{originalText === '' ? 0 : originalText.split('\n').length} lines, {modifiedText.length} chars</p>              </div>
              <div className="panel-buttons">
                {originalLanguage === 'json' && (
                  <>
                    <button onClick={beautifyOriginal} className="copy-btn" title="Beautify JSON"><Wand2 className="copy-icon" /></button>
                    <button onClick={sortOriginal} className="copy-btn" title="Sort JSON keys"><ArrowUpAZ className="copy-icon" /></button>
                  </>
                )}
                <button onClick={() => copyToClipboard(originalText)} className="copy-btn" disabled={!originalText} title="Copy to clipboard"><Copy className="copy-icon" /></button>
              </div>
            </div>
            <div className="editor-container">
              <Editor
                height="500px" // Your specified height
                language={getMonacoLanguage(originalLanguage)}
                value={originalText}
                theme={darkMode ? 'vs-dark' : 'vs'}
                onChange={(value) => setOriginalText(value || '')}
                options={monacoEditorOptions}
              />
            </div>
          </div>

          <div className="input-panel">
            <div className="panel-header">
              <div className="panel-info">
                <h3 className="panel-title">Changed
                  {modifiedLanguage !== 'text' && <span className="json-badge">{modifiedLanguage.toUpperCase()}</span>}
                </h3>
                <p>{modifiedText === '' ? 0 : modifiedText.split('\n').length} lines, {modifiedText.length} chars</p>              </div>
              <div className="panel-buttons">
                {modifiedLanguage === 'json' && (
                  <>
                    <button onClick={beautifyModified} className="copy-btn" title="Beautify JSON"><Wand2 className="copy-icon" /></button>
                    <button onClick={sortModified} className="copy-btn" title="Sort JSON keys"><ArrowUpAZ className="copy-icon" /></button>
                  </>
                )}
                <button onClick={() => copyToClipboard(modifiedText)} className="copy-btn" disabled={!modifiedText} title="Copy to clipboard"><Copy className="copy-icon" /></button>
              </div>
            </div>
            <div className="editor-container">
              <Editor
                height="500px" // Your specified height
                language={getMonacoLanguage(modifiedLanguage)}
                value={modifiedText}
                theme={darkMode ? 'vs-dark' : 'vs'}
                onChange={(value) => setModifiedText(value || '')}
                options={monacoEditorOptions}
              />
            </div>
          </div>
        </div>

<div className="diff-panel">
          <div className="diff-header">
            <div className="diff-title">
              <Code className="diff-icon" />
              <h3>Differences</h3>
            </div>
            {/* NEW: Container for diff count and view toggle button */}
            <div className="diff-meta-controls">
              <div className="diff-count">{diffs.filter(d => d.type !== 'equal').length} changes found</div>
              <button
                onClick={() => setDiffMode(prevMode => prevMode === 'split' ? 'unified' : 'split')}
                className="control-btn diff-view-toggle-btn" // Re-use control-btn styles
                title={diffMode === 'split' ? "Switch to Unified View" : "Switch to Split View"}
              >
                <ArrowUpDown className="control-icon" />
              </button>
            </div>
          </div>
          <div className="diff-viewer-wrapper">
            <DiffViewer
              oldValue={originalText}
              newValue={modifiedText}
              splitView={diffMode === 'split'} // Controlled by state
              compareMethod={DiffMethod.CHARS}
              disableWordDiff={false}
              showDiffOnly={false}
              extraLinesSurroundingDiff={5}
              useDarkTheme={darkMode}
              styles={{
                diffContainer: { overflowX: 'auto', width: '100%' },
                contentText: { wordBreak: 'break-all' },
                variables: {
                  dark: { addedBackground: '#043A0F', removedBackground: '#5A1D1D' },
                  light: { addedBackground: '#e6ffed', removedBackground: '#ffeef0' }
                }
              }}
            />
          </div>
        </div>
        
      </div>

      {showToast && (
        <div className="toast"><div className="toast-content">{toastMessage}</div></div>
      )}
    </div>
  );
}

export default App;