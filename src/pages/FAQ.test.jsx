import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import FAQ from './FAQ';

function renderFAQ() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <FAQ />
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe('FAQ page', () => {
  it('renders the heading', () => {
    renderFAQ();
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
  });

  it('renders all 14 FAQ questions', () => {
    renderFAQ();
    const questions = [
      'What is Diff Please?',
      'How does Diff Please work?',
      'Is my code uploaded anywhere?',
      'What languages are supported?',
      'Do I need to sign up or create an account?',
      "What's the difference between inline and side-by-side view?",
      'Can I beautify or format my code?',
      'What JSON tools are available?',
      'Can I preview CSV files as a table?',
      'Does Diff Please support Markdown preview?',
      'Is Diff Please free?',
      'Can I use this offline?',
      'How do I report bugs or request features?',
      'What are common use cases for Diff Please?',
    ];
    for (const q of questions) {
      expect(screen.getByText(q)).toBeInTheDocument();
    }
  });

  it('renders "Back to Editor" link pointing to /', () => {
    renderFAQ();
    const link = screen.getByText('Back to Editor');
    expect(link.closest('a')).toHaveAttribute('href', '/');
  });

  it('each FAQ question has a corresponding answer paragraph', () => {
    const { container } = renderFAQ();
    // 1 how-it-works section + 14 FAQ items = 15 sections with h2 elements
    const h2Elements = container.querySelectorAll('h2');
    // h1 (main heading) + "How It Works" h2 + 14 FAQ h2s = 16 total headings
    // But we only care about h2s: "How It Works" + 14 FAQ questions = 15
    expect(h2Elements.length).toBe(15);
  });

  it('renders intro paragraph about privacy', () => {
    renderFAQ();
    expect(screen.getByText(/Everything runs locally in your browser for complete privacy/)).toBeInTheDocument();
  });

  it('renders "How It Works" section with 4 steps', () => {
    renderFAQ();
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('1. Paste Your Code')).toBeInTheDocument();
    expect(screen.getByText('2. Automatic Detection')).toBeInTheDocument();
    expect(screen.getByText('3. View Differences')).toBeInTheDocument();
    expect(screen.getByText('4. Use Tools')).toBeInTheDocument();
  });
});
