import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock firebase - db set to a truthy object so Firebase path is attempted
vi.mock('../lib/firebase', () => ({
  db: { __mock: true },
  doc: vi.fn((_db, _collection, id) => ({ id })),
  setDoc: vi.fn(),
  getOrCreateAnonUser: vi.fn(),
}));

vi.mock('nanoid', () => ({ nanoid: vi.fn(() => 'mock-id-123') }));
vi.mock('../services/analytics', () => ({
  analytics: { diffShared: vi.fn(), linkCopied: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

import ShareModal from './ShareModal';
import { setDoc, getOrCreateAnonUser } from '../lib/firebase';

const mockContent = {
  original: 'hello',
  modified: 'world',
  originalLang: 'plaintext',
  modifiedLang: 'plaintext',
  preview: null,
};

function renderModal(props = {}) {
  return render(
    <ShareModal
      isOpen={true}
      onClose={vi.fn()}
      getContent={() => mockContent}
      {...props}
    />
  );
}

describe('ShareModal', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    getOrCreateAnonUser.mockResolvedValue({ uid: 'anon-123' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders Generate Share Link button when open', () => {
    renderModal();
    expect(screen.getByText('Generate Share Link')).toBeInTheDocument();
  });

  it('does not render a markdown preview block', () => {
    const { container } = renderModal();
    expect(container.querySelector('pre')).toBeNull();
  });

  it('shows Firebase link on successful save', async () => {
    setDoc.mockResolvedValue(undefined);
    renderModal();
    fireEvent.click(screen.getByText('Generate Share Link'));
    await waitFor(() => {
      const input = screen.getByDisplayValue(/\/s\/mock-id-123/);
      expect(input).toBeInTheDocument();
    });
  });

  it('falls back to lz-string URL when Firebase fails', async () => {
    setDoc.mockRejectedValue(new Error('network error'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderModal();
    fireEvent.click(screen.getByText('Generate Share Link'));
    await waitFor(() => {
      const input = screen.getByDisplayValue(/\/s\/lz:/);
      expect(input).toBeInTheDocument();
    });
    warnSpy.mockRestore();
  });

  it('falls back to lz-string URL when Firebase times out (>3s)', async () => {
    vi.useRealTimers();
    // setDoc returns a promise that resolves after 5s (longer than the 3s timeout)
    setDoc.mockReturnValue(new Promise((resolve) => setTimeout(resolve, 5000)));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderModal();
    fireEvent.click(screen.getByText('Generate Share Link'));

    // Should show "Creating link..." while loading
    expect(screen.getByText('Creating link...')).toBeInTheDocument();

    // Wait for the 3s timeout to trigger fallback
    await waitFor(() => {
      const input = screen.getByDisplayValue(/\/s\/lz:/);
      expect(input).toBeInTheDocument();
    }, { timeout: 5000 });
    warnSpy.mockRestore();
  });

  it('shows error for content exceeding 500KB', async () => {
    const bigContent = {
      ...mockContent,
      original: 'x'.repeat(500_001),
    };
    render(
      <ShareModal
        isOpen={true}
        onClose={vi.fn()}
        getContent={() => bigContent}
      />
    );
    fireEvent.click(screen.getByText('Generate Share Link'));
    await waitFor(() => {
      expect(screen.getByText(/Content too large/)).toBeInTheDocument();
    });
  });

  it('does not render when closed', () => {
    const { container } = render(
      <ShareModal
        isOpen={false}
        onClose={vi.fn()}
        getContent={() => mockContent}
      />
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
});
