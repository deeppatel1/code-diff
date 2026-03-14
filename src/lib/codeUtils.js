import * as prettier from 'prettier/standalone';
import * as parserBabel from 'prettier/parser-babel';
import * as parserHtml from 'prettier/parser-html';
import * as parserCss from 'prettier/parser-postcss';
import * as parserMarkdown from 'prettier/parser-markdown';
import * as parserYaml from 'prettier/parser-yaml';
import * as parserTypescript from 'prettier/parser-typescript';
import * as pluginEstree from 'prettier/plugins/estree';
import * as yaml from 'js-yaml';

export class CodeBeautifier {
  constructor() {
    this.prettierLanguages = {
      javascript: { parser: 'babel', plugins: [parserBabel, pluginEstree] },
      typescript: { parser: 'typescript', plugins: [parserTypescript, pluginEstree] },
      tsx: { parser: 'typescript', plugins: [parserTypescript, pluginEstree] },
      xml: { parser: 'html', plugins: [parserHtml] },
      css: { parser: 'css', plugins: [parserCss] },
      scss: { parser: 'css', plugins: [parserCss] },
      less: { parser: 'css', plugins: [parserCss] },
      markdown: { parser: 'markdown', plugins: [parserMarkdown] },
      yaml: { parser: 'yaml', plugins: [parserYaml] },
      yml: { parser: 'yaml', plugins: [parserYaml] }
    };

    this.prettierConfig = {
      printWidth: 80,
      semi: true,
      singleQuote: true,
      quoteProps: 'as-needed',
      trailingComma: 'es5',
      bracketSpacing: true,
      bracketSameLine: false,
      arrowParens: 'avoid',
      endOfLine: 'lf',
      tabWidth: 4,
      useTabs: false
    };

    this.customFormatters = {
      html: this.formatHtml.bind(this),
      json: this.formatJson.bind(this),
      python: this.formatPython.bind(this),
      java: this.formatJava.bind(this),
      c: this.formatC.bind(this),
      cpp: this.formatCpp.bind(this),
      csharp: this.formatCSharp.bind(this),
      php: this.formatPhp.bind(this),
      go: this.formatGo.bind(this),
      rust: this.formatRust.bind(this),
      ruby: this.formatRuby.bind(this),
      sql: this.formatSql.bind(this),
      kotlin: this.formatKotlin.bind(this)
    };
  }

  isBeautifiable(language) {
    if (!language) return false;
    const normalizedLang = language.toLowerCase();
    return Object.prototype.hasOwnProperty.call(this.prettierLanguages, normalizedLang) ||
      Object.prototype.hasOwnProperty.call(this.customFormatters, normalizedLang);
  }

  getSupportedLanguages() {
    return [...new Set([
      ...Object.keys(this.prettierLanguages),
      ...Object.keys(this.customFormatters)
    ])];
  }

  async beautify(code, language, indentationOptions = {}) {
    if (!code || typeof code !== 'string') {
      throw new Error('Invalid code input');
    }

    const normalizedLang = language?.toLowerCase();

    if (!this.isBeautifiable(normalizedLang)) {
      throw new Error(`Language '${language}' is not supported for beautification`);
    }

    const {
      indentationSize = this.prettierConfig.tabWidth,
      useTabs = this.prettierConfig.useTabs
    } = indentationOptions;

    try {
      if (this.customFormatters[normalizedLang]) {
        return await this.customFormatters[normalizedLang](code, { indentSize: indentationSize });
      }

      if (this.prettierLanguages[normalizedLang]) {
        const config = this.prettierLanguages[normalizedLang];
        const formatted = await prettier.format(code, {
          ...this.prettierConfig,
          parser: config.parser,
          plugins: config.plugins,
          tabWidth: indentationSize,
          useTabs
        });
        return formatted;
      }

      throw new Error(`No formatter available for ${language}`);
    } catch (error) {
      console.error(`Beautification failed for ${language}:`, error);
      throw new Error(`Failed to beautify ${language}: ${error.message}`);
    }
  }

  formatJson(code, options = {}) {
    const { indentSize = 2 } = options;
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed, null, indentSize);
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
          formattedLines.push(JSON.stringify(parsedLine, null, indentSize));
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

  async formatHtml(code, options = {}) {
    const { indentSize = 4 } = options;
    try {
      return await prettier.format(code, {
        ...this.prettierConfig,
        parser: 'html',
        plugins: [parserHtml],
        tabWidth: indentSize,
      });
    } catch {
      // Fallback: simple tag-based indentation
      const lines = code.replace(/>\s*</g, '>\n<').split('\n');
      let indent = 0;
      const result = [];
      const pad = () => ' '.repeat(indent * indentSize);
      const voidTags = /^<(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)\b/i;
      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        if (line.startsWith('</')) indent = Math.max(0, indent - 1);
        result.push(pad() + line);
        if (line.startsWith('<') && !line.startsWith('</') && !line.startsWith('<!') && !voidTags.test(line) && !line.endsWith('/>') && /<\/\w+>\s*$/.test(line) === false) {
          indent++;
        }
      }
      return result.join('\n');
    }
  }

  formatPython(code, options = {}) {
    const { indentSize = 4 } = options;
    const lines = code.split('\n');

    // Detect if code already has indentation structure
    const hasExistingIndent = lines.some(l => /^\s+\S/.test(l));

    if (hasExistingIndent) {
      // Normalize existing indentation using a stack to track indent levels.
      // This handles mixed tabs/spaces and inconsistent indent widths.
      const levelStack = [0]; // stack of indent widths seen so far
      return lines.map(line => {
        if (!line.trim()) return '';
        const rawWidth = (line.match(/^(\s*)/)[1]).replace(/\t/g, '    ').length;
        const top = levelStack[levelStack.length - 1];
        if (rawWidth > top) {
          // Indent increased — push new level
          levelStack.push(rawWidth);
        } else if (rawWidth < top) {
          // Indent decreased — pop back to matching or nearest level
          while (levelStack.length > 1 && levelStack[levelStack.length - 1] > rawWidth) {
            levelStack.pop();
          }
        }
        const level = levelStack.length - 1;
        return ' '.repeat(level * indentSize) + line.trim();
      }).join('\n');
    }

    // Flat code (no indentation at all): use keyword heuristics with an indent stack.
    // Track block openers (lines ending with ':') and their indent levels so that
    // sibling defs/classes inside a parent block are indented correctly.
    const formatted = [];
    const blockStack = []; // stack of { level, keyword } for open blocks

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        formatted.push('');
        continue;
      }

      const currentLevel = blockStack.length > 0 ? blockStack[blockStack.length - 1].level + 1 : 0;

      // Dedent for block continuations (else/elif/except/finally at same level as their if/try/for)
      if (/^(elif\b|else:|else\b|except\b|except:|finally:)/.test(trimmed)) {
        if (blockStack.length > 0) {
          const level = blockStack[blockStack.length - 1].level;
          formatted.push(' '.repeat(level * indentSize) + trimmed);
          // If this continuation itself opens a block, update the stack entry
          if (trimmed.endsWith(':')) {
            blockStack[blockStack.length - 1] = { level, keyword: trimmed.split(/\s/)[0] };
          }
          continue;
        }
      }

      // For def/class: pop back to the parent block level if this is a sibling
      // (i.e., another def inside the same class, or another class at top level)
      if (/^(def |class )/.test(trimmed) && blockStack.length > 0) {
        const kw = trimmed.startsWith('def') ? 'def' : 'class';
        // Pop child blocks to find the parent that would contain this def/class as a sibling
        while (blockStack.length > 0) {
          const top = blockStack[blockStack.length - 1];
          // If the top of stack is a def/class at a sibling level, pop it (this replaces it)
          // If the top is a class and we're a def, we're its child — don't pop
          if (top.keyword === kw) {
            blockStack.pop(); // sibling — pop so we're at the same level
            break;
          } else if (top.keyword === 'class' && kw === 'def') {
            break; // def inside class — don't pop
          } else if (top.keyword === 'def' && kw === 'def') {
            blockStack.pop();
            break;
          } else {
            // Pop intermediate blocks (if, for, while, etc.)
            blockStack.pop();
          }
        }
      }

      const level = blockStack.length > 0 ? blockStack[blockStack.length - 1].level + 1 : 0;
      formatted.push(' '.repeat(level * indentSize) + trimmed);

      // Push block opener
      if (trimmed.endsWith(':') && !/^#/.test(trimmed) &&
        !trimmed.includes('"""') && !trimmed.includes("'''")) {
        const kw = trimmed.split(/[\s(]/)[0];
        blockStack.push({ level, keyword: kw });
      }
    }
    return formatted.join('\n');
  }

  formatJava(code, options) {
    return this.formatCStyleLanguage(code, {
      keywords: ['public', 'private', 'protected', 'static', 'final', 'class', 'interface', 'enum'],
      ...options
    });
  }

  formatC(code, options) {
    return this.formatCStyleLanguage(code, {
      keywords: ['int', 'char', 'float', 'double', 'void', 'struct', 'typedef'],
      ...options
    });
  }

  formatCpp(code, options) {
    return this.formatCStyleLanguage(code, {
      keywords: ['int', 'char', 'float', 'double', 'void', 'class', 'struct', 'namespace'],
      ...options
    });
  }

  formatCSharp(code, options) {
    return this.formatCStyleLanguage(code, {
      keywords: ['public', 'private', 'protected', 'static', 'class', 'interface', 'namespace'],
      ...options
    });
  }

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

      if (trimmed.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmed;
      formatted.push(indentedLine);

      if (trimmed.endsWith('{')) {
        indentLevel++;
      }
    }

    return formatted.join('\n');
  }

  formatPhp(code, options) {
    return this.formatCStyleLanguage(code, {
      keywords: ['function', 'class', 'interface', 'trait', 'namespace'],
      ...options
    });
  }

  formatGo(code, options) {
    return this.formatCStyleLanguage(code, {
      keywords: ['func', 'type', 'struct', 'interface', 'package'],
      ...options
    });
  }

  formatRust(code, options) {
    return this.formatCStyleLanguage(code, {
      keywords: ['fn', 'struct', 'enum', 'impl', 'trait', 'mod'],
      ...options
    });
  }

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

      if (/^end\b/.test(trimmed)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmed;
      formatted.push(indentedLine);

      if (/^(def|class|module|if|unless|while|until|for|begin|case)\b/.test(trimmed) ||
        /\bdo\b/.test(trimmed)) {
        indentLevel++;
      }
    }

    return formatted.join('\n');
  }

  formatSql(code) {
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING',
      'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP',
      'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN'
    ];

    let formatted = code.toUpperCase();

    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      formatted = formatted.replace(regex, `\n${keyword}`);
    });

    const lines = formatted.split('\n').map(line => line.trim()).filter(line => line);
    return lines.join('\n');
  }

  formatKotlin(code, options) {
    return this.formatCStyleLanguage(code, {
      keywords: ['fun', 'class', 'interface', 'object', 'package'],
      ...options
    });
  }

  compactJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  }

  sortJson(jsonString, options = {}) {
    const { indentationSize = 2 } = options;
    try {
      const parsed = JSON.parse(jsonString);
      const sortObject = obj => {
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
      return JSON.stringify(sorted, null, indentationSize);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  }

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

export const calculateStats = code => {
  if (!code) {
    return { lines: 0, characters: 0, words: 0 };
  }
  const lines = code.split('\n').length;
  const characters = code.length;
  const trimmed = code.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  return { lines, characters, words };
};

export const detectLanguage = code => {
  if (!code || code.trim() === '') return 'plaintext';
  const t = code.trim();
  if (t.startsWith('#!')) return 'bash';
  try {
    JSON.parse(code);
    return 'json';
  } catch {
    // not JSON
  }
  // Markdown (strong signals): code fences/images alone, or 2+ signals together,
  // are reliable enough to check before JS/HTML/TS — prevents markdown with
  // embedded code samples from being misdetected as JavaScript.
  {
    const md = [
      /^#{1,6}\s+/m.test(t),                         // headings
      /\[.+\]\(.+\)/.test(t),                        // inline link
      /^(\*\*|__).+\1/m.test(t),                     // bold at line start
      /(^|\n)>\s+/.test(t) && /\n/.test(t),           // blockquote (multi-line)
      /(^|\n)```/.test(t),                            // code fence
      /!\[.*\]\(.*\)/.test(t)                         // image
    ];
    const count = md.filter(Boolean).length;
    if (md[4] || md[5] || count >= 2) return 'markdown';
  }
  if (/^\s*<!doctype\s+html/i.test(t) || /^\s*<html[\s>]/i.test(t)) return 'html';
  if (/^\s*import\s+React\s+/.test(t) || (/^\s*<\w+[\s>]/m.test(t) && /^\s*(import|export|const|let|var|function)\s/m.test(t))) return 'javascript';
  if (t.startsWith('<') && t.endsWith('>')) return 'html';
  if (/^\s*(interface|type|enum)\s+\w+/.test(t) || (t.includes('import ') && t.includes(' from ') && t.includes(';'))) return 'typescript';
  if (/^\s*import\s.+from/.test(t) || /^\s*(const|let|var)\s/.test(t) || /^\s*(function\s|function\()/.test(t)) return 'javascript';
  // Markdown (weak signals): single heading/bold/blockquote is enough after ruling out code languages
  if (
    /^#{1,6}\s+/m.test(t) ||                       // headings anywhere (multiline)
    /^(\*\*|__).+\1/m.test(t) ||                   // bold at line start
    (/(^|\n)>\s+/.test(t) && /\n/.test(t))          // blockquote (multi-line)
  ) return 'markdown';
  // CSV: 2+ lines, consistent comma-delimited columns (>= 2)
  const csvLines = t.split('\n').filter(l => l.trim().length > 0);
  if (csvLines.length >= 2) {
    const counts = csvLines.slice(0, 10).map(l => l.split(',').length);
    if (counts[0] >= 2 && counts.every(c => c === counts[0])) return 'csv';
  }
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
  try {
    const parsedYaml = yaml.load(code);
    if (
      typeof parsedYaml === 'object' &&
      parsedYaml !== null &&
      Object.keys(parsedYaml).length > 0
    ) {
      return 'yaml';
    }
    if (Array.isArray(parsedYaml) && parsedYaml.length > 0) {
      return 'yaml';
    }
  } catch {
    // fall through
  }
  return 'plaintext';
};
