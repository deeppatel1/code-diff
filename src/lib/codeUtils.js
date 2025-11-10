import prettier from 'prettier/standalone';
import parserBabel from 'prettier/parser-babel';
import parserHtml from 'prettier/parser-html';
import parserCss from 'prettier/parser-postcss';
import parserMarkdown from 'prettier/parser-markdown';
import parserYaml from 'prettier/parser-yaml';
import parserTypescript from 'prettier/parser-typescript';
import pluginEstree from 'prettier/plugins/estree';
import * as yaml from 'js-yaml';

export class CodeBeautifier {
  constructor() {
    this.prettierLanguages = {
      javascript: { parser: 'babel', plugins: [parserBabel, pluginEstree] },
      typescript: { parser: 'typescript', plugins: [parserTypescript, pluginEstree] },
      tsx: { parser: 'typescript', plugins: [parserTypescript, pluginEstree] },
      html: { parser: 'html', plugins: [parserHtml] },
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

  formatPython(code, options = {}) {
    const { indentSize = 4 } = options;
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

      const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmed;
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
    const { indentSize = 2 } = options;
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
      return JSON.stringify(sorted, null, indentSize);
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
