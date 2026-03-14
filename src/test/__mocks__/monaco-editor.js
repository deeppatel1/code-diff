import { vi } from 'vitest';

// Shared mock state for monaco-editor
const contentChangeListeners = { original: [], modified: [] };

const createMockModel = (side) => ({
  getValue: () => '',
  setValue: function(val) {
    this._value = val;
    contentChangeListeners[side].forEach(fn => fn());
  },
  getFullModelRange: function() {
    const lines = (this._value || '').split('\n');
    return { startLineNumber: 1, startColumn: 1, endLineNumber: lines.length, endColumn: lines[lines.length - 1].length + 1 };
  },
  pushEditOperations: function(_selections, edits, _cursorComputer) {
    if (edits && edits.length > 0) {
      this._value = edits[0].text;
      contentChangeListeners[side].forEach(fn => fn());
    }
  },
  getLanguageId: () => 'plaintext',
  onDidChangeContent: (fn) => { contentChangeListeners[side].push(fn); },
  _value: '',
});

export const mockOriginalModel = createMockModel('original');
export const mockModifiedModel = createMockModel('modified');
let modelCount = 0;

const mockDiffEditor = {
  getOriginalEditor: () => ({
    getModel: () => mockOriginalModel,
    updateOptions: () => {},
    getDomNode: () => null,
    addAction: () => {},
    executeEdits: (source, edits) => {
      if (edits?.[0]) {
        mockOriginalModel._value = edits[0].text;
        contentChangeListeners.original.forEach(fn => fn());
      }
    },
  }),
  getModifiedEditor: () => ({
    getModel: () => mockModifiedModel,
    updateOptions: () => {},
    getDomNode: () => null,
    addAction: () => {},
    executeEdits: (source, edits) => {
      if (edits?.[0]) {
        mockModifiedModel._value = edits[0].text;
        contentChangeListeners.modified.forEach(fn => fn());
      }
    },
  }),
  setModel: () => {},
  updateOptions: () => {},
  layout: () => {},
  onDidUpdateDiff: () => {},
  getLineChanges: () => [],
  goToDiff: () => {},
};

export const editor = {
  defineTheme: () => {},
  setTheme: vi.fn(),
  createDiffEditor: () => mockDiffEditor,
  createModel: (value) => {
    modelCount++;
    if (modelCount % 2 === 1) {
      mockOriginalModel._value = value;
      mockOriginalModel.getValue = () => mockOriginalModel._value;
      return mockOriginalModel;
    }
    mockModifiedModel._value = value;
    mockModifiedModel.getValue = () => mockModifiedModel._value;
    return mockModifiedModel;
  },
  setModelLanguage: vi.fn(),
};

export const KeyMod = { CtrlCmd: 2048, Shift: 1024, Alt: 512, WinCtrl: 256 };
export const KeyCode = {
  KeyP: 46, KeyB: 28, KeyF: 32, KeyO: 41,
  UpArrow: 16, DownArrow: 18,
};

export function __resetMocks() {
  modelCount = 0;
  contentChangeListeners.original = [];
  contentChangeListeners.modified = [];
  mockOriginalModel._value = '';
  mockOriginalModel.getValue = () => mockOriginalModel._value;
  mockOriginalModel.getLanguageId = () => 'plaintext';
  mockModifiedModel._value = '';
  mockModifiedModel.getValue = () => mockModifiedModel._value;
  mockModifiedModel.getLanguageId = () => 'plaintext';
  editor.setTheme.mockClear();
  editor.setModelLanguage.mockClear();
}
