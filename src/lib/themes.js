import * as monaco from 'monaco-editor';

monaco.editor.defineTheme('airbnb-dark-diff', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '79c0ff' },
    { token: 'string.value.json', foreground: '56d364' },
    { token: 'string.json', foreground: '56d364' },
    { token: 'number.json', foreground: 'ffa657' },
    { token: 'keyword.json', foreground: 'f85149' },
    { token: 'operator.json', foreground: '8b949e' },
    { token: 'delimiter.bracket.json', foreground: '8b949e' }
  ],
  colors: {
    'editor.background': '#0d1117',
    'editor.foreground': '#c9d1d9',
    'editor.selectionBackground': '#4a5568',
    'editor.selectionHighlightBackground': '#3a4555',
    'editor.inactiveSelectionBackground': '#3a4555',
    'editor.selectionForeground': '#ffffff',
    'diffEditorGutter.removedLineBackground': '#3a1e22',
    'diffEditor.removedTextBackground': '#ca1815b0',
    'diffEditorGutter.insertedLineBackground': '#15372a',
    'diffEditor.insertedTextBackground': '#2ea043b0',
    'diffEditor.border': '#30363d',
  }
});

monaco.editor.defineTheme('airbnb-light-diff', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '005cc5' },
    { token: 'string.value.json', foreground: '116329' },
    { token: 'string.json', foreground: '116329' },
    { token: 'number.json', foreground: '6f42c1' },
    { token: 'keyword.json', foreground: 'd73a49' },
    { token: 'operator.json', foreground: '6e7781' },
    { token: 'delimiter.bracket.json', foreground: '6e7781' },
    { token: 'keyword', foreground: 'a626a4' },
    { token: 'keyword.md', foreground: 'a626a4' },
    { token: 'string.link.md', foreground: '986801' },
    { token: 'type.md', foreground: 'a626a4' },
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#24292f',
    'editor.selectionBackground': '#d7d4f0',
    'editor.selectionHighlightBackground': '#e8e6f5',
    'editor.inactiveSelectionBackground': '#e8e6f5',
    'editor.selectionForeground': '#000000',
    'diffEditorGutter.removedLineBackground': '#ffdce0',
    'diffEditor.removedTextBackground': '#fb383860',
    'diffEditorGutter.insertedLineBackground': '#aceebb',
    'diffEditor.insertedTextBackground': '#0c8d2670',
    'diffEditor.border': '#d0d7de',
  }
});

monaco.editor.defineTheme('airbnb-cute-diff', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: 'd43b8d' },
    { token: 'string.value.json', foreground: '8c2b64' },
    { token: 'string.json', foreground: '8c2b64' },
    { token: 'number.json', foreground: 'c2317a' },
    { token: 'keyword.json', foreground: 'b4246c' },
    { token: 'operator.json', foreground: 'a13c74' },
    { token: 'delimiter.bracket.json', foreground: 'a13c74' }
  ],
  colors: {
    'editor.background': '#ffe7f4',
    'editor.foreground': '#3f1735',
    'editor.selectionBackground': '#f7c9e855',
    'editor.selectionHighlightBackground': '#f7c9e830',
    'editor.inactiveSelectionBackground': '#f7c9e820',
    'diffEditorGutter.removedLineBackground': '#ffd6e480',
    'diffEditor.removedTextBackground': '#f9508bb0',
    'diffEditorGutter.insertedLineBackground': '#e8ffe880',
    'diffEditor.insertedTextBackground': '#64f564b0',
    'diffEditor.border': '#f3aacd'
  }
});

monaco.editor.defineTheme('airbnb-midnight-diff', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '6aa9ff' },
    { token: 'string.value.json', foreground: '7be3a1' },
    { token: 'string.json', foreground: '7be3a1' },
    { token: 'number.json', foreground: 'ffb86c' },
    { token: 'keyword.json', foreground: 'ff6b6b' },
    { token: 'operator.json', foreground: '97a3b6' },
    { token: 'delimiter.bracket.json', foreground: '97a3b6' }
  ],
  colors: {
    'editor.background': '#0b1020',
    'editor.foreground': '#e6edf6',
    'editor.selectionBackground': '#23305a',
    'editor.selectionHighlightBackground': '#1a2444',
    'editor.inactiveSelectionBackground': '#1a2444',
    'diffEditorGutter.removedLineBackground': '#3a1e22',
    'diffEditor.removedTextBackground': '#ca1815b0',
    'diffEditorGutter.insertedLineBackground': '#15372a',
    'diffEditor.insertedTextBackground': '#2ea043b0',
    'diffEditor.border': '#2a355a',
  }
});

monaco.editor.defineTheme('airbnb-sand-diff', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '8a5e2c' },
    { token: 'string.value.json', foreground: '5b7a3a' },
    { token: 'string.json', foreground: '5b7a3a' },
    { token: 'number.json', foreground: '9c5fb5' },
    { token: 'keyword.json', foreground: 'b8433a' },
    { token: 'operator.json', foreground: '7a6e60' },
    { token: 'delimiter.bracket.json', foreground: '7a6e60' }
  ],
  colors: {
    'editor.background': '#faf6f0',
    'editor.foreground': '#3b2f20',
    'editor.selectionBackground': '#e8d9c5',
    'editor.selectionHighlightBackground': '#f0e4d4',
    'editor.inactiveSelectionBackground': '#f0e4d4',
    'diffEditorGutter.removedLineBackground': '#ffdce0',
    'diffEditor.removedTextBackground': '#fb383860',
    'diffEditorGutter.insertedLineBackground': '#aceebb',
    'diffEditor.insertedTextBackground': '#0c8d2670',
    'diffEditor.border': '#d9cbb8',
  }
});

monaco.editor.defineTheme('airbnb-slate-diff', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '7aa2c2' },
    { token: 'string.value.json', foreground: '9bdba5' },
    { token: 'string.json', foreground: '9bdba5' },
    { token: 'number.json', foreground: 'ffb86c' },
    { token: 'keyword.json', foreground: 'ff7b7b' },
    { token: 'operator.json', foreground: 'a5b1c2' },
    { token: 'delimiter.bracket.json', foreground: 'a5b1c2' }
  ],
  colors: {
    'editor.background': '#1b1f24',
    'editor.foreground': '#e5e9ef',
    'editor.selectionBackground': '#343d48',
    'editor.selectionHighlightBackground': '#2a323b',
    'editor.inactiveSelectionBackground': '#2a323b',
    'diffEditorGutter.removedLineBackground': '#3a1e22',
    'diffEditor.removedTextBackground': '#ca1815b0',
    'diffEditorGutter.insertedLineBackground': '#15372a',
    'diffEditor.insertedTextBackground': '#2ea043b0',
    'diffEditor.border': '#3a424c',
  }
});

monaco.editor.defineTheme('airbnb-sky-diff', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '2d6cdf' },
    { token: 'string.value.json', foreground: '2f7a5d' },
    { token: 'string.json', foreground: '2f7a5d' },
    { token: 'number.json', foreground: '6f42c1' },
    { token: 'keyword.json', foreground: 'c13f4d' },
    { token: 'operator.json', foreground: '5f6b77' },
    { token: 'delimiter.bracket.json', foreground: '5f6b77' }
  ],
  colors: {
    'editor.background': '#eef6ff',
    'editor.foreground': '#1b2b3a',
    'editor.selectionBackground': '#cfe2ff',
    'editor.selectionHighlightBackground': '#e3efff',
    'editor.inactiveSelectionBackground': '#e3efff',
    'diffEditorGutter.removedLineBackground': '#ffdce0',
    'diffEditor.removedTextBackground': '#fb383860',
    'diffEditorGutter.insertedLineBackground': '#aceebb',
    'diffEditor.insertedTextBackground': '#0c8d2670',
    'diffEditor.border': '#c7d9f2',
  }
});

monaco.editor.defineTheme('monokai-diff', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '66d9ef' },
    { token: 'string.value.json', foreground: 'e6db74' },
    { token: 'string.json', foreground: 'e6db74' },
    { token: 'number.json', foreground: 'ae81ff' },
    { token: 'keyword.json', foreground: 'f92672' },
    { token: 'operator.json', foreground: 'f8f8f2' },
    { token: 'delimiter.bracket.json', foreground: 'f8f8f2' }
  ],
  colors: {
    'editor.background': '#272822',
    'editor.foreground': '#f8f8f2',
    'editor.selectionBackground': '#49483e',
    'editor.selectionHighlightBackground': '#3e3d32',
    'editor.inactiveSelectionBackground': '#3e3d32',
    'diffEditorGutter.removedLineBackground': '#4b2029',
    'diffEditor.removedTextBackground': '#f92672b0',
    'diffEditorGutter.insertedLineBackground': '#1e3a1e',
    'diffEditor.insertedTextBackground': '#a6e22e80',
    'diffEditor.border': '#3e3d32',
  }
});

export const MONACO_THEME_BY_MODE = {
  dark: 'airbnb-dark-diff',
  light: 'airbnb-light-diff',
  pink: 'airbnb-cute-diff',
  midnight: 'airbnb-midnight-diff',
  sand: 'airbnb-sand-diff',
  slate: 'airbnb-slate-diff',
  sky: 'airbnb-sky-diff',
  monokai: 'monokai-diff',
};
