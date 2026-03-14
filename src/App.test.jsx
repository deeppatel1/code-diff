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
    expect(screen.getByText('diff please')).toBeInTheDocument();
  });

  it('renders editor container div', () => {
    const { container } = renderApp(App);
    // The editor container is the flex-1 overflow-hidden div
    const editorContainer = container.querySelector('[class*="flex-1"][class*="overflow-hidden"]');
    expect(editorContainer).toBeInTheDocument();
  });

  it('renders footer with stats', () => {
    renderApp(App);
    const statElements = screen.getAllByRole('status');
    expect(statElements.length).toBeGreaterThanOrEqual(2);
  });

  it('renders theme selector', () => {
    renderApp(App);
    const trigger = screen.getByRole('combobox', { name: /select theme/i });
    expect(trigger).toBeInTheDocument();
  });

  it('renders FAQ link pointing to /faq', () => {
    renderApp(App);
    const faqLink = screen.getByTitle('FAQ');
    expect(faqLink.closest('a')).toHaveAttribute('href', '/faq');
  });

  // ── Theme management ──
  it('defaults theme to light and shows Dawn label', () => {
    renderApp(App);
    expect(screen.getByText('Dawn')).toBeInTheDocument();
  });

  it('reads initial theme from localStorage', async () => {
    localStorage.setItem('diffright-theme-mode', 'dark');
    vi.resetModules();
    const monacoMock = await import('monaco-editor');
    monacoMock.__resetMocks();
    const mod = await import('./App.jsx');
    renderApp(mod.default);
    expect(screen.getByText('Night')).toBeInTheDocument();
  });

  it('initial theme class is applied to documentElement', () => {
    localStorage.setItem('diffright-theme-mode', 'midnight');
    renderApp(App);
    expect(document.documentElement.classList.contains('theme-midnight')).toBe(true);
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
  it('shows initial stats with 0 values', () => {
    renderApp(App);
    const statElements = screen.getAllByRole('status');
    expect(statElements.length).toBeGreaterThanOrEqual(2);
    expect(statElements[0].textContent).toContain('0');
    expect(statElements[0].textContent).toContain('lines');
  });

  it('stats update when model content changes', async () => {
    renderApp(App);
    act(() => {
      mockOriginalModel._value = 'hello world';
      mockOriginalModel.getValue = () => mockOriginalModel._value;
      mockOriginalModel.setValue('hello world');
    });
    await waitFor(() => {
      expect(screen.getAllByText('1')[0]).toBeInTheDocument();
    });
  });

  it('format button appears for beautifiable languages', async () => {
    renderApp(App);
    act(() => {
      mockOriginalModel._value = '{"key": "value"}';
      mockOriginalModel.getValue = () => mockOriginalModel._value;
      mockOriginalModel.setValue('{"key": "value"}');
    });
    await waitFor(() => {
      expect(screen.getByTitle('Format json')).toBeInTheDocument();
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
      const statElements = screen.getAllByRole('status');
      const rightStats = statElements[statElements.length - 1];
      expect(rightStats.textContent).toContain('3');
      expect(rightStats.textContent).toContain('words');
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
      // Sort/Minify/Convert buttons appear (may be duplicated for both sides)
      expect(screen.getAllByTitle('Sort JSON').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByTitle('Minify JSON').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByTitle('Convert JSON to YAML').length).toBeGreaterThanOrEqual(1);
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
      expect(screen.getAllByTitle('Convert YAML to JSON').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Button click handlers ──
  it('Sort JSON button updates model with sorted output', async () => {
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
    fireEvent.click(screen.getByTitle('Sort JSON'));
    await waitFor(() => {
      const sorted = JSON.parse(mockOriginalModel._value);
      expect(Object.keys(sorted)).toEqual(['a', 'b']);
    });
  });

  it('Minify JSON button updates model with compact output', async () => {
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
    fireEvent.click(screen.getByTitle('Minify JSON'));
    await waitFor(() => {
      expect(mockOriginalModel._value).toBe('{"b":2,"a":1}');
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
    fireEvent.click(screen.getByTitle('Convert JSON to YAML'));
    await waitFor(() => {
      expect(mockOriginalModel._value).toContain('name: codex');
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
    fireEvent.click(screen.getByTitle('Convert YAML to JSON'));
    await waitFor(() => {
      expect(mockOriginalModel._value).toContain('"name": "codex"');
      expect(monacoMock.editor.setModelLanguage).toHaveBeenCalledWith(mockOriginalModel, 'json');
    });
  });

  // ── Error handling ──
  it('beautify error does not crash the app', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderApp(App);
    act(() => {
      mockOriginalModel._value = '{"a":1}';
      mockOriginalModel.getValue = () => mockOriginalModel._value;
      mockOriginalModel.getLanguageId = () => 'json';
      mockOriginalModel.setValue('{"a":1}');
    });
    await waitFor(() => {
      expect(screen.getByTitle('Format json')).toBeInTheDocument();
    });
    mockOriginalModel.getValue = () => { throw new Error('mock error'); };
    fireEvent.click(screen.getByTitle('Format json'));
    expect(screen.getByText('diff please')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
