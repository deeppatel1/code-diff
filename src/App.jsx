import React, { useEffect, useRef, useState } from 'react';
import { Code, Columns, AlignLeft } from 'lucide-react';
import * as monaco from 'monaco-editor';
import './App.css';

// Configure Monaco Environment before any Monaco Editor instance is created
// This is crucial for workers to be loaded correctly, enabling features like syntax highlighting.
if (typeof window !== 'undefined') {
 window.MonacoEnvironment = {
   getWorker: async (_, label) => {
     if (label === 'json') {
       const { default: JsonWorker } = await import('monaco-editor/esm/vs/language/json/json.worker?worker');
       return new JsonWorker();
     }
     if (label === 'css' || label === 'scss' || label === 'less') {
       const { default: CssWorker } = await import('monaco-editor/esm/vs/language/css/css.worker?worker');
       return new CssWorker();
     }
     if (label === 'html' || label === 'handlebars' || label === 'razor') {
       const { default: HtmlWorker } = await import('monaco-editor/esm/vs/language/html/html.worker?worker');
       return new HtmlWorker();
     }
     if (label === 'typescript' || label === 'javascript' || label === 'jsx') {
       const { default: TsWorker } = await import('monaco-editor/esm/vs/language/typescript/ts.worker?worker');
       return new TsWorker();
     }
     // Fallback to editor worker for other languages (plaintext, python, go, etc.)
     const { default: EditorWorker } = await import('monaco-editor/esm/vs/editor/editor.worker?worker');
     return new EditorWorker();
   },
 };
}


// 1) Define & apply your custom diff theme
monaco.editor.defineTheme('airbnb-dark-diff', {
 base: 'vs-dark',
 inherit: true,
 rules: [],
 colors: {
   'editor.background': '#181A1B',
   'editor.foreground': '#c5c5c5',
   'diffEditor.removedLineBackground': '#2d1b1b',
   'diffEditorGutter.removedLineBackground': '#3d1f1f',
   'diffEditor.removedTextBackground': '#c24b4b',
   'diffEditor.insertedLineBackground': '#121c14',
   'diffEditorGutter.insertedLineBackground': '#1f3d23',
   'diffEditor.insertedTextBackground': '#2d5a35',
   'diffEditor.border': '#3C3C3C',
 }
});
monaco.editor.setTheme('airbnb-dark-diff');

export default function App() {
 const containerRef = useRef(null);
 const diffEditorRef = useRef(null);

 const [originalLanguage, setOriginalLanguage] = useState('plaintext');
 const [modifiedLanguage, setModifiedLanguage] = useState('plaintext');
 const [originalStats, setOriginalStats] = useState({ lines: 0, characters: 0 });
 const [modifiedStats, setModifiedStats] = useState({ lines: 0, characters: 0 });
 const [isSideBySide, setIsSideBySide] = useState(true);

 // helpers
 const calculateStats = code => ({
   lines: code ? code.split('\n').length : 0,
   characters: code ? code.length : 0
 });

 const detectLanguage = code => {
   if (!code || code.trim() === "") return "plaintext";
   const t = code.trim();
   if (!t) return 'plaintext';
   if (t.startsWith('#!')) return 'bash';
   try { JSON.parse(code); return 'json'; } catch {}
   if (/^\s*import\s+React\s+from\s+['"]react['"]/.test(t) || /<\w+[^>]*>.*<\/\w+>/.test(t) && t.includes(';')) return 'jsx';
   if (t.startsWith('<') && t.endsWith('>')) return 'html';
   if (/^\s*(interface|type|enum)\s+\w+/.test(t) || (t.includes('import ') && t.includes(' from ') && t.includes(';'))) return 'typescript';
   if (/^\s*import\s.+from/.test(t) || t.includes('function(') || t.includes('const ') || t.includes('let ')) return 'javascript';
   if (t.includes('{') && t.includes(';') && t.includes(':') && !t.includes('<') && !t.includes('>')) return 'css';
   if (/^def\s+\w+\(/.test(t) || (t.includes('import ') && t.includes(':'))) return 'python';
   if (/^\s*package\s+main/.test(t) || /^\s*func\s+main\s*\(\)\s*{/.test(t)) return 'go';
   if (/^\s*<\?php/.test(t) || (t.includes('function ') && t.includes('$'))) return 'php';
   if (/^\s*(def|class)\s+\w+/.test(t) || t.includes('puts ')) return 'ruby';
   if (/^\s*fn\s+main\s*\(\)\s*{/.test(t) || /^\s*mod\s+\w+/.test(t) || /^\s*use\s+/.test(t)) return 'rust';
   if (/^\s*fun\s+main\s*\(\)\s*{/.test(t) || /^\s*package\s+\w+/.test(t) || /^\s*class\s+\w+/.test(t)) return 'kotlin';
   if (/^\s*#include\s*<iostream>/.test(t) || /^\s*class\s+\w+/.test(t)) return 'cpp';
   if (/^\s*#include/.test(t) || /int\s+main\s*\(/.test(t)) return 'c';
   if (/^\s*package\s+\w+/.test(t) || /public\s+class/.test(t)) return 'java';
   if (/^\s*using\s+System/.test(t) || /namespace\s+\w+/.test(t)) return 'csharp';
   if (/^\s*SELECT\s+/.test(t.toUpperCase()) || /^\s*CREATE\s+/.test(t.toUpperCase())) return 'sql';
   return 'plaintext';
 };

 const beautifyJson = (jsonString) => {
   try {
     const parsed = JSON.parse(jsonString);
     return JSON.stringify(parsed, null, '    '); // Changed to 4 spaces
   } catch {
     return jsonString;
   }
 };

 const compactJson = (jsonString) => {
   try {
     const parsed = JSON.parse(jsonString);
     return JSON.stringify(parsed);
   } catch {
     return jsonString;
   }
 };

 const sortJson = (jsonString) => {
   try {
     const parsed = JSON.parse(jsonString);
     const sortObject = (obj) => {
       if (Array.isArray(obj)) {
         return obj.map(sortObject);
       } else if (obj !== null && typeof obj === 'object') {
         return Object.keys(obj)
           .sort()
           .reduce((result, key) => {
             result[key] = sortObject(obj[key]);
             return result;
           }, {});
       }
       return obj;
     };
     const sorted = sortObject(parsed);
     return beautifyJson(JSON.stringify(sorted));
   } catch {
     return jsonString;
   }
 };

 const handleBeautifyOriginal = () => {
   if (diffEditorRef.current) {
     const model = diffEditorRef.current.getOriginalEditor().getModel();
     const beautified = beautifyJson(model.getValue());
     model.setValue(beautified);
   }
 };

 const handleSortOriginal = () => {
   if (diffEditorRef.current) {
     const model = diffEditorRef.current.getOriginalEditor().getModel();
     const sorted = sortJson(model.getValue());
     model.setValue(sorted);
   }
 };

 const handleCompactOriginal = () => {
   if (diffEditorRef.current) {
     const model = diffEditorRef.current.getOriginalEditor().getModel();
     const compacted = compactJson(model.getValue());
     model.setValue(compacted);
   }
 };

 const handleBeautifyModified = () => {
   if (diffEditorRef.current) {
     const model = diffEditorRef.current.getModifiedEditor().getModel();
     const beautified = beautifyJson(model.getValue());
     model.setValue(beautified);
   }
 };

 const handleSortModified = () => {
   if (diffEditorRef.current) {
     const model = diffEditorRef.current.getModifiedEditor().getModel();
     const sorted = sortJson(model.getValue());
     model.setValue(sorted);
   }
 };

 const handleCompactModified = () => {
   if (diffEditorRef.current) {
     const model = diffEditorRef.current.getModifiedEditor().getModel();
     const compacted = compactJson(model.getValue());
     model.setValue(compacted);
   }
 };

 useEffect(() => {
   if (!containerRef.current || diffEditorRef.current) return;

   diffEditorRef.current = monaco.editor.createDiffEditor(containerRef.current, {
     theme: 'airbnb-dark-diff',
     automaticLayout: true,
     renderSideBySide: isSideBySide,
     enableSplitViewResizing: false,   // disables drag‐to‐resize
     useInlineViewWhenSpaceIsLimited: false,
     minimap: { enabled: true },
     fontFamily: 'Monaco, Menlo, "Courier New", monospace',
     fontSize: 14,
     lineHeight: 20,
     scrollBeyondLastLine: true,
     wordWrap: 'on',
     renderWhitespace: 'boundary',
     lineNumbers: 'on',
     glyphMargin: false,
     folding: true,
     diffAlgorithm: 'legacy',
    //  overviewRulerLanes: 2,
     lineNumbersMinChars: 3,
     originalEditable: true,
     readOnly: false
   });

   const originalModel = monaco.editor.createModel('', originalLanguage);
   const modifiedModel = monaco.editor.createModel('', modifiedLanguage);
   diffEditorRef.current.setModel({ original: originalModel, modified: modifiedModel });

   // 4) Wire up language & stats updates
   const updateOriginal = () => {
     const val   = originalModel.getValue();
     const stats = calculateStats(val);
     const lang  = detectLanguage(val);
 
     setOriginalStats(stats);
     setOriginalLanguage(lang);
 
     // compare against the model's language, not the stale React var:
     if (originalModel.getLanguageId() !== lang) {
       monaco.editor.setModelLanguage(originalModel, lang);
     }
   };
   const updateModified = () => {
     const val   = modifiedModel.getValue();
     const stats = calculateStats(val);
     const lang  = detectLanguage(val);
 
     setModifiedStats(stats);
     setModifiedLanguage(lang);
 
     if (modifiedModel.getLanguageId() !== lang) {
       monaco.editor.setModelLanguage(modifiedModel, lang);
     }
   };
   originalModel.onDidChangeContent(updateOriginal);
   modifiedModel.onDidChangeContent(updateModified);
   updateOriginal();
   updateModified();

 }, [isSideBySide]);

 // Update the diff editor's rendering mode when isSideBySide changes
 useEffect(() => {
   if (diffEditorRef.current) {
     diffEditorRef.current.updateOptions({ renderSideBySide: isSideBySide });
   }
 }, [isSideBySide]);

 return (
   <div className="app">
     <div className="app-header">
       <div className="header-left">
         <Code className="header-icon" />
         <div className="header-text"><h1>Code Diff</h1></div>
       </div>
     </div>
     <div className="editor-container" ref={containerRef} />
      <div className="app-footer">
        <div className="footer-stats">
          <div className="stats-display">
            {originalStats.lines} lines, {originalStats.characters} characters
            {originalLanguage !== 'plaintext' && (
              <span className="language-indicator">    {originalLanguage} </span>
            )}
            {originalLanguage === 'json' && (
              <>
                <button className="json-btn" onClick={handleBeautifyOriginal}>Beautify</button>
                <button className="json-btn" onClick={handleSortOriginal}>Sort</button>
                <button className="json-btn" onClick={handleCompactOriginal}>Minify</button>
              </>
            )}
          </div>
          <div className="view-toggle-container">
            <button 
              className="view-toggle-btn"
              onClick={() => setIsSideBySide(!isSideBySide)}
              title={isSideBySide ? "Switch to Unified View" : "Switch to Side-by-Side View"}
            >
              {isSideBySide ? <AlignLeft size={20} /> : <Columns size={16} />}
            </button>
          </div>
          <div className="stats-display">
            {modifiedLanguage === 'json' && (
              <>
                <button className="json-btn" onClick={handleBeautifyModified}>Beautify</button>
                <button className="json-btn" onClick={handleSortModified}>Sort</button>
                <button className="json-btn" onClick={handleCompactModified}>Minify</button>
              </>
            )}
            {modifiedLanguage !== 'plaintext' && (
              <span className="language-indicator">{modifiedLanguage}    </span>
            )}
            {modifiedStats.lines} lines, {modifiedStats.characters} characters
          </div>
        </div>
      </div>
   </div>
 );
}