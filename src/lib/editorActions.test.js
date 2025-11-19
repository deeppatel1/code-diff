import { describe, it, expect, vi } from 'vitest';
import { sortModelJson } from './editorActions';

describe('sortModelJson', () => {
  it('passes the indent size through to beautifier.sortJson and updates the model', () => {
    const model = {
      getValue: vi.fn(() => '{"b":2,"a":1}'),
      setValue: vi.fn()
    };
    const beautifier = {
      sortJson: vi.fn(() => '{\n    "a": 1,\n    "b": 2\n}')
    };

    const result = sortModelJson({
      model,
      beautifier,
      indentSize: 4
    });

    expect(beautifier.sortJson).toHaveBeenCalledWith('{"b":2,"a":1}', { indentSize: 4 });
    expect(model.setValue).toHaveBeenCalledWith('{\n    "a": 1,\n    "b": 2\n}');
    expect(result).toBe('{\n    "a": 1,\n    "b": 2\n}');
  });

  it('throws helpful errors when dependencies are missing', () => {
    const beautifier = { sortJson: vi.fn() };
    expect(() => sortModelJson({ beautifier, indentSize: 2 })).toThrow(/Model is required/);
    const model = { getValue: vi.fn(), setValue: vi.fn() };
    expect(() => sortModelJson({ model, indentSize: 2 })).toThrow(/CodeBeautifier instance/);
  });
});
