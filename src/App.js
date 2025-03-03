import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from "@codemirror/view";
import DiffViewer, { DiffMethod } from 'react-diff-viewer';
import prettier from 'prettier/standalone';
import parserBabel from 'prettier/parser-babel';
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
  const [modifiedLanguage, setModifiedLanguage] = useState('text');

  // Auto-detect language based on content
  const detectLanguage = (text) => {
    if (!text.trim()) return 'text';
    
    // Try to detect JSON
    try {
      JSON.parse(text);
      return 'json';
    } catch (e) {
      // Not JSON, continue with other detection
    }
    
    // Check for Python characteristics
    if (text.includes('def ') || text.includes('import ') || text.includes('class ') || /:\s*\n\s+/.test(text)) {
      return 'python';
    }
    
    // Check for HTML
    if (text.includes('<html>') || text.includes('<!DOCTYPE html>') || 
        (text.includes('<') && text.includes('</') && text.includes('>'))) {
      return 'html';
    }
    
    // Check for CSS
    if (text.includes('{') && text.includes('}') && 
        (/[a-z-]+\s*:\s*[^{]+;/.test(text) || text.includes('@media'))) {
      return 'css';
    }
    
    // Default to JavaScript for code-like content with curly braces, semicolons, etc.
    if (text.includes('{') && text.includes('}') && 
        (text.includes('function') || text.includes('=>') || text.includes('const ') || 
         text.includes('var ') || text.includes('let '))) {
      return 'javascript';
    }
    
    return 'text';
  };

  // Update language detection when text changes
  useEffect(() => {
    setOriginalLanguage(detectLanguage(originalText));
  }, [originalText]);

  useEffect(() => {
    setModifiedLanguage(detectLanguage(modifiedText));
  }, [modifiedText]);

  // Format code based on detected language
  const formatCode = (text, language) => {
    if (!text.trim()) return '';
    
    try {
      if (language === 'json') {
        // For JSON, parse and stringify with proper indentation first
        const parsed = JSON.parse(text);
        const jsonString = JSON.stringify(parsed, null, 2);
        return prettier.format(jsonString, {
          parser: 'json',
          plugins: [parserBabel],
        });
      } else if (language === 'javascript') {
        return prettier.format(text, {
          parser: 'babel',
          plugins: [parserBabel],
        });
      }
      // For other languages, return as is (we could add more formatters if needed)
      return text;
    } catch (err) {
      alert(`Invalid ${language.toUpperCase()} in text field`);
      return text;
    }
  };

  // Format handlers with language awareness
  const handleFormatOriginal = () => {
    const formatted = formatCode(originalText, originalLanguage);
    if (formatted) setOriginalText(formatted);
  };

  const handleFormatModified = () => {
    const formatted = formatCode(modifiedText, modifiedLanguage);
    if (formatted) setModifiedText(formatted);
  };

  // Syntax highlighting function for renderContent
  const highlightSyntax = (str, language) => {
    if (!str) return '';
    
    // Make sure string is actually a string to avoid the error
    const stringValue = typeof str === 'object' ? JSON.stringify(str, null, 2) : String(str);
    
    // Choose the correct Prism language for highlighting
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
          <div className="button-row">
            <button className="format-button" onClick={handleFormatOriginal}>
              Format {originalLanguage.charAt(0).toUpperCase() + originalLanguage.slice(1)}
            </button>
            <span className="language-indicator">
              Detected: {originalLanguage.charAt(0).toUpperCase() + originalLanguage.slice(1)}
            </span>
          </div>
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
          <div className="button-row">
            <button className="format-button" onClick={handleFormatModified}>
              Format {modifiedLanguage.charAt(0).toUpperCase() + modifiedLanguage.slice(1)}
            </button>
            <span className="language-indicator">
              Detected: {modifiedLanguage.charAt(0).toUpperCase() + modifiedLanguage.slice(1)}
            </span>
          </div>
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
                overflowX: 'auto', // Enable horizontal scrolling
                width: '100%', // Ensure it takes full width
              },
              contentText: {
                wordBreak: 'break-all', // Break long words to prevent overflow
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;