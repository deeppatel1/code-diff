import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({
  breaks: true,
  gfm: true,
});

export default function MarkdownDiffPreview({ original, modified }) {
  const originalHtml = useMemo(() => DOMPurify.sanitize(marked.parse(original || '')), [original]);
  const modifiedHtml = useMemo(() => DOMPurify.sanitize(marked.parse(modified || '')), [modified]);

  return (
    <div className="absolute inset-0 grid grid-cols-2 overflow-hidden">
      <div className="overflow-auto border-r border-dark-border">
        <div className="px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-dark-text-secondary bg-header-bg border-b border-dark-border sticky top-0 z-10">
          Original
        </div>
        <div
          className="md-preview p-6"
          dangerouslySetInnerHTML={{ __html: originalHtml }}
        />
      </div>
      <div className="overflow-auto">
        <div className="px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-dark-text-secondary bg-header-bg border-b border-dark-border sticky top-0 z-10">
          Modified
        </div>
        <div
          className="md-preview p-6"
          dangerouslySetInnerHTML={{ __html: modifiedHtml }}
        />
      </div>
    </div>
  );
}
