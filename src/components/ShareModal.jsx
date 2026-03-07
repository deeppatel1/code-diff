import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { db, doc, setDoc, getOrCreateAnonUser } from '../lib/firebase';
import { nanoid } from 'nanoid';
import { analytics } from '../services/analytics';

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
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setShareUrl('');
    setError('');
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="share-modal-overlay" onClick={handleClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <h3>Share Diff</h3>
          <button className="share-modal-close" onClick={handleClose}>
            <X size={16} />
          </button>
        </div>
        <div className="share-modal-body">
          {!shareUrl && !error && (
            <button
              className="share-modal-generate-btn"
              onClick={handleShare}
              disabled={loading}
            >
              {loading ? 'Creating link...' : 'Generate Share Link'}
            </button>
          )}
          {error && <div className="share-modal-error">{error}</div>}
          {shareUrl && (
            <div className="share-modal-link-container">
              <input
                className="share-modal-link-input"
                value={shareUrl}
                readOnly
                onClick={(e) => e.target.select()}
              />
              <button className="share-modal-copy-btn" onClick={handleCopy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
          <p className="share-modal-note">
            Anyone with the link can view this diff (read-only).
          </p>
        </div>
      </div>
    </div>
  );
}
