import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';
import useThemeClass from '../lib/useThemeClass';

const faqData = [
  {
    question: "What is Diff Please?",
    answer: "Diff Please is a fast, privacy-first code comparison tool that runs entirely in your browser. Compare code inline or side-by-side with Monaco-powered syntax highlighting."
  },
  {
    question: "How does Diff Please work?",
    answer: "Simply paste your original code in the left panel and modified code in the right panel. Diff Please instantly highlights the differences between them. You can switch between side-by-side view (two panels) or inline view (unified view with changes marked). The tool automatically detects your programming language and applies appropriate syntax highlighting."
  },
  {
    question: "Is my code uploaded anywhere?",
    answer: "All diffing and formatting happens locally in your browser — your code is never sent to a server for processing. The optional sharing and history features use Firebase to store snapshots you explicitly choose to save or share, but the core diff tool works entirely offline."
  },
  {
    question: "What languages are supported?",
    answer: "Diff Please supports syntax highlighting for JavaScript, TypeScript, Python, Java, C++, HTML, CSS, JSON, YAML, Markdown, CSV, and many more languages through Monaco Editor. The language is automatically detected based on your content, with built-in preview support for Markdown and CSV files."
  },
  {
    question: "Do I need to sign up or create an account?",
    answer: "No sign-up required. Just visit the site and start comparing code immediately. There are no accounts, no logins, and no registration process."
  },
  {
    question: "What's the difference between inline and side-by-side view?",
    answer: "Inline view shows changes within a single editor, highlighting additions and deletions in place. Side-by-side view displays the original and modified code in separate panels for easier comparison. You can toggle between these views using the button in the toolbar."
  },
  {
    question: "Can I beautify or format my code?",
    answer: "Yes. Click the beautify button to automatically format supported languages like JavaScript, JSON, HTML, and CSS. This helps clean up messy code before comparing it."
  },
  {
    question: "What JSON tools are available?",
    answer: "Diff Please includes utilities to sort JSON keys alphabetically, minify JSON to remove whitespace, and convert between JSON and YAML formats. These tools appear automatically when you're working with JSON code."
  },
  {
    question: "Can I preview CSV files as a table?",
    answer: "Yes. When you paste CSV data, Diff Please automatically detects it and shows a Preview button. Click it to see your CSV rendered as a formatted table alongside the raw data. Great for inspecting data files without leaving the browser."
  },
  {
    question: "Does Diff Please support Markdown preview?",
    answer: "Yes. Paste Markdown content and click the Preview button to see a live rendered preview with headings, bold, links, images, code blocks, and tables — all displayed side-by-side with the raw Markdown source."
  },
  {
    question: "Is Diff Please free?",
    answer: "Yes, completely free with no limitations or premium tiers. All features are available to everyone at no cost."
  },
  {
    question: "Can I use this offline?",
    answer: "After your first visit, the app may be cached by your browser, but an internet connection is required for initial loading. Once loaded, the tool works without making additional network requests."
  },
  {
    question: "How do I report bugs or request features?",
    answer: "Visit our GitHub repository or contact us through the links provided on the main page. We welcome feedback and feature suggestions."
  },
  {
    question: "What are common use cases for Diff Please?",
    answer: "Developers use Diff Please to review code changes before committing, compare configuration files, check API response differences, validate JSON data transformations, and review pull request changes. It's useful anytime you need to see what changed between two versions of text or code."
  }
];

export default function FAQ() {
  useThemeClass();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <>
      <Helmet>
        <title>FAQ - Diff Please | Code Comparison Tool</title>
        <meta name="description" content="Frequently asked questions about Diff Please - a fast, privacy-first code diff tool with CSV viewer, Markdown preview, and side-by-side comparison." />
        <meta name="keywords" content="code diff, compare code, diff tool, code comparison, developer tools, FAQ" />
        <link rel="canonical" href="https://diffplease.com/faq" />
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-page-bg text-page-text font-[-apple-system,BlinkMacSystemFont,'Segoe_UI','Noto_Sans',Helvetica,Arial,sans-serif]">
        <div className="bg-header-bg border-b border-header-border py-2.5 px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <svg width="40" height="32" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-8 shrink-0">
              <path d="M14 19L6 12L14 5" stroke="#da3633" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 5L30 12L22 19" stroke="#2ea043" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-lg md:text-2xl font-medium tracking-tighter font-['Fira_Code'] text-dark-text whitespace-nowrap">diff please</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-btn-text no-underline text-[0.8rem] font-semibold py-2 px-3 rounded-full border border-btn-border bg-btn-bg transition-colors duration-200 hover:bg-btn-hover hover:-translate-y-px">
            <IconArrowLeft size={14} />
            <span className="hidden md:inline">Back to Editor</span>
          </Link>
        </div>

        <div className="max-w-[900px] mx-auto py-12 px-8 max-md:py-8 max-md:px-4">
          <h1 className="text-[2.5rem] mb-8 text-page-text font-semibold tracking-tight max-md:text-[2rem]">Frequently Asked Questions</h1>

          <div className="mb-12 p-6 bg-header-bg border-l-4 border-l-blue-500 rounded-md max-md:p-4">
            <p className="text-[1.1rem] leading-relaxed text-dark-text-secondary m-0 max-md:text-base">Diff Please is a browser-based code comparison tool that helps developers quickly identify differences between two pieces of code. Everything runs locally in your browser for complete privacy.</p>
          </div>

          <div className="mb-12 p-8 bg-gradient-to-br from-[var(--header-bg)] to-[var(--dark-bg-secondary)] border-2 border-lang-indicator rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] max-md:p-6 max-md:mb-8">
            <h2 className="text-[1.35rem] mb-6 text-lang-indicator font-semibold max-md:text-[1.2rem]">How It Works</h2>
            <div className="grid gap-6">
              <div className="pl-4 border-l-[3px] border-l-dark-border">
                <strong className="block text-[1.1rem] text-page-text mb-2 max-md:text-base">1. Paste Your Code</strong>
                <p className="m-0 text-dark-text-secondary leading-relaxed">Copy and paste your original code into the left editor panel and your modified code into the right panel.</p>
              </div>
              <div className="pl-4 border-l-[3px] border-l-dark-border">
                <strong className="block text-[1.1rem] text-page-text mb-2 max-md:text-base">2. Automatic Detection</strong>
                <p className="m-0 text-dark-text-secondary leading-relaxed">The tool automatically detects your programming language and applies syntax highlighting for better readability.</p>
              </div>
              <div className="pl-4 border-l-[3px] border-l-dark-border">
                <strong className="block text-[1.1rem] text-page-text mb-2 max-md:text-base">3. View Differences</strong>
                <p className="m-0 text-dark-text-secondary leading-relaxed">Differences are instantly highlighted. Red shows deletions, green shows additions. Toggle between side-by-side or inline view.</p>
              </div>
              <div className="pl-4 border-l-[3px] border-l-dark-border">
                <strong className="block text-[1.1rem] text-page-text mb-2 max-md:text-base">4. Use Tools</strong>
                <p className="m-0 text-dark-text-secondary leading-relaxed">Beautify code, sort JSON keys, convert formats, or switch themes - all without your code leaving your browser.</p>
              </div>
            </div>
          </div>

          {faqData.map((faq, index) => (
            <div key={index} className="mb-12 p-8 bg-header-bg border border-header-border rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] max-md:p-6 max-md:mb-8">
              <h2 className="text-[1.35rem] mb-4 text-page-text font-semibold max-md:text-[1.2rem]">{faq.question}</h2>
              <p className="text-[1.05rem] leading-relaxed text-dark-text-secondary max-md:text-base">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
