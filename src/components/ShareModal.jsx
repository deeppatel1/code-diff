import React, { useState, useEffect } from 'react';
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

export default function ShareModal({ isOpen, onClose, getContent }) {
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState('');
  const [content, setContent] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const data = getContent();
      setContent(data);
    }
  }, [isOpen, getContent]);

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
        const savePromise = setDoc(doc(db, 'diffs', id), {
          user_id: user?.uid ?? null,
          original,
          modified,
          original_lang: originalLang,
          modified_lang: modifiedLang,
          preview: preview || null,
          created_at: new Date().toISOString(),
        });
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 3000)
        );
        await Promise.race([savePromise, timeout]);

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
            Generate a shareable link to this diff.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
