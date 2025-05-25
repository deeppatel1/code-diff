import { Copy, Moon, Sun, RefreshCw, Trash2, Code, ArrowUpDown, Wand2, ArrowUpAZ } from 'lucide-react';
import './CodeDiff.css';
import React, { useState, useEffect } from 'react';
import DiffViewer, { DiffMethod } from 'react-diff-viewer';
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
  const [originalLanguage, setOriginalLanguage] = useState('text'); // State for original language
  const [modifiedLanguage, setModifiedLanguage] = useState('text'); // State for modified language
  const [language, setLanguage] = useState('javascript'); // This state seems to be for overall highlighting, keep it for now
  const [darkMode, setDarkMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [diffMode, setDiffMode] = useState('split'); // 'split' or 'unified'

    // Language options (This can be used for a dropdown if you add one later)
  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', 'label': 'Python' },
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

  // Auto-detect language based on content
  const detectLanguage = (text) => {
    if (!text.trim()) return 'text'; // If empty, default to text
    if (isValidJSON(text)) return 'json';
    if (text.includes('<!DOCTYPE') || text.includes('<html>') || text.includes('<body')) return 'html';
    if (text.includes('def ') && text.includes(':') && !text.includes('{')) return 'python'; // Added !text.includes('{') to differentiate from JS
    if (text.includes('function ') || text.includes('=>') || text.includes('const ') || text.includes('let ') || text.includes('var ')) return 'javascript';
    if (text.includes('SELECT ') || text.includes('FROM ') || text.includes('INSERT INTO ') || text.includes('UPDATE ') || text.includes('DELETE FROM ')) return 'sql';
    if (text.includes('#include') || text.includes('int main(') || text.includes('using namespace std;')) return 'cpp';
    if (text.includes('{') && text.includes(';') && (text.includes(':') || text.includes('body')) && !isValidJSON(text)) return 'css'; // Basic CSS detection
    return 'text';
  };

  // Auto-detect language when text changes
  useEffect(() => {
    setOriginalLanguage(detectLanguage(originalText));
  }, [originalText]);

  useEffect(() => {
    setModifiedLanguage(detectLanguage(modifiedText));
  }, [modifiedText]);


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
// Syntax highlighting with basic patterns
  const highlightSyntax = (text, lang) => {
    if (!text) return '';
    
    let highlightedText = text;
    
    switch (lang) {
      case 'javascript':
        highlightedText = text
          .replace(/(function|const|let|var|if|else|for|while|return|class|extends|import|export|from|default|async|await|try|catch|finally)\b/g, '<span style="color: #0969da; font-weight: bold;">$1</span>')
          .replace(/\/\/.*$/gm, '<span style="color: #6a737d; font-style: italic;">$&</span>')
          .replace(/\/\*[\s\S]*?\*\//g, '<span style="color: #6a737d; font-style: italic;">$&</span>')
          .replace(/"([^"\\]|\\.)*"/g, '<span style="color: #032f62;">$&</span>')
          .replace(/'([^'\\]|\\.)*'/g, '<span style="color: #032f62;">$&</span>')
          .replace(/`([^`\\]|\\.)*`/g, '<span style="color: #032f62;">$&</span>');
        break;
      
      case 'python':
        highlightedText = text
          .replace(/(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield|async|await|pass|break|continue)\b/g, '<span style="color: #0969da; font-weight: bold;">$1</span>')
          .replace(/#.*$/gm, '<span style="color: #6a737d; font-style: italic;">$&</span>')
          .replace(/"([^"\\]|\\.)*"/g, '<span style="color: #032f62;">$&</span>')
          .replace(/'([^'\\]|\\.)*'/g, '<span style="color: #032f62;">$&</span>');
        break;
      
      case 'json':
        highlightedText = text
          .replace(/"([^"\\]|\\.)*"(?=\s*:)/g, '<span style="color: #0969da; font-weight: bold;">$&</span>')
          .replace(/"([^"\\]|\\.)*"(?!\s*:)/g, '<span style="color: #032f62;">$&</span>')
          .replace(/\b(true|false|null)\b/g, '<span style="color: #e36209; font-weight: bold;">$1</span>')
          .replace(/\b\d+\.?\d*\b/g, '<span style="color: #e36209;">$&</span>');
        break;
      
      case 'css':
        highlightedText = text
          .replace(/([a-zA-Z-]+)(?=\s*:)/g, '<span style="color: #0969da;">$1</span>')
          .replace(/:\s*([^;]+)/g, ': <span style="color: #032f62;">$1</span>')
          .replace(/\/\*[\s\S]*?\*\//g, '<span style="color: #6a737d; font-style: italic;">$&</span>');
        break;
      
      case 'html':
        highlightedText = text
          .replace(/&lt;(\/?[a-zA-Z][^&gt;]*)&gt;/g, '<span style="color: #116329;">&lt;$1&gt;</span>')
          .replace(/(<\/?[a-zA-Z][^>]*)>/g, '<span style="color: #116329;">$1</span>')
          .replace(/\s([a-zA-Z-]+)=/g, ' <span style="color: #0969da;">$1</span>=')
          .replace(/"([^"]*)"/g, '<span style="color: #032f62;">"$1"</span>');
        break;
    }
    
    return highlightedText;
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
                <h3 className="panel-title">
                  Original
                  {originalLanguage !== 'text' && <span className="json-badge"> {originalLanguage.toUpperCase()}</span>}
                </h3>
                <p>{originalText.length} chars</p>
              </div>
              <div className="panel-buttons">
                {originalIsJSON && (
                  <>
                    <button
                      onClick={beautifyOriginal}
                      className="copy-btn"
                      title="Beautify JSON"
                    >
                      <Wand2 className="copy-icon" />
                    </button>
                    <button
                      onClick={sortOriginal}
                      className="copy-btn"
                      title="Sort JSON keys"
                    >
                      <ArrowUpAZ className="copy-icon" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => copyToClipboard(originalText)}
                  className="copy-btn"
                  disabled={!originalText}
                  title="Copy to clipboard"
                >
                  <Copy className="copy-icon" />
                </button>
              </div>
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
                <h3 className="panel-title">
                  Modified
                  {modifiedLanguage !== 'text' && <span className="json-badge"> {modifiedLanguage.toUpperCase()}</span>}
                </h3>
                <p>{modifiedText.length} chars</p>
              </div>
              <div className="panel-buttons">
                {modifiedIsJSON && (
                  <>
                    <button
                      onClick={beautifyModified}
                      className="copy-btn"
                      title="Beautify JSON"
                    >
                      <Wand2 className="copy-icon" />
                    </button>
                    <button
                      onClick={sortModified}
                      className="copy-btn"
                      title="Sort JSON keys"
                    >
                      <ArrowUpAZ className="copy-icon" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => copyToClipboard(modifiedText)}
                  className="copy-btn"
                  disabled={!modifiedText}
                  title="Copy to clipboard"
                >
                  <Copy className="copy-icon" />
                </button>
              </div>
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