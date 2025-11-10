import { describe, it, expect, beforeEach } from 'vitest';
import { CodeBeautifier, calculateStats, detectLanguage } from './codeUtils';

describe('calculateStats', () => {
  it('counts lines and characters for populated text', () => {
    const stats = calculateStats('hello\nworld');
    expect(stats).toEqual({ lines: 2, characters: 11, words: 2 });
  });

  it('returns zeros for empty input', () => {
    expect(calculateStats('')).toEqual({ lines: 0, characters: 0, words: 0 });
  });
});

describe('detectLanguage', () => {
  it('detects JSON first when content is valid JSON', () => {
    expect(detectLanguage('{"name":"codex"}')).toBe('json');
  });

  it('falls back to YAML when JSON parsing fails but YAML succeeds', () => {
    const yamlSnippet = 'apiVersion: v1\nkind: Service\nmetadata:\n  name: demo';
    expect(detectLanguage(yamlSnippet)).toBe('yaml');
  });

  it('identifies HTML and Python based on structural hints', () => {
    expect(detectLanguage('<div>Hello</div>')).toBe('html');
    expect(detectLanguage('def greet():\n  return "hi"')).toBe('python');
  });

  it('defaults to plaintext when nothing matches', () => {
    expect(detectLanguage('')).toBe('plaintext');
  });
});

describe('CodeBeautifier', () => {
  let beautifier;

  beforeEach(() => {
    beautifier = new CodeBeautifier();
  });

  it('lists both prettier and custom formatter languages', () => {
    const supported = beautifier.getSupportedLanguages();
    expect(supported).toContain('javascript');
    expect(supported).toContain('json');
  });

  it('beautifies JavaScript using the default 4-space indentation', async () => {
    const ugly = 'function add(a,b){return a+b;}';
    const result = await beautifier.beautify(ugly, 'javascript');
    expect(result).toBe('function add(a, b) {\n    return a + b;\n}\n');
  });

  it('beautifies JSON using the custom formatter and indent options', async () => {
    const messy = '{"b":2,"a":1}';
    const result = await beautifier.beautify(messy, 'json', { indentationSize: 4 });
    expect(result).toBe('{\n    "b": 2,\n    "a": 1\n}');
  });

  it('keeps per-row widths consistent between beautified copies', async () => {
    const input = '{\n  "nested": {"value": 1, "list": [1,2]}\n}';
    const options = { indentationSize: 2 };
    const first = await beautifier.beautify(input, 'json', options);
    const second = await beautifier.beautify(input, 'json', options);
    const lineWidths = text => text.split('\n').map(line => line.length);
    expect(lineWidths(first)).toEqual(lineWidths(second));
  });

  it('formats python-like code with block awareness', async () => {
    const python = 'def greet():\nprint("hi")\nif True:\nprint("ok")';
    const result = await beautifier.beautify(python, 'python', { indentationSize: 2 });
    expect(result).toBe('def greet():\n  print("hi")\n  if True:\n    print("ok")');
  });

  it('compacts and sorts JSON through helper utilities', () => {
    const json = '{\n  "z": 1,\n  "a": {"c": 2, "b": 1}\n}';
    expect(beautifier.compactJson(json)).toBe('{"z":1,"a":{"c":2,"b":1}}');
    expect(beautifier.sortJson(json, { indentSize: 2 })).toBe('{\n  "a": {\n    "b": 1,\n    "c": 2\n  },\n  "z": 1\n}');
  });

  it('converts between JSON and YAML without altering structure', () => {
    const json = '{"name":"codex","features":["diff","format"]}';
    const yamlOutput = beautifier.convertJsonToYaml(json);
    expect(yamlOutput).toContain('name: codex');
    expect(yamlOutput).toContain('- diff');

    const roundTripJson = beautifier.convertYamlToJson(yamlOutput);
    expect(roundTripJson).toBe('{\n  "name": "codex",\n  "features": [\n    "diff",\n    "format"\n  ]\n}');
  });

  it('throws an explicit error for unsupported languages', async () => {
    await expect(beautifier.beautify('plain text', 'ini')).rejects.toThrow(/not supported/);
  });
});
