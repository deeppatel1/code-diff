import hljs from 'highlight.js/lib/core';

// Themes (pick one or add your own)
import 'highlight.js/styles/github.css';

// Register many common languages
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
// import xml from 'highlight.js/lib/languages/xml';
import html from 'highlight.js/lib/languages/xml';
import bash from 'highlight.js/lib/languages/bash';
import cpp from 'highlight.js/lib/languages/cpp';
// import csharp from 'highlight.js/lib/languages/csharp';
import css from 'highlight.js/lib/languages/css';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
// import kotlin from 'highlight.js/lib/languages/kotlin';
// import lua from 'highlight.js/lib/languages/lua';
// import php from 'highlight.js/lib/languages/php';
// import ruby from 'highlight.js/lib/languages/ruby';
// import rust from 'highlight.js/lib/languages/rust';
import sql from 'highlight.js/lib/languages/sql';
import yaml from 'highlight.js/lib/languages/yaml';
// import ini from 'highlight.js/lib/languages/ini';
// import powershell from 'highlight.js/lib/languages/powershell';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import makefile from 'highlight.js/lib/languages/makefile';
// import perl from 'highlight.js/lib/languages/perl';
import markdown from 'highlight.js/lib/languages/markdown';
// import objectivec from 'highlight.js/lib/languages/objectivec';
// import scss from 'highlight.js/lib/languages/scss';
// import swift from 'highlight.js/lib/languages/swift';
// import r from 'highlight.js/lib/languages/r';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('json', json);
// hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', html);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('cpp', cpp);
// hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('css', css);
hljs.registerLanguage('go', go);
hljs.registerLanguage('java', java);
// hljs.registerLanguage('kotlin', kotlin);
// hljs.registerLanguage('lua', lua);
// hljs.registerLanguage('php', php);
// hljs.registerLanguage('ruby', ruby);
// hljs.registerLanguage('rust', rust);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('yaml', yaml);
// hljs.registerLanguage('ini', ini);
// hljs.registerLanguage('powershell', powershell);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('makefile', makefile);
// hljs.registerLanguage('perl', perl);
hljs.registerLanguage('markdown', markdown);
// hljs.registerLanguage('objectivec', objectivec);
// hljs.registerLanguage('scss', scss);
// hljs.registerLanguage('swift', swift);
// hljs.registerLanguage('r', r);

import { Copy, Moon, Sun, RefreshCw, Trash2, Code, ArrowUpDown, Wand2, ArrowUpAZ } from 'lucide-react';
import './App.css';
import React, { useState, useEffect } from 'react';
import { Editor, DiffEditor } from '@monaco-editor/react';

// --- Updated and Expanded Language Definitions ---

const languageOptions = [
  { value: 'bash', label: 'Bash/Shell' },
  { value: 'cpp', label: 'C++' },
  { value: 'css', label: 'CSS' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'go', label: 'Go' },
  { value: 'html', label: 'HTML' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'json', label: 'JSON' },
  { value: 'makefile', label: 'Makefile' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'python', label: 'Python' },
  { value: 'sql', label: 'SQL' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'yaml', label: 'YAML' }
];
languageOptions.sort((a, b) => a.label.localeCompare(b.label));



// Updated Helper to map detected language to Monaco's language identifiers
const getMonacoLanguage = (detectedLang) => {
  switch (detectedLang) {
    case 'bash': return 'shell';
    // Most other languages from the active list map directly, so a default is sufficient.
    default:
      return detectedLang;
  }
};

// JSON detection function (as provided in your original code)
const isValidJSON = (str) => {
  if (!str || !str.trim()) return false; // Added null check for safety
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

const detectLanguage = (text) => {
  if (!text || !text.trim()) return 'text';

  const result = hljs.highlightAuto(text);
  let lang = result.language || 'text';

  // 🔍 SQL fallback: match SQL patterns if hljs misses it
  if (
    /(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|CREATE|DROP|ALTER|TABLE|VALUES)\b/i.test(text) &&
    /;/.test(text) &&
    text.split('\n').length > 1
  ) {
    lang = 'sql';
  }

  console.log(lang, 'detected language'); // Debugging output

  return lang;
};

function App() {
  const [originalText, setOriginalText] = useState('');
  const [modifiedText, setModifiedText] = useState('');
  const [originalLanguage, setOriginalLanguage] = useState('text');
  const [modifiedLanguage, setModifiedLanguage] = useState('text');
  const [darkMode, setDarkMode] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [diffMode, setDiffMode] = useState('split');

  const beautifyJSONText = (text) => {
    try {
      const parsed = JSON.parse(text);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      showToastMessage('Failed to beautify: Invalid JSON.');
      return text;
    }
  };

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
    setOriginalLanguage('text'); // Reset language on clear
    setModifiedLanguage('text'); // Reset language on clear
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
    wordWrap: 'on',
    minimap: { enabled: true },
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
            <button onClick={swapContent} className="control-btn" title="Swap content"><RefreshCw className="control-icon" /></button>
            <button onClick={clearAll} className="control-btn" title="Clear all"><Trash2 className="control-icon" /></button>
            <button onClick={() => setDarkMode(!darkMode)} className="control-btn" title="Toggle theme">{darkMode ? <Sun className="control-icon" /> : <Moon className="control-icon" />}</button>
          </div>
        </div>
      </div>

      <div className="main-content">
<div className="input-grid">
  <div className="input-panel full-width">
    <div className="panel-header">
      <div className="panel-info">
        <h3 className="panel-title">Code Comparison
          {modifiedLanguage !== 'text' && (
            <span className="json-badge">
              {languageOptions.find(opt => opt.value === modifiedLanguage)?.label || modifiedLanguage.toUpperCase()}
            </span>
          )}
        </h3>
        <p>{modifiedText === '' ? 0 : modifiedText.split('\n').length} lines, {modifiedText.length} chars</p>
      </div>
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
      <DiffEditor
        height="500px"
        original={originalText}
        modified={modifiedText}
        language={getMonacoLanguage(modifiedLanguage || originalLanguage)}
        theme={darkMode ? 'vs-dark' : 'vs'}
        options={{
          ...monacoEditorOptions,
          renderSideBySide: diffMode !== 'split',
        }}
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
            <div className="diff-meta-controls">
              <button
                onClick={() => setDiffMode(prevMode => prevMode === 'split' ? 'unified' : 'split')}
                className="control-btn diff-view-toggle-btn"
                title={diffMode === 'split' ? "Switch to Unified View" : "Switch to Split View"}
              >
                <ArrowUpDown className="control-icon" />
              </button>
            </div>
          </div>
          {/* <div className="diff-viewer-wrapper">
            <Editor.DiffEditor
              height="500px"
              original={originalText}
              modified={modifiedText}
              language={getMonacoLanguage(originalLanguage)}
              theme={darkMode ? 'vs-dark' : 'vs'}
              options={{
                ...monacoEditorOptions,
                renderSideBySide: diffMode === 'split',
              }}
            />
          </div> */}
        </div>
        
      </div>

      {showToast && (
        <div className="toast"><div className="toast-content">{toastMessage}</div></div>
      )}
    </div>
  );
}

export default App;
