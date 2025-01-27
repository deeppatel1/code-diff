import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from "@codemirror/view";
import DiffViewer, { DiffMethod } from 'react-diff-viewer';

// 1. Import Prettier and the Babel parser
import prettier from 'prettier/standalone';
import parserBabel from 'prettier/parser-babel';

import './App.css';

function App() {
  const [originalText, setOriginalText] = useState('');
  const [modifiedText, setModifiedText] = useState('');

  // Format only the "Original Text" field
  const handleFormatJSONOriginal = () => {
    if (originalText.trim()) {
      try {
        // Step 1: Validate it's valid JSON by parsing
        const parsed = JSON.parse(originalText);
        
        // Step 2: Convert back to string (so Prettier sees valid JSON)
        const jsonString = JSON.stringify(parsed, null, 2); 

        // Step 3: Use Prettier to format the string
        const formatted = prettier.format(jsonString, {
          parser: 'json',
          plugins: [parserBabel],
        });

        // Update state with the formatted JSON
        setOriginalText(formatted);
      } catch (err) {
        alert('Invalid JSON in Original Text');
      }
    }
  };

  // Format only the "Modified Text" field
  const handleFormatJSONModified = () => {
    if (modifiedText.trim()) {
      try {
        const parsed = JSON.parse(modifiedText);
        const jsonString = JSON.stringify(parsed);

        const formatted = prettier.format(jsonString, {
          parser: 'json',
          plugins: [parserBabel],
        });

        setModifiedText(formatted);
      } catch (err) {
        alert('Invalid JSON in Modified Text');
      }
    }
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
            onChange={(value, viewUpdate) => setOriginalText(value)}
          />
          
          <div className="button-row">
            <button className="format-button" onClick={handleFormatJSONOriginal}>
              Format JSON
            </button>
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
            onChange={(value, viewUpdate) => setModifiedText(value)}
          />
          
          <div className="button-row">
            <button className="format-button" onClick={handleFormatJSONModified}>
              Format JSON
            </button>
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
            compareMethod={DiffMethod.WORDS}
            disableWordDiff={false}
            showDiffOnly={false}
            leftTitle="Original"
            rightTitle="Modified"
            styles={{
              diffContainer: {
                overflowX: 'auto', // Enable horizontal scrolling
                width: '100%', // Ensure it takes full width
              },
              contentText: {
                wordBreak: 'break-all', // Break long words to prevent overflow
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;