import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CsvTablePreview from './CsvTablePreview';

export default function PreviewOverlay({ type, content, onClose }) {
  return (
    <div className="absolute top-0 bottom-0 right-0 w-1/2 z-[50] bg-page-bg border-l border-dark-border flex flex-col animate-fade-in">
      <div className="flex-1 overflow-auto relative">
        {type === 'csv' ? (
          <CsvTablePreview content={content} />
        ) : (
          <div className="md-preview p-6">
            <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
