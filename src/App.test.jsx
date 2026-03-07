import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

function renderApp(App) {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe('App', () => {
  let App;
  let mockOriginalModel, mockModifiedModel;

  beforeEach(async () => {
    vi.resetModules();
    const monacoMock = await import('monaco-editor');
    monacoMock.__resetMocks();
    mockOriginalModel = monacoMock.mockOriginalModel;
    mockModifiedModel = monacoMock.mockModifiedModel;
    const mod = await import('./App.jsx');
    App = mod.default;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Rendering ──
  it('renders without crashing', () => {
    renderApp(App);
  });

  it('renders "Diff Please" header', () => {
    renderApp(App);
    expect(screen.getByText('Diff Please')).toBeInTheDocument();
  });

  it('renders editor container div', () => {
    const { container } = renderApp(App);
    expect(container.querySelector('.editor-container')).toBeInTheDocument();
  });

  it('renders footer with stats', () => {
    renderApp(App);
    expect(screen.getAllByText('0 lines').length).toBeGreaterThanOrEqual(2);
  });

  it('renders theme dropdown with all 12 themes', () => {
    renderApp(App);
    const select = document.querySelector('.theme-dropdown-select');
    expect(select).toBeInTheDocument();
    expect(select.querySelectorAll('option').length).toBe(12);
  });

  it('renders FAQ link pointing to /faq', () => {
    renderApp(App);
    const faqLink = screen.getByTitle('FAQ');
    expect(faqLink.closest('a')).toHaveAttribute('href', '/faq');
  });

  // ── Theme management ──
  it('defaults theme to light', () => {
    renderApp(App);
    expect(document.querySelector('.theme-dropdown-select').value).toBe('light');
  });

  it('reads initial theme from localStorage', async () => {
    localStorage.setItem('diffright-theme-mode', 'dark');
    vi.resetModules();
    const monacoMock = await import('monaco-editor');
    monacoMock.__resetMocks();
    const mod = await import('./App.jsx');
    const { container } = renderApp(mod.default);
    expect(container.querySelector('.theme-dropdown-select').value).toBe('dark');
  });

  it('theme change persists to localStorage', () => {
    renderApp(App);
    fireEvent.change(document.querySelector('.theme-dropdown-select'), { target: { value: 'dark' } });
    expect(localStorage.getItem('diffright-theme-mode')).toBe('dark');
  });

  it('theme change adds theme class to documentElement', () => {
    renderApp(App);
    fireEvent.change(document.querySelector('.theme-dropdown-select'), { target: { value: 'synthwave' } });
    expect(document.documentElement.classList.contains('theme-synthwave')).toBe(true);
  });

  // ── View toggle ──
  it('clicking view toggle switches to unified view', () => {
    renderApp(App);
    fireEvent.click(screen.getByTitle('Switch to Unified View'));
    expect(screen.getByTitle('Switch to Side-by-Side View')).toBeInTheDocument();
  });

  it('view mode persists to sessionStorage', () => {
    renderApp(App);
    fireEvent.click(screen.getByTitle('Switch to Unified View'));
    expect(sessionStorage.getItem('diffright-session-view')).toBe('inline');
  });

  // ── Stats & language ──
  it('shows initial "0 lines", "0 words", "0 chars"', () => {
    renderApp(App);
    expect(screen.getAllByText('0 lines').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('0 words').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('0 chars').length).toBeGreaterThanOrEqual(2);
  });

  it('stats update when model content changes', async () => {
    renderApp(App);
    act(() => {
      mockOriginalModel._value = 'hello world';
      mockOriginalModel.getValue = () => mockOriginalModel._value;
      mockOriginalModel.setValue('hello world');
    });
    await waitFor(() => {
      expect(screen.getAllByText('1 lines')[0]).toBeInTheDocument();
    });
  });

  it('language indicator appears for non-plaintext', async () => {
    renderApp(App);
    act(() => {
      mockOriginalModel._value = '{"key": "value"}';
      mockOriginalModel.getValue = () => mockOriginalModel._value;
      mockOriginalModel.setValue('{"key": "value"}');
    });
    await waitFor(() => {
      expect(screen.getByText('json')).toBeInTheDocument();
    });
  });

  it('beautify button appears for beautifiable languages', async () => {
    renderApp(App);
    act(() => {
      mockOriginalModel._value = '{"key": "value"}';
      mockOriginalModel.getValue = () => mockOriginalModel._value;
      mockOriginalModel.setValue('{"key": "value"}');
    });
    await waitFor(() => {
      expect(screen.getByTitle('Beautify json')).toBeInTheDocument();
    });
  });

  it('JSON buttons appear for json content', async () => {
    renderApp(App);
    act(() => {
      mockOriginalModel._value = '{"key": "value"}';
      mockOriginalModel.getValue = () => mockOriginalModel._value;
      mockOriginalModel.setValue('{"key": "value"}');
    });
    await waitFor(() => {
      expect(screen.getByTitle('Sort JSON')).toBeInTheDocument();
      expect(screen.getByTitle('Minify JSON')).toBeInTheDocument();
      expect(screen.getByTitle('Convert JSON to YAML')).toBeInTheDocument();
    });
  });

  it('YAML button appears for yaml content', async () => {
    renderApp(App);
    act(() => {
      mockOriginalModel._value = 'apiVersion: v1\nkind: Service\nmetadata:\n  name: demo';
      mockOriginalModel.getValue = () => mockOriginalModel._value;
      mockOriginalModel.setValue(mockOriginalModel._value);
    });
    await waitFor(() => {
      expect(screen.getByTitle('Convert YAML to JSON')).toBeInTheDocument();
    });
  });

  // ── Session persistence ──
  it('restores content from sessionStorage on mount', async () => {
    sessionStorage.setItem('diffright-session-original', 'saved original');
    sessionStorage.setItem('diffright-session-modified', 'saved modified');
    vi.resetModules();
    const monacoMock = await import('monaco-editor');
    monacoMock.__resetMocks();
    const freshOriginal = monacoMock.mockOriginalModel;
    const freshModified = monacoMock.mockModifiedModel;
    const mod = await import('./App.jsx');
    renderApp(mod.default);
    expect(freshOriginal._value).toBe('saved original');
    expect(freshModified._value).toBe('saved modified');
  });

  it('saves content to sessionStorage on change', () => {
    renderApp(App);
    act(() => {
      mockOriginalModel._value = 'new content';
      mockOriginalModel.getValue = () => mockOriginalModel._value;
      mockOriginalModel.setValue('new content');
    });
    expect(sessionStorage.getItem('diffright-session-original')).toBe('new content');
  });

  // ── Modified panel ──
  it('modified panel stats update when modified model changes', async () => {
    renderApp(App);
    act(() => {
      mockModifiedModel._value = 'foo bar baz';
      mockModifiedModel.getValue = () => mockModifiedModel._value;
      mockModifiedModel.setValue('foo bar baz');
    });
    await waitFor(() => {
      const metricGroups = document.querySelectorAll('.metric-group');
      const modifiedGroup = metricGroups[metricGroups.length - 1];
      expect(modifiedGroup.textContent).toContain('1 lines');
      expect(modifiedGroup.textContent).toContain('3 words');
    });
  });

  it('modified panel shows language indicator and beautify button', async () => {
    renderApp(App);
    act(() => {
      mockModifiedModel._value = '{"key": "value"}';
      mockModifiedModel.getValue = () => mockModifiedModel._value;
      mockModifiedModel.setValue('{"key": "value"}');
    });
    await waitFor(() => {
      const modifiedPanel = document.querySelector('.modified-panel');
      expect(modifiedPanel.textContent).toContain('json');
      expect(modifiedPanel.querySelector('[title="Beautify json"]')).toBeInTheDocument();
    });
  });

  it('modified panel shows JSON utility buttons for json content', async () => {
    renderApp(App);
    act(() => {
      mockModifiedModel._value = '{"key": "value"}';
      mockModifiedModel.getValue = () => mockModifiedModel._value;
      mockModifiedModel.setValue('{"key": "value"}');
    });
    await waitFor(() => {
      const modifiedPanel = document.querySelector('.modified-panel');
      expect(modifiedPanel.querySelector('[title="Sort JSON"]')).toBeInTheDocument();
      expect(modifiedPanel.querySelector('[title="Minify JSON"]')).toBeInTheDocument();
      expect(modifiedPanel.querySelector('[title="Convert JSON to YAML"]')).toBeInTheDocument();
    });
  });

  it('modified panel shows YAML to JSON button for yaml content', async () => {
    renderApp(App);
    act(() => {
      mockModifiedModel._value = 'apiVersion: v1\nkind: Service\nmetadata:\n  name: demo';
      mockModifiedModel.getValue = () => mockModifiedModel._value;
      mockModifiedModel.setValue(mockModifiedModel._value);
    });
    await waitFor(() => {
      const modifiedPanel = document.querySelector('.modified-panel');
      expect(modifiedPanel.querySelector('[title="Convert YAML to JSON"]')).toBeInTheDocument();
    });
  });

  // ── Button click handlers ──
  it('Sort JSON button calls model.setValue with sorted output', async () => {
    renderApp(App);
    const json = '{"b":2,"a":1}';
    act(() => {
      mockOriginalModel._value = json;
      mockOriginalModel.getValue = () => mockOriginalModel._value;
      mockOriginalModel.getLanguageId = () => 'json';
      mockOriginalModel.setValue(json);
    });
    await waitFor(() => {
      expect(screen.getByTitle('Sort JSON')).toBeInTheDocument();
    });
    const setValueSpy = vi.fn(val => { mockOriginalModel._value = val; });
    mockOriginalModel.setValue = setValueSpy;
    fireEvent.click(screen.getByTitle('Sort JSON'));
    await waitFor(() => {
      expect(setValueSpy).toHaveBeenCalled();
      const sorted = JSON.parse(setValueSpy.mock.calls[0][0]);
      expect(Object.keys(sorted)).toEqual(['a', 'b']);
    });
  });

  it('Minify JSON button calls model.setValue with compact output', async () => {
    renderApp(App);
    const json = '{"b": 2, "a": 1}';
    act(() => {
      mockOriginalModel._value = json;
      mockOriginalModel.getValue = () => mockOriginalModel._value;
      mockOriginalModel.getLanguageId = () => 'json';
      mockOriginalModel.setValue(json);
    });
    await waitFor(() => {
      expect(screen.getByTitle('Minify JSON')).toBeInTheDocument();
    });
    const setValueSpy = vi.fn(val => { mockOriginalModel._value = val; });
    mockOriginalModel.setValue = setValueSpy;
    fireEvent.click(screen.getByTitle('Minify JSON'));
    await waitFor(() => {
      expect(setValueSpy).toHaveBeenCalledWith('{"b":2,"a":1}');
    });
  });

  it('JSON to YAML button updates model and calls setModelLanguage with yaml', async () => {
    const monacoMock = await import('monaco-editor');
    renderApp(App);
    const json = '{"name":"codex"}';
    act(() => {
      mockOriginalModel._value = json;
      mockOriginalModel.getValue = () => mockOriginalModel._value;
      mockOriginalModel.getLanguageId = () => 'json';
      mockOriginalModel.setValue(json);
    });
    await waitFor(() => {
      expect(screen.getByTitle('Convert JSON to YAML')).toBeInTheDocument();
    });
    monacoMock.editor.setModelLanguage.mockClear();
    const setValueSpy = vi.fn(val => { mockOriginalModel._value = val; });
    mockOriginalModel.setValue = setValueSpy;
    fireEvent.click(screen.getByTitle('Convert JSON to YAML'));
    await waitFor(() => {
      expect(setValueSpy).toHaveBeenCalled();
      expect(setValueSpy.mock.calls[0][0]).toContain('name: codex');
      expect(monacoMock.editor.setModelLanguage).toHaveBeenCalledWith(mockOriginalModel, 'yaml');
    });
  });

  it('YAML to JSON button updates model and calls setModelLanguage with json', async () => {
    const monacoMock = await import('monaco-editor');
    renderApp(App);
    const yamlContent = 'name: codex\nversion: 1';
    act(() => {
      mockOriginalModel._value = yamlContent;
      mockOriginalModel.getValue = () => mockOriginalModel._value;
      mockOriginalModel.getLanguageId = () => 'yaml';
      mockOriginalModel.setValue(yamlContent);
    });
    await waitFor(() => {
      expect(screen.getByTitle('Convert YAML to JSON')).toBeInTheDocument();
    });
    monacoMock.editor.setModelLanguage.mockClear();
    const setValueSpy = vi.fn(val => { mockOriginalModel._value = val; });
    mockOriginalModel.setValue = setValueSpy;
    fireEvent.click(screen.getByTitle('Convert YAML to JSON'));
    await waitFor(() => {
      expect(setValueSpy).toHaveBeenCalled();
      expect(setValueSpy.mock.calls[0][0]).toContain('"name": "codex"');
      expect(monacoMock.editor.setModelLanguage).toHaveBeenCalledWith(mockOriginalModel, 'json');
    });
  });

  // ── Theme cycling ──
  it('changing theme removes old theme class and adds new one', () => {
    renderApp(App);
    fireEvent.change(document.querySelector('.theme-dropdown-select'), { target: { value: 'synthwave' } });
    expect(document.documentElement.classList.contains('theme-synthwave')).toBe(true);
    fireEvent.change(document.querySelector('.theme-dropdown-select'), { target: { value: 'midnight' } });
    expect(document.documentElement.classList.contains('theme-midnight')).toBe(true);
    expect(document.documentElement.classList.contains('theme-synthwave')).toBe(false);
  });

  // ── Error handling ──
  it('beautify error does not crash the app', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderApp(App);
    // Trigger json detection so beautify button appears
    act(() => {
      mockOriginalModel._value = '{"a":1}';
      mockOriginalModel.getValue = () => mockOriginalModel._value;
      mockOriginalModel.getLanguageId = () => 'json';
      mockOriginalModel.setValue('{"a":1}');
    });
    await waitFor(() => {
      expect(screen.getByTitle('Beautify json')).toBeInTheDocument();
    });
    // Make getValue return invalid code to trigger beautify error
    mockOriginalModel.getValue = () => { throw new Error('mock error'); };
    fireEvent.click(screen.getByTitle('Beautify json'));
    // App should not crash - the error is caught
    expect(screen.getByText('Diff Please')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
