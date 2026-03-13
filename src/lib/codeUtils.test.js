import { describe, it, expect, beforeEach } from 'vitest';
import { CodeBeautifier, calculateStats, detectLanguage } from './codeUtils';

// ── calculateStats ──────────────────────────────────────────────
describe('calculateStats', () => {
  it('counts lines and characters for populated text', () => {
    expect(calculateStats('hello\nworld')).toEqual({ lines: 2, characters: 11, words: 2 });
  });

  it('returns zeros for empty input', () => {
    expect(calculateStats('')).toEqual({ lines: 0, characters: 0, words: 0 });
  });

  it('returns zeros for null input', () => {
    expect(calculateStats(null)).toEqual({ lines: 0, characters: 0, words: 0 });
  });

  it('returns zeros for undefined input', () => {
    expect(calculateStats(undefined)).toEqual({ lines: 0, characters: 0, words: 0 });
  });

  it('returns 0 words for whitespace-only string', () => {
    const stats = calculateStats('   \n   ');
    expect(stats.words).toBe(0);
    expect(stats.lines).toBe(2);
    expect(stats.characters).toBe(7);
  });

  it('counts trailing newline as an extra line', () => {
    expect(calculateStats('a\nb\n').lines).toBe(3);
  });
});

// ── detectLanguage ──────────────────────────────────────────────
describe('detectLanguage', () => {
  it('detects JSON', () => {
    expect(detectLanguage('{"name":"codex"}')).toBe('json');
  });

  it('detects YAML', () => {
    expect(detectLanguage('apiVersion: v1\nkind: Service\nmetadata:\n  name: demo')).toBe('yaml');
  });

  it('detects HTML', () => {
    expect(detectLanguage('<div>Hello</div>')).toBe('html');
  });

  it('detects Python', () => {
    expect(detectLanguage('def greet():\n  return "hi"')).toBe('python');
  });

  it('defaults to plaintext for empty string', () => {
    expect(detectLanguage('')).toBe('plaintext');
  });

  it('detects bash from shebang', () => {
    expect(detectLanguage('#!/bin/bash\necho hello')).toBe('bash');
  });

  it('detects TypeScript', () => {
    expect(detectLanguage('interface Foo {\n  bar: string;\n}')).toBe('typescript');
  });

  it('detects CSS', () => {
    expect(detectLanguage('body { color: red; }')).toBe('css');
  });

  it('detects Go', () => {
    expect(detectLanguage('package main\n\nfunc main() {')).toBe('go');
  });

  it('detects PHP', () => {
    expect(detectLanguage('<?php\necho "hello";')).toBe('php');
  });

  it('detects Ruby', () => {
    expect(detectLanguage('class Foo\n  def bar\n  end\nend')).toBe('ruby');
  });

  it('detects Rust', () => {
    expect(detectLanguage('fn main() {\n  println!("hello");\n}')).toBe('rust');
  });

  it('detects Kotlin', () => {
    expect(detectLanguage('fun main() {\n  println("hello")\n}')).toBe('kotlin');
  });

  it('detects C++', () => {
    expect(detectLanguage('#include <iostream>\nint main() {')).toBe('cpp');
  });

  it('detects C', () => {
    expect(detectLanguage('#include <stdio.h>\nint main(')).toBe('c');
  });

  it('detects Java', () => {
    expect(detectLanguage('public class Foo {\n}')).toBe('java');
  });

  it('detects C#', () => {
    expect(detectLanguage('using System;\nnamespace App {')).toBe('csharp');
  });

  it('detects SQL', () => {
    expect(detectLanguage('SELECT * FROM users')).toBe('sql');
  });

  it('detects Markdown', () => {
    expect(detectLanguage('# Heading\n[link](url)')).toBe('markdown');
  });

  it('detects Markdown with embedded code fences', () => {
    const md = '# Heading\n\nSome text\n\n```javascript\nfunction foo() {}\nexport default foo;\n```\n\n## Another heading';
    expect(detectLanguage(md)).toBe('markdown');
  });

  it('detects Markdown with embedded HTML and JS code blocks', () => {
    const md = '# Title\n\n```html\n<div>hello</div>\n```\n\n```js\nconst x = 1;\nexport default x;\n```';
    expect(detectLanguage(md)).toBe('markdown');
  });

  it('detects Markdown from code fence alone', () => {
    expect(detectLanguage('Some text\n\n```\ncode here\n```\n\nMore text')).toBe('markdown');
  });

  it('detects Markdown from image syntax alone', () => {
    expect(detectLanguage('Here is an image:\n![alt text](https://example.com/img.png)')).toBe('markdown');
  });

  it('does not misdetect JS with array indexing as Markdown', () => {
    expect(detectLanguage('const result = [1, 2, 3].map(fn)')).toBe('javascript');
  });

  it('detects simple heading-only Markdown after ruling out code', () => {
    expect(detectLanguage('# Hello World\n\nThis is a paragraph of text.')).toBe('markdown');
  });

  it('returns plaintext for null', () => {
    expect(detectLanguage(null)).toBe('plaintext');
  });

  it('returns plaintext for undefined', () => {
    expect(detectLanguage(undefined)).toBe('plaintext');
  });

  it('detects JavaScript from import React pattern', () => {
    expect(detectLanguage('import React from "react";\nfunction App() {}')).toBe('javascript');
  });

  it('detects JavaScript from const/let patterns', () => {
    expect(detectLanguage('const x = 42')).toBe('javascript');
    expect(detectLanguage('let y = "hello"')).toBe('javascript');
  });

  it('detects YAML array content', () => {
    expect(detectLanguage('- item1\n- item2\n- item3')).toBe('yaml');
  });
});

// ── CodeBeautifier ──────────────────────────────────────────────
describe('CodeBeautifier', () => {
  let beautifier;

  beforeEach(() => {
    beautifier = new CodeBeautifier();
  });

  // ── isBeautifiable ──
  describe('isBeautifiable', () => {
    it('returns false for null', () => {
      expect(beautifier.isBeautifiable(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(beautifier.isBeautifiable(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(beautifier.isBeautifiable('')).toBe(false);
    });

    it('returns false for unknown language', () => {
      expect(beautifier.isBeautifiable('brainfuck')).toBe(false);
    });

    it('returns true case-insensitive', () => {
      expect(beautifier.isBeautifiable('JavaScript')).toBe(true);
      expect(beautifier.isBeautifiable('JSON')).toBe(true);
      expect(beautifier.isBeautifiable('Python')).toBe(true);
    });
  });

  // ── getSupportedLanguages ──
  it('lists both prettier and custom formatter languages', () => {
    const supported = beautifier.getSupportedLanguages();
    expect(supported).toContain('javascript');
    expect(supported).toContain('json');
    expect(supported).toContain('python');
    expect(supported).toContain('ruby');
  });

  // ── beautify error cases ──
  it('throws for null code', async () => {
    await expect(beautifier.beautify(null, 'javascript')).rejects.toThrow('Invalid code input');
  });

  it('throws for empty string code', async () => {
    await expect(beautifier.beautify('', 'javascript')).rejects.toThrow('Invalid code input');
  });

  it('throws for unsupported language', async () => {
    await expect(beautifier.beautify('plain text', 'ini')).rejects.toThrow(/not supported/);
  });

  // ── Prettier-based: JavaScript ──
  it('beautifies JavaScript', async () => {
    const result = await beautifier.beautify('function add(a,b){return a+b;}', 'javascript');
    expect(result).toBe('function add(a, b) {\n    return a + b;\n}\n');
  });

  // ── Prettier-based: HTML ──
  it('beautifies HTML', async () => {
    const result = await beautifier.beautify('<div><span>hello</span></div>', 'html');
    expect(result).toContain('<div>');
    expect(result).toContain('<span>');
  });

  // ── Prettier-based: CSS ──
  it('beautifies CSS', async () => {
    const result = await beautifier.beautify('body{color:red;}', 'css');
    expect(result).toContain('body');
    expect(result).toContain('color: red');
  });

  // ── Prettier-based: Markdown ──
  it('beautifies Markdown', async () => {
    const result = await beautifier.beautify('# Hello\n\nworld', 'markdown');
    expect(result).toContain('# Hello');
  });

  // ── JSON ──
  it('beautifies JSON', async () => {
    const result = await beautifier.beautify('{"b":2,"a":1}', 'json', { indentationSize: 4 });
    expect(result).toBe('{\n    "b": 2,\n    "a": 1\n}');
  });

  // ── formatCStyleLanguage: nested braces ──
  it('formats C-style language with nested braces', () => {
    const code = 'void foo() {\nif (x) {\nbar();\n}\n}';
    const result = beautifier.formatCStyleLanguage(code, { indentSize: 2 });
    expect(result).toBe('void foo() {\n  if (x) {\n    bar();\n  }\n}');
  });

  // ── C-style formatters (one test each) ──
  it('formatJava handles braces', async () => {
    const result = await beautifier.beautify('public class Foo {\nvoid bar() {\n}\n}', 'java');
    expect(result).toContain('public class Foo {');
    expect(result).toContain('    void bar() {');
  });

  it('formatC handles braces', async () => {
    const result = await beautifier.beautify('int main() {\nreturn 0;\n}', 'c');
    expect(result).toContain('    return 0;');
  });

  it('formatCpp handles braces', async () => {
    const result = await beautifier.beautify('int main() {\nreturn 0;\n}', 'cpp');
    expect(result).toContain('    return 0;');
  });

  it('formatCSharp handles braces', async () => {
    const result = await beautifier.beautify('class Foo {\nvoid Bar() {\n}\n}', 'csharp');
    expect(result).toContain('    void Bar() {');
  });

  it('formatPhp handles braces', async () => {
    const result = await beautifier.beautify('function foo() {\necho "hi";\n}', 'php');
    expect(result).toContain('    echo "hi";');
  });

  it('formatGo handles braces', async () => {
    const result = await beautifier.beautify('func main() {\nfmt.Println("hi")\n}', 'go');
    expect(result).toContain('    fmt.Println("hi")');
  });

  it('formatRust handles braces', async () => {
    const result = await beautifier.beautify('fn main() {\nprintln!("hi");\n}', 'rust');
    expect(result).toContain('    println!("hi");');
  });

  it('formatKotlin handles braces', async () => {
    const result = await beautifier.beautify('fun main() {\nprintln("hi")\n}', 'kotlin');
    expect(result).toContain('    println("hi")');
  });

  // ── Ruby ──
  it('formatRuby handles def/end, class/end, do/end', async () => {
    const code = 'class Foo\ndef bar\nputs "hi"\nend\nend';
    const result = await beautifier.beautify(code, 'ruby', { indentationSize: 2 });
    expect(result).toBe('class Foo\n  def bar\n    puts "hi"\n  end\nend');
  });

  // ── SQL ──
  it('formatSql uppercases keywords and inserts newlines', async () => {
    const result = await beautifier.beautify('select * from users where id = 1', 'sql');
    expect(result).toContain('SELECT');
    expect(result).toContain('FROM');
    expect(result).toContain('WHERE');
  });

  // ── Python: dedent keywords ──
  it('formatPython handles elif, else, except, finally', async () => {
    const code = 'if True:\nprint("a")\nelif False:\nprint("b")\nelse:\nprint("c")';
    const result = await beautifier.beautify(code, 'python', { indentationSize: 2 });
    expect(result).toContain('if True:');
    expect(result).toContain('  print("a")');
    expect(result).toContain('elif False:');
    expect(result).toContain('  print("b")');
    expect(result).toContain('else:');
    expect(result).toContain('  print("c")');
  });

  // ── JSON utilities ──
  it('compactJson with invalid JSON throws', () => {
    expect(() => beautifier.compactJson('not json')).toThrow(/Invalid JSON/);
  });

  it('sortJson with invalid JSON throws', () => {
    expect(() => beautifier.sortJson('not json')).toThrow(/Invalid JSON/);
  });

  it('convertJsonToYaml with invalid JSON throws', () => {
    expect(() => beautifier.convertJsonToYaml('not json')).toThrow(/Invalid JSON/);
  });

  it('convertYamlToJson with invalid YAML throws', () => {
    expect(() => beautifier.convertYamlToJson(':\n  :\n  : [')).toThrow(/Invalid YAML/);
  });

  it('compacts JSON', () => {
    const json = '{\n  "z": 1,\n  "a": {"c": 2, "b": 1}\n}';
    expect(beautifier.compactJson(json)).toBe('{"z":1,"a":{"c":2,"b":1}}');
  });

  it('sortJson uses indentationSize param', () => {
    const json = '{"b":2,"a":1}';
    const result4 = beautifier.sortJson(json, { indentationSize: 4 });
    expect(result4).toBe('{\n    "a": 1,\n    "b": 2\n}');
    const result2 = beautifier.sortJson(json, { indentationSize: 2 });
    expect(result2).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });

  it('sortJson sorts nested objects recursively', () => {
    const json = '{"z": 1, "a": {"c": 2, "b": 1}}';
    expect(beautifier.sortJson(json, { indentationSize: 2 })).toBe('{\n  "a": {\n    "b": 1,\n    "c": 2\n  },\n  "z": 1\n}');
  });

  it('converts between JSON and YAML', () => {
    const json = '{"name":"codex","features":["diff","format"]}';
    const yamlOutput = beautifier.convertJsonToYaml(json);
    expect(yamlOutput).toContain('name: codex');
    const roundTrip = beautifier.convertYamlToJson(yamlOutput);
    expect(roundTrip).toBe('{\n  "name": "codex",\n  "features": [\n    "diff",\n    "format"\n  ]\n}');
  });

  // ── sortJson edge cases ──
  it('sortJson preserves arrays of objects (not sorted internally)', () => {
    const json = '{"items": [{"z": 1}, {"a": 2}]}';
    const result = beautifier.sortJson(json, { indentationSize: 2 });
    const parsed = JSON.parse(result);
    expect(parsed.items[0].z).toBe(1);
    expect(parsed.items[1].a).toBe(2);
  });

  it('sortJson preserves null values in objects', () => {
    const json = '{"b": null, "a": 1}';
    const result = beautifier.sortJson(json, { indentationSize: 2 });
    expect(result).toBe('{\n  "a": 1,\n  "b": null\n}');
  });

  it('sortJson handles empty object and empty array', () => {
    expect(beautifier.sortJson('{}', { indentationSize: 2 })).toBe('{}');
    expect(beautifier.sortJson('[]', { indentationSize: 2 })).toBe('[]');
  });

  // ── formatJson NDJSON edge cases ──
  it('formatJson handles NDJSON with empty lines between entries', async () => {
    const ndjson = '{"a":1}\n\n{"b":2}';
    const result = await beautifier.beautify(ndjson, 'json', { indentationSize: 2 });
    expect(result).toContain('"a": 1');
    expect(result).toContain('"b": 2');
  });

  it('formatJson with partially invalid NDJSON throws', async () => {
    const ndjson = '{"a":1}\nnot json\n{"b":2}';
    await expect(beautifier.beautify(ndjson, 'json')).rejects.toThrow(/Invalid JSON/);
  });

  // ── formatJson NDJSON fallback ──
  it('formatJson handles newline-delimited JSON', async () => {
    const ndjson = '{"a":1}\n{"b":2}';
    const result = await beautifier.beautify(ndjson, 'json', { indentationSize: 2 });
    expect(result).toContain('"a": 1');
    expect(result).toContain('"b": 2');
  });

  // ── Prettier-based: TypeScript ──
  it('beautifies TypeScript', async () => {
    const result = await beautifier.beautify('const x:number=1;', 'typescript');
    expect(result).toContain('const x: number = 1');
  });

  // ── Prettier-based: YAML ──
  it('beautifies YAML', async () => {
    const result = await beautifier.beautify('a:   1\nb:    2', 'yaml');
    expect(result).toContain('a: 1');
    expect(result).toContain('b: 2');
  });

  // ── formatCStyleLanguage with empty lines ──
  it('formatCStyleLanguage preserves empty lines', () => {
    const code = 'void foo() {\n\nbar();\n}';
    const result = beautifier.formatCStyleLanguage(code, { indentSize: 2 });
    expect(result).toBe('void foo() {\n\n  bar();\n}');
  });

  // ── formatRuby additional keywords ──
  it('formatRuby handles if/unless/while/begin/case keywords', async () => {
    const code = 'if true\nputs "a"\nend\nunless false\nputs "b"\nend\nwhile cond\nloop\nend\nbegin\nrescue\nend\ncase x\nwhen 1\nend';
    const result = await beautifier.beautify(code, 'ruby', { indentationSize: 2 });
    expect(result).toContain('if true');
    expect(result).toContain('  puts "a"');
    expect(result).toContain('unless false');
    expect(result).toContain('  puts "b"');
    expect(result).toContain('while cond');
    expect(result).toContain('  loop');
    expect(result).toContain('begin');
    expect(result).toContain('case x');
  });

  // ── formatCStyleLanguage edge cases ──
  it('formatCStyleLanguage handles multiple consecutive closing braces', () => {
    const code = 'void foo() {\nif (x) {\nbar();\n}\n}';
    const result = beautifier.formatCStyleLanguage(code, { indentSize: 2 });
    expect(result).toBe('void foo() {\n  if (x) {\n    bar();\n  }\n}');
  });

  it('formatCStyleLanguage does not go negative on leading closing brace', () => {
    const code = '}\nfoo();';
    const result = beautifier.formatCStyleLanguage(code, { indentSize: 2 });
    expect(result).toBe('}\nfoo();');
  });

  // ── formatRuby with do/end ──
  it('formatRuby handles do/end blocks', async () => {
    const code = 'items.each do\nputs item\nend';
    const result = await beautifier.beautify(code, 'ruby', { indentationSize: 2 });
    expect(result).toBe('items.each do\n  puts item\nend');
  });

  // ── formatPython with escaped quotes ──
  it('formatPython handles escaped quotes in strings', async () => {
    const code = 'x = "hello \\"world\\""\nif True:\nprint(x)';
    const result = await beautifier.beautify(code, 'python', { indentationSize: 2 });
    expect(result).toContain('x = "hello \\"world\\""');
    expect(result).toContain('if True:');
    expect(result).toContain('  print(x)');
  });

  // ── formatPython with except/finally ──
  it('formatPython handles try/except/finally', async () => {
    const code = 'try:\ndo_thing()\nexcept:\nhandle()\nfinally:\ncleanup()';
    const result = await beautifier.beautify(code, 'python', { indentationSize: 2 });
    expect(result).toContain('try:');
    expect(result).toContain('  do_thing()');
    expect(result).toContain('except:');
    expect(result).toContain('  handle()');
    expect(result).toContain('finally:');
    expect(result).toContain('  cleanup()');
  });
});
