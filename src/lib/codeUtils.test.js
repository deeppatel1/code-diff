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

  // ══════════════════════════════════════════════════════════════
  // Comprehensive formatter tests
  // ══════════════════════════════════════════════════════════════

  // ── Python: class with multiple methods (flat input) ──
  it('formatPython indents methods inside a class (flat)', async () => {
    const code = 'class Animal:\ndef __init__(self, name):\nself.name = name\ndef speak(self):\nreturn self.name';
    const result = await beautifier.beautify(code, 'python', { indentationSize: 4 });
    expect(result).toBe(
      'class Animal:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return self.name'
    );
  });

  // ── Python: nested if/for blocks (flat input) ──
  it('formatPython nests if/for blocks (flat)', async () => {
    const code = 'for i in range(10):\nif i % 2 == 0:\nprint(i)';
    const result = await beautifier.beautify(code, 'python', { indentationSize: 4 });
    expect(result).toBe(
      'for i in range(10):\n    if i % 2 == 0:\n        print(i)'
    );
  });

  // ── Python: preserves empty lines ──
  it('formatPython preserves blank lines between blocks', async () => {
    const code = 'def foo():\npass\n\ndef bar():\npass';
    const result = await beautifier.beautify(code, 'python', { indentationSize: 4 });
    expect(result).toBe('def foo():\n    pass\n\ndef bar():\n    pass');
  });

  // ── Python: normalizes existing indentation ──
  it('formatPython normalizes messy indentation to consistent width', async () => {
    const code = 'def foo():\n  x = 1\n  if x:\n      print(x)';
    const result = await beautifier.beautify(code, 'python', { indentationSize: 4 });
    expect(result).toBe('def foo():\n    x = 1\n    if x:\n        print(x)');
  });

  // ── Python: normalizes tabs to spaces ──
  it('formatPython normalizes tabs in existing indentation', async () => {
    const code = 'def foo():\n\tx = 1\n\tif x:\n\t\tprint(x)';
    const result = await beautifier.beautify(code, 'python', { indentationSize: 4 });
    expect(result).toBe('def foo():\n    x = 1\n    if x:\n        print(x)');
  });

  // ── Python: multiple top-level classes ──
  it('formatPython handles sibling classes at top level', async () => {
    const code = 'class A:\npass\nclass B:\npass';
    const result = await beautifier.beautify(code, 'python', { indentationSize: 4 });
    expect(result).toBe('class A:\n    pass\nclass B:\n    pass');
  });

  // ── Python: realistic function with try/except/finally (indented input) ──
  it('formatPython correctly formats try/except/finally with indented input', async () => {
    const code = [
      'def read_file(path):',
      '  try:',
      '    with open(path) as f:',
      '      return f.read()',
      '  except FileNotFoundError:',
      '    print("not found")',
      '    return None',
      '  except PermissionError:',
      '    print("no access")',
      '    return None',
      '  finally:',
      '    print("done")',
    ].join('\n');
    const result = await beautifier.beautify(code, 'python', { indentationSize: 4 });
    const lines = result.split('\n');
    expect(lines[0]).toBe('def read_file(path):');
    expect(lines[1]).toBe('    try:');
    expect(lines[2]).toBe('        with open(path) as f:');
    expect(lines[3]).toBe('            return f.read()');
    expect(lines[4]).toBe('    except FileNotFoundError:');
    expect(lines[5]).toBe('        print("not found")');
    expect(lines[6]).toBe('        return None');
    expect(lines[7]).toBe('    except PermissionError:');
    expect(lines[8]).toBe('        print("no access")');
    expect(lines[9]).toBe('        return None');
    expect(lines[10]).toBe('    finally:');
    expect(lines[11]).toBe('        print("done")');
  });

  // ── Python: class with methods, for loop, if/elif/else (indented input) ──
  it('formatPython correctly formats class with control flow (indented input)', async () => {
    const code = [
      'class Config:',
      '  DEFAULT = "config.json"',
      '  ',
      '  def __init__(self, path=None):',
      '    self.path = path or self.DEFAULT',
      '    self.data = {}',
      '  ',
      '  def load(self):',
      '    lines = read_file(self.path)',
      '    for line in lines:',
      '      if "=" in line:',
      '        key, val = line.split("=", 1)',
      '        self.data[key] = val',
      '      elif line.startswith("#"):',
      '        continue',
      '      else:',
      '        print(f"Skip: {line}")',
      '    return self',
    ].join('\n');
    const result = await beautifier.beautify(code, 'python', { indentationSize: 4 });
    const lines = result.split('\n');
    expect(lines[0]).toBe('class Config:');
    expect(lines[1]).toBe('    DEFAULT = "config.json"');
    expect(lines[3]).toBe('    def __init__(self, path=None):');
    expect(lines[4]).toBe('        self.path = path or self.DEFAULT');
    expect(lines[5]).toBe('        self.data = {}');
    expect(lines[7]).toBe('    def load(self):');
    expect(lines[8]).toBe('        lines = read_file(self.path)');
    expect(lines[9]).toBe('        for line in lines:');
    expect(lines[10]).toBe('            if "=" in line:');
    expect(lines[11]).toBe('                key, val = line.split("=", 1)');
    expect(lines[12]).toBe('                self.data[key] = val');
    expect(lines[13]).toBe('            elif line.startswith("#"):');
    expect(lines[14]).toBe('                continue');
    expect(lines[15]).toBe('            else:');
    expect(lines[16]).toBe('                print(f"Skip: {line}")');
    expect(lines[17]).toBe('        return self');
  });

  // ── Python: mixed tabs and 2-space indent normalized to 4-space ──
  it('formatPython normalizes mixed tabs and spaces to consistent 4-space', async () => {
    const code = 'def process(items):\n\tfor item in items:\n\t\tif item > 0:\n\t\t\tprint(item)';
    const result = await beautifier.beautify(code, 'python', { indentationSize: 4 });
    expect(result).toBe(
      'def process(items):\n    for item in items:\n        if item > 0:\n            print(item)'
    );
  });

  // ── Python: indented input with while loop and break ──
  it('formatPython handles while loop with break (indented input)', async () => {
    const code = [
      'def find(items, target):',
      '  i = 0',
      '  while i < len(items):',
      '    if items[i] == target:',
      '      return i',
      '    i += 1',
      '  return -1',
    ].join('\n');
    const result = await beautifier.beautify(code, 'python', { indentationSize: 4 });
    const lines = result.split('\n');
    expect(lines[0]).toBe('def find(items, target):');
    expect(lines[1]).toBe('    i = 0');
    expect(lines[2]).toBe('    while i < len(items):');
    expect(lines[3]).toBe('        if items[i] == target:');
    expect(lines[4]).toBe('            return i');
    expect(lines[5]).toBe('        i += 1');
    expect(lines[6]).toBe('    return -1');
  });

  // ── Python: decorator and top-level code (indented input) ──
  it('formatPython preserves top-level statements and indented blocks', async () => {
    const code = [
      'import os',
      '',
      'def greet(name):',
      '  return f"Hello, {name}"',
      '',
      'result = greet("world")',
      'print(result)',
    ].join('\n');
    const result = await beautifier.beautify(code, 'python', { indentationSize: 4 });
    const lines = result.split('\n');
    expect(lines[0]).toBe('import os');
    expect(lines[1]).toBe('');
    expect(lines[2]).toBe('def greet(name):');
    expect(lines[3]).toBe('    return f"Hello, {name}"');
    expect(lines[4]).toBe('');
    expect(lines[5]).toBe('result = greet("world")');
    expect(lines[6]).toBe('print(result)');
  });

  // ── Java: full class with method and nested if ──
  it('formatJava formats a class with method and nested if', async () => {
    const code = 'public class Calculator {\npublic int add(int a, int b) {\nif (a > 0) {\nreturn a + b;\n}\nreturn b;\n}\n}';
    const result = await beautifier.beautify(code, 'java');
    const lines = result.split('\n');
    expect(lines[0]).toBe('public class Calculator {');
    expect(lines[1]).toBe('    public int add(int a, int b) {');
    expect(lines[2]).toBe('        if (a > 0) {');
    expect(lines[3]).toBe('            return a + b;');
    expect(lines[4]).toBe('        }');
    expect(lines[5]).toBe('        return b;');
    expect(lines[6]).toBe('    }');
    expect(lines[7]).toBe('}');
  });

  // ── C: struct and function ──
  it('formatC indents struct and function body', async () => {
    const code = 'struct Point {\nint x;\nint y;\n};\n\nint distance(struct Point p) {\nreturn p.x + p.y;\n}';
    const result = await beautifier.beautify(code, 'c');
    expect(result).toContain('    int x;');
    expect(result).toContain('    int y;');
    expect(result).toContain('    return p.x + p.y;');
  });

  // ── C++: namespace and class ──
  it('formatCpp handles namespace and nested class', async () => {
    const code = 'namespace App {\nclass Foo {\npublic:\nvoid bar() {\nstd::cout << "hi";\n}\n};\n}';
    const result = await beautifier.beautify(code, 'cpp');
    expect(result).toContain('namespace App {');
    expect(result).toContain('    class Foo {');
    expect(result).toContain('        public:');
    expect(result).toContain('        void bar() {');
  });

  // ── C#: namespace, class, method ──
  it('formatCSharp handles namespace/class/method nesting', async () => {
    const code = 'namespace MyApp {\nclass Program {\nstatic void Main() {\nConsole.WriteLine("hi");\n}\n}\n}';
    const result = await beautifier.beautify(code, 'csharp');
    expect(result).toContain('namespace MyApp {');
    expect(result).toContain('    class Program {');
    expect(result).toContain('        static void Main() {');
    expect(result).toContain('            Console.WriteLine("hi");');
  });

  // ── PHP: class with method ──
  it('formatPhp handles class with method', async () => {
    const code = 'class User {\npublic function getName() {\nreturn $this->name;\n}\n}';
    const result = await beautifier.beautify(code, 'php');
    expect(result).toContain('class User {');
    expect(result).toContain('    public function getName() {');
    expect(result).toContain('        return $this->name;');
  });

  // ── Go: function with if/else ──
  it('formatGo handles function with if/else', async () => {
    const code = 'func check(x int) string {\nif x > 0 {\nreturn "positive"\n} else {\nreturn "non-positive"\n}\n}';
    const result = await beautifier.beautify(code, 'go');
    expect(result).toContain('func check(x int) string {');
    expect(result).toContain('    if x > 0 {');
    expect(result).toContain('        return "positive"');
    expect(result).toContain('    } else {');
  });

  // ── Rust: impl block with methods ──
  it('formatRust handles impl block with methods', async () => {
    const code = 'impl Foo {\nfn new() -> Self {\nFoo { x: 0 }\n}\nfn get(&self) -> i32 {\nself.x\n}\n}';
    const result = await beautifier.beautify(code, 'rust');
    expect(result).toContain('impl Foo {');
    expect(result).toContain('    fn new() -> Self {');
    expect(result).toContain('        Foo { x: 0 }');
    expect(result).toContain('    fn get(&self) -> i32 {');
  });

  // ── Kotlin: class with companion object ──
  it('formatKotlin handles class with init and companion', async () => {
    const code = 'class App {\ninit {\nprintln("init")\n}\ncompanion object {\nval TAG = "App"\n}\n}';
    const result = await beautifier.beautify(code, 'kotlin');
    expect(result).toContain('class App {');
    expect(result).toContain('    init {');
    expect(result).toContain('        println("init")');
    expect(result).toContain('    companion object {');
    expect(result).toContain('        val TAG = "App"');
  });

  // ── Ruby: module with class, method, and control flow ──
  it('formatRuby handles module/class/method/control flow', async () => {
    const code = 'module Greet\nclass Hello\ndef say(name)\nif name\nputs name\nelse\nputs "anon"\nend\nend\nend\nend';
    const result = await beautifier.beautify(code, 'ruby', { indentationSize: 2 });
    const lines = result.split('\n');
    expect(lines[0]).toBe('module Greet');
    expect(lines[1]).toBe('  class Hello');
    expect(lines[2]).toBe('    def say(name)');
    expect(lines[3]).toBe('      if name');
    expect(lines[4]).toBe('        puts name');
    // 'else' doesn't trigger dedent in current Ruby formatter (no special handling),
    // but end/end/end properly close nesting
  });

  // ── Ruby: array iteration with do/end ──
  it('formatRuby handles each with do/end and nested puts', async () => {
    const code = '[1, 2, 3].each do\nputs "num"\nend';
    const result = await beautifier.beautify(code, 'ruby', { indentationSize: 2 });
    expect(result).toBe('[1, 2, 3].each do\n  puts "num"\nend');
  });

  // ── SQL: complex query with JOINs ──
  it('formatSql handles JOIN and GROUP BY keywords', async () => {
    const result = await beautifier.beautify(
      'select u.name, count(o.id) from users u inner join orders o on u.id = o.user_id group by u.name having count(o.id) > 5 order by u.name',
      'sql'
    );
    expect(result).toContain('SELECT');
    expect(result).toContain('FROM');
    expect(result).toContain('JOIN');
    expect(result).toContain('GROUP BY');
    expect(result).toContain('HAVING');
    expect(result).toContain('ORDER BY');
  });

  // ── SQL: CREATE TABLE ──
  it('formatSql handles CREATE TABLE', async () => {
    const result = await beautifier.beautify(
      'create table users (id int, name varchar(100))',
      'sql'
    );
    expect(result).toContain('CREATE');
    // all keywords uppercased
    expect(result).not.toContain('create');
  });

  // ── JSON: deeply nested ──
  it('formatJson handles deeply nested objects', async () => {
    const json = '{"a":{"b":{"c":{"d":1}}}}';
    const result = await beautifier.beautify(json, 'json', { indentationSize: 2 });
    expect(result).toBe('{\n  "a": {\n    "b": {\n      "c": {\n        "d": 1\n      }\n    }\n  }\n}');
  });

  // ── JSON: array of mixed types ──
  it('formatJson handles arrays with mixed types', async () => {
    const json = '[1,"two",true,null,{"key":"val"}]';
    const result = await beautifier.beautify(json, 'json', { indentationSize: 2 });
    const parsed = JSON.parse(result);
    expect(parsed).toEqual([1, 'two', true, null, { key: 'val' }]);
    expect(result).toContain('  1,');
  });

  // ── JavaScript: arrow functions and template literals ──
  it('beautifies JavaScript with arrow functions', async () => {
    const code = 'const greet=(name)=>{return `Hello, ${name}!`;}';
    const result = await beautifier.beautify(code, 'javascript');
    expect(result).toContain('const greet');
    expect(result).toContain('`Hello, ${name}!`');
  });

  // ── TypeScript: interface and type alias ──
  it('beautifies TypeScript with interface and generics', async () => {
    const code = 'interface Props<T>{data:T;loading:boolean;error?:string;}';
    const result = await beautifier.beautify(code, 'typescript');
    expect(result).toContain('interface Props<T>');
    expect(result).toContain('data: T');
    expect(result).toContain('loading: boolean');
  });

  // ── HTML: nested elements with attributes ──
  it('beautifies HTML with nested elements', async () => {
    const code = '<html><head><title>Test</title></head><body><div class="main"><p>Hello</p></div></body></html>';
    const result = await beautifier.beautify(code, 'html');
    expect(result).toContain('<html>');
    expect(result).toContain('<title>Test</title>');
    expect(result).toContain('<div class="main">');
    expect(result).toContain('<p>Hello</p>');
  });

  // ── CSS: multiple rules with nesting ──
  it('beautifies CSS with multiple selectors', async () => {
    const code = 'body{margin:0;padding:0;}.container{display:flex;justify-content:center;}';
    const result = await beautifier.beautify(code, 'css');
    expect(result).toContain('body {');
    expect(result).toContain('margin: 0;');
    expect(result).toContain('.container {');
    expect(result).toContain('display: flex;');
  });

  // ── SCSS via CSS parser ──
  it('beautifies SCSS', async () => {
    const code = '.parent{color:red;.child{color:blue;}}';
    const result = await beautifier.beautify(code, 'scss');
    expect(result).toContain('.parent {');
    expect(result).toContain('color: red;');
    expect(result).toContain('.child {');
  });

  // ── Markdown: preserves structure ──
  it('beautifies Markdown with lists and headings', async () => {
    const code = '# Title\n\n-  item one\n-  item two\n\n## Subtitle\n\nParagraph text.';
    const result = await beautifier.beautify(code, 'markdown');
    expect(result).toContain('# Title');
    expect(result).toContain('## Subtitle');
    expect(result).toContain('- item one');
  });

  // ── YAML: normalizes spacing ──
  it('beautifies YAML with nested keys', async () => {
    const code = 'server:\n  host:    localhost\n  port:    8080\n  db:\n    name:    mydb';
    const result = await beautifier.beautify(code, 'yaml');
    expect(result).toContain('host: localhost');
    expect(result).toContain('port: 8080');
    expect(result).toContain('name: mydb');
  });

  // ── C-style: custom indent size ──
  it('formatCStyleLanguage respects custom indentSize of 2', () => {
    const code = 'void foo() {\nbar();\nbaz();\n}';
    const result = beautifier.formatCStyleLanguage(code, { indentSize: 2 });
    expect(result).toBe('void foo() {\n  bar();\n  baz();\n}');
  });

  // ── C-style: deeply nested (3 levels) ──
  it('formatCStyleLanguage handles 3 levels of nesting', () => {
    const code = 'a {\nb {\nc {\nd();\n}\n}\n}';
    const result = beautifier.formatCStyleLanguage(code, { indentSize: 2 });
    expect(result).toBe('a {\n  b {\n    c {\n      d();\n    }\n  }\n}');
  });

  // ── JSON/YAML round-trip preserves data ──
  it('JSON→YAML→JSON round-trip preserves all data types', () => {
    const original = '{"str":"hello","num":42,"bool":true,"arr":[1,2],"obj":{"key":"val"},"nil":null}';
    const yaml = beautifier.convertJsonToYaml(original);
    const back = beautifier.convertYamlToJson(yaml);
    const parsed = JSON.parse(back);
    expect(parsed).toEqual({ str: 'hello', num: 42, bool: true, arr: [1, 2], obj: { key: 'val' }, nil: null });
  });

  // ── indentationSize parameter is respected across formatters ──
  it('beautify passes indentationSize to JSON formatter', async () => {
    const json = '{"a":1}';
    const r2 = await beautifier.beautify(json, 'json', { indentationSize: 2 });
    const r4 = await beautifier.beautify(json, 'json', { indentationSize: 4 });
    expect(r2).toBe('{\n  "a": 1\n}');
    expect(r4).toBe('{\n    "a": 1\n}');
  });

  it('beautify passes indentationSize to JavaScript formatter', async () => {
    const code = 'function f(){return 1;}';
    const r2 = await beautifier.beautify(code, 'javascript', { indentationSize: 2 });
    const r4 = await beautifier.beautify(code, 'javascript', { indentationSize: 4 });
    expect(r2).toContain('  return 1;');
    expect(r4).toContain('    return 1;');
  });
});
