
import AdvancedLineNumberedTextarea from './components/AdvancedLineNumberedTextArea';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from "@codemirror/view"
import { StreamLanguage } from '@codemirror/language';
import 'codemirror/lib/codemirror.css'; // CodeMirror base styles
import 'codemirror/theme/dracula.css'; // Optional: Theme styles
import 'codemirror/mode/javascript/javascript'; // Language mode

import React, { useState } from 'react';

// You can still use a diff library like react-diff-viewer, or the diff package, etc.
// For example:
import DiffViewer, { DiffMethod } from 'react-diff-viewer';
import './App.css';

function App() {
  const [originalText, setOriginalText] = useState('');
  const [modifiedText, setModifiedText] = useState('');

  // Optional: custom styles for react-diff-viewer highlighting
  const customStyles = {
    variables: {
      light: {
        diffViewerBackground: '#f7f7f7',
        diffViewerColor: '#333',
        addedBackground: '#e0ffe0',
        addedColor: '#2c662d',
        removedBackground: '#ffecec',
        removedColor: '#8c1a1a',
      },
    },
    line: {
      wordAdded: {
        backgroundColor: '#b1fcb1',
      },
      wordRemoved: {
        backgroundColor: '#ffb9b9',
      },
      whiteSpace: 'pre-wrap'
    },
  };
  
  return (
    <div className="App">
      <h1>Diff Checker</h1>
      <div className="input-container">
        <div className="text-input">
          <h2>Original Text</h2>
          <CodeMirror
            extensions={[EditorView.lineWrapping]}
            className="code-mirror-original"
            value={originalText}
            placeholder="Enter original text here..."
            height="200px"
            options={{
              lineWrapping: true
            }}
            onChange={(value) => setOriginalText(value)} // Updated to pass the editor content
          />
        </div>

        <div className="text-input">
          <h2>Modified Text</h2>
          <CodeMirror
            className="code-mirror-modified"
            value={modifiedText}
            placeholder="Enter modified text here..."
            height="200px"
            options={{
              lineWrapping: true
            }}
            onChange={(value) => setModifiedText(value)} // Updated to pass the editor content
          />
        </div>
      </div>

      <div className="diff-container">
        <h2>Difference</h2>
        <DiffViewer
          oldValue={originalText}
          newValue={modifiedText}
          splitView={true}
          compareMethod={DiffMethod.WORDS}
          styles={customStyles}
          disableWordDiff={false}
          showDiffOnly={false}
        />
      </div>
    </div>
  );
}

export default App;
