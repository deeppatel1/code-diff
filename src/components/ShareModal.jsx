import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { db, doc, setDoc, getOrCreateAnonUser } from '../lib/firebase';
import { nanoid } from 'nanoid';
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
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleShare = async () => {
    if (!db) {
      setError('Sharing is not available (Firebase not configured).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await getOrCreateAnonUser();
      const { original, modified, originalLang, modifiedLang } = getContent();

      const id = nanoid(10);
      await setDoc(doc(db, 'diffs', id), {
        user_id: user?.uid ?? null,
        original,
        modified,
        original_lang: originalLang,
        modified_lang: modifiedLang,
        created_at: new Date().toISOString(),
      });

      const url = `${window.location.origin}${import.meta.env.BASE_URL}s/${id}`;
      setShareUrl(url);
      analytics.diffShared();
    } catch (err) {
      setError('Failed to create share link. Please try again.');
      console.error('Share failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    analytics.linkCopied();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setShareUrl('');
    setError('');
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Diff</DialogTitle>
          <DialogClose className="bg-transparent border-none text-page-text cursor-pointer p-1 rounded hover:bg-btn-hover">
            <X size={16} />
          </DialogClose>
        </DialogHeader>
        <div className="p-5">
          {!shareUrl && !error && (
            <button
              className="w-full py-2.5 px-4 bg-btn-bg text-btn-text border border-btn-border rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-colors duration-150 hover:enabled:bg-btn-hover disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={handleShare}
              disabled={loading}
            >
              {loading ? 'Creating link...' : 'Generate Share Link'}
            </button>
          )}
          {error && <div className="text-red-500 text-[0.85rem] mb-3">{error}</div>}
          {shareUrl && (
            <div className="flex gap-2">
              <input
                className="flex-1 py-2 px-3 bg-dark-bg-secondary text-page-text border border-dark-border rounded-md text-[0.8rem] font-mono"
                value={shareUrl}
                readOnly
                onClick={(e) => e.target.select()}
              />
              <button
                className="flex items-center gap-1 py-2 px-3.5 bg-btn-bg text-btn-text border border-btn-border rounded-md text-[0.8rem] font-semibold cursor-pointer transition-colors duration-150 whitespace-nowrap hover:bg-btn-hover"
                onClick={handleCopy}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
          <p className="mt-3 mb-0 text-[0.75rem] text-dark-text-secondary">
            Anyone with the link can view this diff (read-only).
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
