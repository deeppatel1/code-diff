import React, { useState, useMemo, useEffect } from 'react';
import { IconX, IconCopy, IconCheck, IconLink } from '@tabler/icons-react';
import { db, doc, setDoc, getOrCreateAnonUser } from '../lib/firebase';
import { nanoid } from 'nanoid';
import { compressToEncodedURIComponent } from 'lz-string';
import { analytics } from '../services/analytics';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from './ui/dialog';

function generateMarkdownDiff(original, modified, lineChanges, lang) {
  const origLines = original.split('\n');
  const modLines = modified.split('\n');

  if (!lineChanges || lineChanges.length === 0) {
    if (original === modified) return '_No changes._';
    // No change info available, show both sides
    const fence = lang && lang !== 'plaintext' ? lang : '';
    return `**Original**\n\`\`\`${fence}\n${original}\n\`\`\`\n\n**Modified**\n\`\`\`${fence}\n${modified}\n\`\`\``;
  }

  const CONTEXT = 3;
  const sections = [];
  let lastEnd = 0;

  for (const change of lineChanges) {
    const origStart = change.originalStartLineNumber;
    const origEnd = change.originalEndLineNumber;
    const modStart = change.modifiedStartLineNumber;
    const modEnd = change.modifiedEndLineNumber;

    // Context before
    const ctxStart = Math.max(lastEnd + 1, origStart - CONTEXT);
    for (let i = ctxStart; i < origStart; i++) {
      sections.push(` ${origLines[i - 1]}`);
    }

    // Deletions
    if (origEnd >= origStart) {
      for (let i = origStart; i <= origEnd; i++) {
        sections.push(`-${origLines[i - 1]}`);
      }
    }

    // Additions
    if (modEnd >= modStart) {
      for (let i = modStart; i <= modEnd; i++) {
        sections.push(`+${modLines[i - 1]}`);
      }
    }

    lastEnd = origEnd >= origStart ? origEnd : origStart - 1;

    // Context after
    const ctxEnd = Math.min(origLines.length, lastEnd + CONTEXT);
    const nextChange = lineChanges[lineChanges.indexOf(change) + 1];
    const stopAt = nextChange ? Math.min(ctxEnd, nextChange.originalStartLineNumber - 1) : ctxEnd;
    for (let i = lastEnd + 1; i <= stopAt; i++) {
      sections.push(` ${origLines[i - 1]}`);
    }
    lastEnd = stopAt;
  }

  return `\`\`\`diff\n${sections.join('\n')}\n\`\`\``;
}

export default function ShareModal({ isOpen, onClose, getContent }) {
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState('');
  const [content, setContent] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const data = getContent();
      setContent(data);
    }
  }, [isOpen, getContent]);

  const markdown = useMemo(() => {
    if (!content) return '';
    return generateMarkdownDiff(content.original, content.modified, content.lineChanges, content.originalLang);
  }, [content]);

  const handleShareLink = async () => {
    setLoading(true);
    setError('');

    if (!content) return;
    const { original, modified, originalLang, modifiedLang, preview } = content;
    const base = import.meta.env.BASE_URL;

    const MAX_SIZE = 500_000;
    if (original.length > MAX_SIZE || modified.length > MAX_SIZE) {
      setError('Content too large to share (max 500KB per side).');
      setLoading(false);
      return;
    }

    if (db) {
      try {
        const user = await getOrCreateAnonUser();
        const id = nanoid(21);
        await setDoc(doc(db, 'diffs', id), {
          user_id: user?.uid ?? null,
          original,
          modified,
          original_lang: originalLang,
          modified_lang: modifiedLang,
          preview: preview || null,
          created_at: new Date().toISOString(),
        });

        const url = `${window.location.origin}${base}s/${id}`;
        setShareUrl(url);
        analytics.diffShared();
        setLoading(false);
        return;
      } catch (err) {
        console.warn('Firebase share failed, falling back to URL compression:', err);
      }
    }

    try {
      const payload = JSON.stringify({
        original,
        modified,
        original_lang: originalLang,
        modified_lang: modifiedLang,
        preview: preview || null,
      });
      const compressed = compressToEncodedURIComponent(payload);
      const url = `${window.location.origin}${base}s/lz:${compressed}`;
      setShareUrl(url);
      analytics.diffShared();
    } catch (err) {
      setError('Failed to create share link. Please try again.');
      console.error('Share failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopiedMd(true);
    toast.success('Markdown copied to clipboard');
    analytics.linkCopied();
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success('Link copied to clipboard');
    analytics.linkCopied();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleClose = () => {
    setShareUrl('');
    setError('');
    setContent(null);
    setCopiedMd(false);
    setCopiedLink(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Markdown</DialogTitle>
          <DialogClose className="bg-transparent border-none text-page-text cursor-pointer p-1 rounded hover:bg-btn-hover">
            <IconX size={16} />
          </DialogClose>
        </DialogHeader>
        <div className="p-5 flex flex-col gap-3">
          {markdown && (
            <div className="relative">
              <pre className="max-h-48 overflow-auto p-3 bg-dark-bg-secondary border border-dark-border rounded-md text-[0.75rem] font-mono text-page-text whitespace-pre-wrap break-all m-0">{markdown}</pre>
              <button
                className="flex items-center gap-1 absolute top-2 right-2 py-1 px-2.5 bg-btn-bg text-btn-text border border-btn-border rounded-md text-[0.7rem] font-semibold cursor-pointer transition-colors duration-150 hover:bg-btn-hover"
                onClick={handleCopyMarkdown}
              >
                {copiedMd ? <IconCheck size={12} /> : <IconCopy size={12} />}
                {copiedMd ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}

          {error && <div className="text-red-500 text-[0.85rem]">{error}</div>}

          {!shareUrl ? (
            <button
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-btn-bg text-btn-text border border-btn-border rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-colors duration-150 hover:enabled:bg-btn-hover disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={handleShareLink}
              disabled={loading}
            >
              <IconLink size={14} />
              {loading ? 'Creating link...' : 'Generate Share Link'}
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                className="flex-1 py-2 px-3 bg-dark-bg-secondary text-page-text border border-dark-border rounded-md text-[0.8rem] font-mono"
                value={shareUrl}
                readOnly
                onClick={(e) => e.target.select()}
              />
              <button
                className="flex items-center gap-1 py-2 px-3.5 bg-btn-bg text-btn-text border border-btn-border rounded-md text-[0.8rem] font-semibold cursor-pointer transition-colors duration-150 whitespace-nowrap hover:bg-btn-hover"
                onClick={handleCopyLink}
              >
                {copiedLink ? <IconCheck size={14} /> : <IconCopy size={14} />}
                {copiedLink ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}

          <p className="mt-0 mb-0 text-[0.75rem] text-dark-text-secondary">
            Copy the markdown diff or generate a shareable link.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
