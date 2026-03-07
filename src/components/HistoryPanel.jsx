import React, { useEffect, useState } from 'react';
import { Clock, Trash2, X } from 'lucide-react';
import { getHistory, deleteSnapshot, clearHistory } from '../lib/historyStore';
import { analytics } from '../services/analytics';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from './ui/sheet';

export default function HistoryPanel({ isOpen, onClose, onRestore }) {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getHistory().then((data) => {
        setSnapshots(data);
        setLoading(false);
      });
    }
  }, [isOpen]);

  const handleDelete = async (id) => {
    await deleteSnapshot(id);
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearAll = async () => {
    await clearHistory();
    setSnapshots([]);
  };

  const handleRestore = (snapshot) => {
    onRestore(snapshot.original, snapshot.modified);
    analytics.historyRestored();
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            <Clock size={16} />
            <span>History</span>
          </SheetTitle>
          <div className="flex items-center gap-2">
            {snapshots.length > 0 && (
              <button
                className="py-1 px-2.5 bg-btn-bg text-btn-text border border-btn-border rounded-md text-[0.7rem] cursor-pointer transition-colors duration-150 hover:bg-btn-hover"
                onClick={handleClearAll}
              >
                Clear All
              </button>
            )}
            <SheetClose className="flex items-center justify-center bg-transparent border-none text-page-text cursor-pointer p-1 rounded hover:bg-btn-hover">
              <X size={16} />
            </SheetClose>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-2">
          {loading && (
            <div className="py-6 px-4 text-center text-dark-text-secondary text-[0.85rem]">Loading...</div>
          )}
          {!loading && snapshots.length === 0 && (
            <div className="py-6 px-4 text-center text-dark-text-secondary text-[0.85rem]">
              No history yet. Edits are auto-saved after 5 seconds.
            </div>
          )}
          {snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              className="relative p-3 border border-dark-border rounded-lg mb-2 cursor-pointer transition-colors duration-150 hover:bg-dark-hover group"
              onClick={() => handleRestore(snapshot)}
            >
              <div className="text-[0.75rem] text-dark-text-secondary mb-1.5">
                {new Date(snapshot.created_at).toLocaleString()}
              </div>
              <div className="text-[0.78rem] text-page-text overflow-hidden text-ellipsis whitespace-nowrap mb-0.5">
                <span className="font-semibold mr-1 text-dark-text-secondary">Original:</span>
                <span className="font-mono text-[0.72rem]">{snapshot.preview_original || '(empty)'}</span>
              </div>
              <div className="text-[0.78rem] text-page-text overflow-hidden text-ellipsis whitespace-nowrap mb-0.5">
                <span className="font-semibold mr-1 text-dark-text-secondary">Modified:</span>
                <span className="font-mono text-[0.72rem]">{snapshot.preview_modified || '(empty)'}</span>
              </div>
              <button
                className="absolute top-2 right-2 bg-transparent border-none text-dark-text-secondary cursor-pointer p-1 rounded opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(snapshot.id);
                }}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
