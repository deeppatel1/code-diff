import React, { useEffect, useRef, useState } from 'react';
import { Code, Columns, AlignLeft, Sparkles, Wand, SortAsc, Minimize, Indent, AlignJustify } from 'lucide-react'; // Import new icons
import * as monaco from 'monaco-editor';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
import prettier from 'prettier/standalone';
import parserBabel from 'prettier/parser-babel';
import parserHtml from 'prettier/parser-html';
import parserCss from 'prettier/parser-postcss';
import parserMarkdown from 'prettier/parser-markdown';
import parserYaml from 'prettier/parser-yaml';
import parserTypescript from 'prettier/parser-typescript';
import * as yaml from 'js-yaml'; // Import js-yaml
import './App.css';

// Configure Monaco Environment
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
      const { default: EditorWorker } = await import('monaco-editor/esm/vs/editor/editor.worker?worker');
      return new EditorWorker();
    },
  };
}

// Define custom diff theme
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

// Enhanced beautifier class with multiple formatter support
class CodeBeautifier {
  constructor() {
    // Prettier-supported languages
    this.prettierLanguages = {
      javascript: { parser: 'babel', plugins: [parserBabel] },
      typescript: { parser: 'typescript', plugins: [parserTypescript] },
      tsx: { parser: 'typescript', plugins: [parserTypescript] },
      html: { parser: 'html', plugins: [parserHtml] },
      xml: { parser: 'html', plugins: [parserHtml] },
      css: { parser: 'css', plugins: [parserCss] },
      scss: { parser: 'css', plugins: [parserCss] },  // ← both scss/less
      less: { parser: 'css', plugins: [parserCss] },
      markdown: { parser: 'markdown', plugins: [parserMarkdown] },
      yaml: { parser: 'yaml', plugins: [parserYaml] },
      yml: { parser: 'yaml', plugins: [parserYaml] },
    };

    // Default Prettier configuration - will be updated dynamically
    this.prettierConfig = {
      printWidth: 80,
      semi: true,
      singleQuote: true,
      quoteProps: 'as-needed',
      trailingComma: 'es5',
      bracketSpacing: true,
      bracketSameLine: false,
      arrowParens: 'avoid',
      endOfLine: 'lf'
    };

    // Languages that need custom formatters
    this.customFormatters = {
      'json': this.formatJson.bind(this),
      'python': this.formatPython.bind(this),
      'java': this.formatJava.bind(this),
      'c': this.formatC.bind(this),
      'cpp': this.formatCpp.bind(this),
      'csharp': this.formatCSharp.bind(this),
      'php': this.formatPhp.bind(this),
      'go': this.formatGo.bind(this),
      'rust': this.formatRust.bind(this),
      'ruby': this.formatRuby.bind(this),
      'sql': this.formatSql.bind(this),
      'kotlin': this.formatKotlin.bind(this)
    };
  }

  // Check if a language is supported for beautification
  isBeautifiable(language) {
    const normalizedLang = language?.toLowerCase();
    return this.prettierLanguages.hasOwnProperty(normalizedLang) ||
      this.customFormatters.hasOwnProperty(normalizedLang);
  }

  // Get all supported languages
  getSupportedLanguages() {
    return [...Object.keys(this.prettierLanguages), ...Object.keys(this.customFormatters)];
  }

  // Main beautify function
  async beautify(code, language, indentationOptions = {}) {
    if (!code || typeof code !== 'string') {
      throw new Error('Invalid code input');
    }

    const normalizedLang = language?.toLowerCase();

    if (!this.isBeautifiable(normalizedLang)) {
      throw new Error(`Language '${language}' is not supported for beautification`);
    }

    try {
      // Use custom formatter if available
      if (this.customFormatters[normalizedLang]) {
        // Pass indentationSize to custom formatters if they support it
        return await this.customFormatters[normalizedLang](code, { indentSize: indentationSize });
      }

      // Use Prettier for supported languages
      if (this.prettierLanguages[normalizedLang]) {
        const config = this.prettierLanguages[normalizedLang];
        const formatted = await prettier.format(code, {
          ...this.prettierConfig,
          parser: config.parser,
          plugins: config.plugins,
          tabWidth: indentationSize, // Apply dynamic indentation size
          useTabs: useTabs // Apply dynamic useTabs
        });
        return formatted;
      }

      throw new Error(`No formatter available for ${language}`);
    } catch (error) {
      console.error(`Beautification failed for ${language}:`, error);
      throw new Error(`Failed to beautify ${language}: ${error.message}`);
    }
  }

  // JSON formatter
  formatJson(code, options = {}) {
    const { indentSize = 2 } = options; // Default to 2 if not provided
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed, null, indentSize); // Use dynamic indentSize
    } catch (error) {
      const lines = code.split('\n');
      let formattedLines = [];
      let allLinesParsed = true;

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.length === 0) {
          formattedLines.push('');
          continue;
        }
        try {
          const parsedLine = JSON.parse(trimmedLine);
          formattedLines.push(JSON.stringify(parsedLine, null, indentSize)); // Use dynamic indentSize
        } catch {
          formattedLines.push(line);
          allLinesParsed = false;
        }
      }

      if (allLinesParsed && formattedLines.some(l => l !== '')) {
        return formattedLines.join('\n');
      } else {
        throw new Error(`Invalid JSON: ${error.message}`);
      }
    }
  }

  // Python formatter (basic indentation and spacing)
  formatPython(code, options = {}) {
    const { indentSize = 4 } = options; // Default to 4 if not provided
    const lines = code.split('\n');
    let indentLevel = 0;
    let formatted = [];
    let inString = false;
    let stringChar = '';

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        formatted.push('');
        continue;
      }

      for (let char of trimmed) {
        if ((char === '"' || char === "'") && !inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar && inString) {
          inString = false;
          stringChar = '';
        }
      }

      if (inString) {
        formatted.push(line);
        continue;
      }

      if (/^(except|elif|else|finally|case)/.test(trimmed) ||
        trimmed === 'else:' || trimmed === 'finally:') {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmed; // Use dynamic indentSize
      formatted.push(indentedLine);

      if (trimmed.endsWith(':') &&
        !/^#/.test(trimmed) &&
        !trimmed.includes('"""') &&
        !trimmed.includes("'''")) {
        indentLevel++;
      }
    }
    return formatted.join('\n');
  }

  // Java formatter (basic)
  formatJava(code, options) {
    return this.formatCStyleLanguage(code, {
      keywords: ['public', 'private', 'protected', 'static', 'final', 'class', 'interface', 'enum'],
      ...options
    });
  }

  // C formatter
  formatC(code, options) {
    return this.formatCStyleLanguage(code, {
      keywords: ['int', 'char', 'float', 'double', 'void', 'struct', 'typedef'],
      ...options
    });
  }

  // C++ formatter
  formatCpp(code, options) {
    return this.formatCStyleLanguage(code, {
      keywords: ['int', 'char', 'float', 'double', 'void', 'class', 'struct', 'namespace'],
      ...options
    });
  }

  // C# formatter
  formatCSharp(code, options) {
    return this.formatCStyleLanguage(code, {
      keywords: ['public', 'private', 'protected', 'static', 'class', 'interface', 'namespace'],
      ...options
    });
  }

  // Generic C-style language formatter
  formatCStyleLanguage(code, options = {}) {
    const { indentSize = 4 } = options;
    const lines = code.split('\n');
    let indentLevel = 0;
    let formatted = [];

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        formatted.push('');
        continue;
      }

      // Decrease indent for closing braces
      if (trimmed.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      // Add proper indentation
      const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmed;
      formatted.push(indentedLine);

      // Increase indent after opening braces
      if (trimmed.endsWith('{')) {
        indentLevel++;
      }
    }

    return formatted.join('\n');
  }

  // PHP formatter
  formatPhp(code, options) {
    return this.formatCStyleLanguage(code, {
      keywords: ['function', 'class', 'interface', 'trait', 'namespace'],
      ...options
    });
  }

  // Go formatter (basic)
  formatGo(code, options) {
    return this.formatCStyleLanguage(code, {
      keywords: ['func', 'type', 'struct', 'interface', 'package'],
      ...options
    });
  }

  // Rust formatter (basic)
  formatRust(code, options) {
    return this.formatCStyleLanguage(code, {
      keywords: ['fn', 'struct', 'enum', 'impl', 'trait', 'mod'],
      ...options
    });
  }

  // Ruby formatter (basic)
  formatRuby(code, options = {}) {
    const { indentSize = 2 } = options;
    const lines = code.split('\n');
    let indentLevel = 0;
    let formatted = [];

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        formatted.push('');
        continue;
      }

      // Decrease indent for end keywords
      if (/^end\b/.test(trimmed)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      // Add proper indentation
      const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmed;
      formatted.push(indentedLine);

      // Increase indent after certain keywords
      if (/^(def|class|module|if|unless|while|until|for|begin|case)\b/.test(trimmed) ||
        /\bdo\b/.test(trimmed)) {
        indentLevel++;
      }
    }

    return formatted.join('\n');
  }

  // SQL formatter (basic)
  formatSql(code) {
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING',
      'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP',
      'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN'
    ];

    let formatted = code.toUpperCase();

    // Add line breaks before major keywords
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      formatted = formatted.replace(regex, `\n${keyword}`);
    });

    // Clean up extra whitespace and format
    const lines = formatted.split('\n').map(line => line.trim()).filter(line => line);
    return lines.join('\n');
  }

  // Kotlin formatter (basic)
  formatKotlin(code, options) {
    return this.formatCStyleLanguage(code, {
      keywords: ['fun', 'class', 'interface', 'object', 'package'],
      ...options
    });
  }

  // JSON utility methods
  compactJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  }

  sortJson(jsonString, options = {}) {
    const { indentSize = 2 } = options;
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
      return JSON.stringify(sorted, null, indentSize); // Use dynamic indentSize
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  }

  // Conversion methods
  convertJsonToYaml(jsonString) {
    try {
      const obj = JSON.parse(jsonString);
      return yaml.dump(obj);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  }

  convertYamlToJson(yamlString) {
    try {
      const obj = yaml.load(yamlString);
      return JSON.stringify(obj, null, 2);
    } catch (error) {
      throw new Error(`Invalid YAML: ${error.message}`);
    }
  }
}

export default function App() {
  const containerRef = useRef(null);
  const diffEditorRef = useRef(null);
  const beautifierRef = useRef(new CodeBeautifier());

  const [originalLanguage, setOriginalLanguage] = useState('plaintext');
  const [modifiedLanguage, setModifiedLanguage] = useState('plaintext');
  const [originalStats, setOriginalStats] = useState({ lines: 0, characters: 0 });
  const [modifiedStats, setModifiedStats] = useState({ lines: 0, characters: 0 });
  const [isSideBySide, setIsSideBySide] = useState(true);
  const [isBeautifying, setIsBeautifying] = useState({ original: false, modified: false });

  // Helper functions
  const calculateStats = code => ({
    lines: code ? code.split('\n').length : 0,
    characters: code ? code.length : 0
  });

  const detectLanguage = code => {
    if (!code || code.trim() === "") return "plaintext";
    const t = code.trim();
    if (!t) return 'plaintext';
    if (t.startsWith('#!')) return 'bash';
    try {
      // JSON detection: Try to parse as JSON first
      const parsedJson = JSON.parse(code);
      return 'json';
    } catch (jsonError) {
      // If not valid JSON, try to parse as YAML
      try {
        const parsedYaml = yaml.load(code);
        // A simple heuristic for YAML: check if it's an object/array and not just a single scalar
        if (typeof parsedYaml === 'object' && parsedYaml !== null && Object.keys(parsedYaml).length > 0) {
          return 'yaml';
        }
        if (Array.isArray(parsedYaml) && parsedYaml.length > 0) {
          return 'yaml';
        }
      } catch (yamlError) {
        // Not JSON or YAML, continue with other detections
      }
    }
    if (/^\s*import\s+React\s+/.test(t) || (/<\w+/.test(t) && t.includes(';'))) return 'javascript';
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
    if (/^\s*#\s+/.test(t) || /^\[.*\]\(.*\)/.test(t)) return 'markdown';
    // YAML check is now earlier using js-yaml
    return 'plaintext';
  };

  // Enhanced beautification handlers
  const handleBeautifyOriginal = async () => {
    if (!diffEditorRef.current) return;

    setIsBeautifying(prev => ({ ...prev, original: true }));

    try {
      const model = diffEditorRef.current.getOriginalEditor().getModel();
      // if Monaco ever reports 'jsx', force it back to 'javascript'
      const language = model.getLanguageId() === 'jsx'
        ? 'javascript'
        : model.getLanguageId();

      const code = model.getValue();

      if (beautifierRef.current.isBeautifiable(language)) {
        const beautified = await beautifierRef.current.beautify(code, language, { indentationSize, useTabs });
        model.setValue(beautified);
      } else {
        console.warn(`Beautification not supported for ${language}`);
      }
    } catch (error) {
      console.error('Beautification failed:', error);
      // You could show a toast notification here
    } finally {
      setIsBeautifying(prev => ({ ...prev, original: false }));
    }
  };

  const handleBeautifyModified = async () => {
    if (!diffEditorRef.current) return;

    setIsBeautifying(prev => ({ ...prev, modified: true }));

    try {
      const model = diffEditorRef.current.getModifiedEditor().getModel();
      const language = model.getLanguageId() === 'jsx' ? 'javascript' : model.getLanguageId();

      const code = model.getValue();

      if (beautifierRef.current.isBeautifiable(language)) {
        const beautified = await beautifierRef.current.beautify(code, language, { indentationSize, useTabs });
        model.setValue(beautified);
      } else {
        console.warn(`Beautification not supported for ${language}`);
      }
    } catch (error) {
      console.error('Beautification failed:', error);
    } finally {
      setIsBeautifying(prev => ({ ...prev, modified: false }));
    }
  };

  // JSON utility handlers
  const handleSortOriginal = async () => {
    if (diffEditorRef.current && originalLanguage === 'json') {
      try {
        const model = diffEditorRef.current.getOriginalEditor().getModel();
        const sorted = beautifierRef.current.sortJson(model.getValue(), { indentationSize });
        model.setValue(sorted);
      } catch (error) {
        console.error('JSON sorting failed:', error);
      }
    }
  };

  const handleCompactOriginal = async () => {
    if (diffEditorRef.current && originalLanguage === 'json') {
      try {
        const model = diffEditorRef.current.getOriginalEditor().getModel();
        const compacted = beautifierRef.current.compactJson(model.getValue());
        model.setValue(compacted);
      } catch (error) {
        console.error('JSON compacting failed:', error);
      }
    }
  };

  // Conversion handlers
  const handleConvertOriginalToYaml = async () => {
    if (diffEditorRef.current && originalLanguage === 'json') {
      try {
        const model = diffEditorRef.current.getOriginalEditor().getModel();
        const yamlContent = beautifierRef.current.convertJsonToYaml(model.getValue());
        model.setValue(yamlContent);
        monaco.editor.setModelLanguage(model, 'yaml'); // Change language to YAML
      } catch (error) {
        console.error('JSON to YAML conversion failed:', error);
      }
    }
  };

  const handleConvertOriginalToJson = async () => {
    if (diffEditorRef.current && originalLanguage === 'yaml') {
      try {
        const model = diffEditorRef.current.getOriginalEditor().getModel();
        const jsonContent = beautifierRef.current.convertYamlToJson(model.getValue());
        model.setValue(jsonContent);
        monaco.editor.setModelLanguage(model, 'json'); // Change language to JSON
      } catch (error) {
        console.error('YAML to JSON conversion failed:', error);
      }
    }
  };


  const handleSortModified = async () => {
    if (diffEditorRef.current && modifiedLanguage === 'json') {
      try {
        const model = diffEditorRef.current.getModifiedEditor().getModel();
        const sorted = beautifierRef.current.sortJson(model.getValue(), { indentationSize });
        model.setValue(sorted);
      } catch (error) {
        console.error('JSON sorting failed:', error);
      }
    }
  };

  const handleCompactModified = async () => {
    if (diffEditorRef.current && modifiedLanguage === 'json') {
      try {
        const model = diffEditorRef.current.getModifiedEditor().getModel();
        const compacted = beautifierRef.current.compactJson(model.getValue());
        model.setValue(compacted);
      } catch (error) {
        console.error('JSON compacting failed:', error);
      }
    }
  };

  const handleConvertModifiedToYaml = async () => {
    if (diffEditorRef.current && modifiedLanguage === 'json') {
      try {
        const model = diffEditorRef.current.getModifiedEditor().getModel();
        const yamlContent = beautifierRef.current.convertJsonToYaml(model.getValue());
        model.setValue(yamlContent);
        monaco.editor.setModelLanguage(model, 'yaml'); // Change language to YAML
      } catch (error) {
        console.error('JSON to YAML conversion failed:', error);
      }
    }
  };

  const handleConvertModifiedToJson = async () => {
    if (diffEditorRef.current && modifiedLanguage === 'yaml') {
      try {
        const model = diffEditorRef.current.getModifiedEditor().getModel();
        const jsonContent = beautifierRef.current.convertYamlToJson(model.getValue());
        model.setValue(jsonContent);
        monaco.editor.setModelLanguage(model, 'json'); // Change language to JSON
      } catch (error) {
        console.error('YAML to JSON conversion failed:', error);
      }
    }
  };

  // Check if a language is beautifiable
  const isLanguageBeautifiable = (language) => {
    return beautifierRef.current.isBeautifiable(language);
  };

  useEffect(() => {
    if (!containerRef.current || diffEditorRef.current) return;

    diffEditorRef.current = monaco.editor.createDiffEditor(containerRef.current, {
      theme: 'airbnb-dark-diff',
      automaticLayout: true,
      renderSideBySide: isSideBySide,
      enableSplitViewResizing: false,
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
      lineNumbersMinChars: 3,
      originalEditable: true,
      readOnly: false
    });

    const originalModel = monaco.editor.createModel('', originalLanguage);
    const modifiedModel = monaco.editor.createModel('', modifiedLanguage);
    diffEditorRef.current.setModel({ original: originalModel, modified: modifiedModel });

    // Update handlers
    const updateOriginal = () => {
      const val = originalModel.getValue();
      const stats = calculateStats(val);
      const lang = detectLanguage(val);

      setOriginalStats(stats);
      setOriginalLanguage(lang);

      if (originalModel.getLanguageId() !== lang) {
        monaco.editor.setModelLanguage(originalModel, lang);
      }
    };

    const updateModified = () => {
      const val = modifiedModel.getValue();
      const stats = calculateStats(val);
      const lang = detectLanguage(val);

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
              <span className="language-indicator">{originalLanguage}</span>
            )}
            {isLanguageBeautifiable(originalLanguage) && (
              <button
                className="beautify-btn"
                onClick={handleBeautifyOriginal}
                title={`Beautify ${originalLanguage}`}
              >
                <Sparkles size={12} />
                Beautify
              </button>
            )}
            {originalLanguage === 'json' && (
              <>
                <button
                  className="beautify-btn"
                  onClick={handleSortOriginal}
                  title="Sort JSON"
                >
                  <SortAsc size={12} /> Sort
                </button>
                <button
                  className="beautify-btn"
                  onClick={handleCompactOriginal}
                  title="Minify JSON"
                >
                  <Minimize size={12} /> Minify
                </button>
                <button
                  className="beautify-btn convert-btn"
                  onClick={handleConvertOriginalToYaml}
                  title="Convert JSON to YAML"
                >
                  <Wand size={12} /> JSON to YAML
                </button>
              </>
            )}
            {originalLanguage === 'yaml' && (
              <>
                <button
                  className="beautify-btn convert-btn"
                  onClick={handleConvertOriginalToJson}
                  title="Convert YAML to JSON"
                >
                  <Wand size={12} /> YAML to JSON
                </button>
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
            {isLanguageBeautifiable(modifiedLanguage) && (
              <button
                className={`beautify-btn ${isBeautifying.modified ? 'beautifying' : ''}`}
                onClick={handleBeautifyModified}
                disabled={isBeautifying.modified}
                title={`Beautify ${modifiedLanguage}`}
              >
                {isBeautifying.modified ? (
                  <>
                    <Sparkles size={12} className="spinning" />
                    Beautifying...
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    Beautify
                  </>
                )}
              </button>
            )}
            {modifiedLanguage === 'json' && (
              <>
                <button
                  className="beautify-btn"
                  onClick={handleSortModified}
                  title="Sort JSON"
                >
                  <SortAsc size={12} /> Sort
                </button>
                <button
                  className="beautify-btn"
                  onClick={handleCompactModified}
                  title="Minify JSON"
                >
                  <Minimize size={12} /> Minify
                </button>
                <button
                  className="beautify-btn convert-btn"
                  onClick={handleConvertModifiedToYaml}
                  title="Convert JSON to YAML"
                >
                  <Wand size={12} /> JSON to YAML
                </button>
              </>
            )}
            {modifiedLanguage === 'yaml' && (
              <>
                <button
                  className="beautify-btn convert-btn"
                  onClick={handleConvertModifiedToJson}
                  title="Convert YAML to JSON"
                >
                  <Wand size={12} /> YAML to JSON
                </button>
              </>
            )}
            {modifiedLanguage !== 'plaintext' && (
              <span className="language-indicator">{modifiedLanguage}</span>
            )}
            {modifiedStats.lines} lines, {modifiedStats.characters} characters
          </div>
        </div>
      </div>
    </div>
  );
}