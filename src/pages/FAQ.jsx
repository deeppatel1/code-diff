import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './FAQ.css';

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
    answer: "No. All processing happens locally in your browser. Your code never leaves your device, ensuring complete privacy and security. There are no servers, no databases, and no data collection."
  },
  {
    question: "What languages are supported?",
    answer: "Diff Please supports syntax highlighting for JavaScript, TypeScript, Python, Java, C++, HTML, CSS, JSON, YAML, and many more languages through Monaco Editor. The language is automatically detected based on your code syntax."
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
        <meta name="description" content="Frequently asked questions about Diff Please - a fast, privacy-first code diff tool for comparing code inline or side-by-side." />
        <meta name="keywords" content="code diff, compare code, diff tool, code comparison, developer tools, FAQ" />
        <link rel="canonical" href="https://diffplease.com/faq" />
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      
      <div className="faq-page">
        <div className="faq-header">
          <Link to="/" className="back-link">
            <ArrowLeft size={20} />
            Back to Diff Tool
          </Link>
        </div>
        
        <div className="faq-container">
          <h1>Frequently Asked Questions</h1>
          
          <div className="faq-intro">
            <p>Diff Please is a browser-based code comparison tool that helps developers quickly identify differences between two pieces of code. Everything runs locally in your browser for complete privacy.</p>
          </div>

          <div className="faq-section how-it-works">
            <h2>How It Works</h2>
            <div className="steps">
              <div className="step">
                <strong>1. Paste Your Code</strong>
                <p>Copy and paste your original code into the left editor panel and your modified code into the right panel.</p>
              </div>
              <div className="step">
                <strong>2. Automatic Detection</strong>
                <p>The tool automatically detects your programming language and applies syntax highlighting for better readability.</p>
              </div>
              <div className="step">
                <strong>3. View Differences</strong>
                <p>Differences are instantly highlighted. Red shows deletions, green shows additions. Toggle between side-by-side or inline view.</p>
              </div>
              <div className="step">
                <strong>4. Use Tools</strong>
                <p>Beautify code, sort JSON keys, convert formats, or switch themes - all without your code leaving your browser.</p>
              </div>
            </div>
          </div>
          
          {faqData.map((faq, index) => (
            <div key={index} className="faq-section">
              <h2>{faq.question}</h2>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
