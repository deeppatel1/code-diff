import React, { useState } from 'react';
import { IconX, IconSend } from '@tabler/icons-react';
import { db, doc, setDoc, getOrCreateAnonUser } from '../lib/firebase';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from './ui/dialog';

export default function FeedbackModal({ isOpen, onClose }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const text = message.trim();
    if (!text) return;

    setLoading(true);
    try {
      if (db) {
        const user = await getOrCreateAnonUser();
        const id = nanoid();
        await setDoc(doc(db, 'feedback', id), {
          id,
          user_id: user?.uid ?? null,
          message: text,
          created_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
        });
      }
      toast.success('Thanks for your feedback!');
      setMessage('');
      onClose();
    } catch (err) {
      console.error('Feedback failed:', err);
      toast.error('Failed to send feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogClose className="bg-transparent border-none text-page-text cursor-pointer p-1 rounded hover:bg-btn-hover">
            <IconX size={16} />
          </DialogClose>
        </DialogHeader>
        <div className="p-5 flex flex-col gap-3">
          <textarea
            className="w-full min-h-[120px] py-2.5 px-3 bg-dark-bg-secondary text-page-text border border-dark-border rounded-lg text-[0.85rem] font-sans resize-y outline-none focus:border-lang-indicator"
            placeholder="What's on your mind? Bug reports, feature requests, or general feedback..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-btn-bg text-btn-text border border-btn-border rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-colors duration-150 hover:enabled:bg-btn-hover disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={loading || !message.trim()}
          >
            <IconSend size={14} />
            {loading ? 'Sending...' : 'Send Feedback'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
