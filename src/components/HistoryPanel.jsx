import React, { useEffect, useState, useRef } from 'react';
import { IconClock, IconTrash, IconX, IconDeviceFloppy, IconShare, IconRefresh, IconPencil, IconCheck } from '@tabler/icons-react';
import { getHistory, deleteSnapshot, clearHistory, renameSnapshot } from '../lib/historyStore';
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
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const editRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getHistory().then((data) => {
        setSnapshots(data);
        setLoading(false);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  const handleDelete = async (id) => {
    await deleteSnapshot(id);
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearAll = async () => {
    await clearHistory();
    setSnapshots([]);
  };

  const handleRestore = (snapshot) => {
    if (editingId) return;
    onRestore(snapshot.original, snapshot.modified, {
      diffHighlight: snapshot.diff_highlight,
      sideBySide: snapshot.side_by_side,
    });
    analytics.historyRestored();
    onClose();
  };

  const handleStartRename = (e, snapshot) => {
    e.stopPropagation();
    setEditingId(snapshot.id);
    setEditName(snapshot.name || '');
  };

  const handleSaveRename = async (e) => {
    e.stopPropagation();
    const name = editName.trim();
    await renameSnapshot(editingId, name);
    setSnapshots((prev) =>
      prev.map((s) => (s.id === editingId ? { ...s, name } : s))
    );
    setEditingId(null);
  };

  const handleRenameKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveRename(e);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            <IconClock size={16} />
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
              <IconX size={16} />
            </SheetClose>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-2">
          {loading && (
            <div className="py-6 px-4 text-center text-dark-text-secondary text-[0.85rem]">Loading...</div>
          )}
          {!loading && snapshots.length === 0 && (
            <div className="py-6 px-4 text-center text-dark-text-secondary text-[0.85rem]">
              No history yet. Click Save to store a diff.
            </div>
          )}
          {snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              className="relative p-3 border border-dark-border rounded-lg mb-2 cursor-pointer transition-colors duration-150 hover:bg-dark-hover group"
              onClick={() => handleRestore(snapshot)}
            >
              {snapshot.name && editingId !== snapshot.id && (
                <div className="text-[0.82rem] font-semibold text-page-text mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {snapshot.name}
                </div>
              )}
              {editingId === snapshot.id && (
                <div className="flex items-center gap-1.5 mb-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    ref={editRef}
                    className="flex-1 py-0.5 px-1.5 bg-dark-bg-secondary text-page-text border border-dark-border rounded text-[0.78rem] outline-none focus:border-lang-indicator"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    placeholder="Enter a name..."
                  />
                  <button
                    className="flex items-center justify-center bg-transparent border-none text-green-500 cursor-pointer p-0.5 rounded hover:bg-green-500/10"
                    onClick={handleSaveRename}
                    title="Save name"
                  >
                    <IconCheck size={14} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[0.75rem] text-dark-text-secondary mb-1.5">
                {snapshot.source === 'save' && <IconDeviceFloppy size={12} />}
                {snapshot.source === 'share' && <IconShare size={12} />}
                {(!snapshot.source || snapshot.source === 'auto') && <IconRefresh size={12} />}
                <span>{snapshot.source === 'save' ? 'Saved' : snapshot.source === 'share' ? 'Shared' : 'Auto-saved'}</span>
                <span className="opacity-50">·</span>
                <span>{new Date(snapshot.created_at).toLocaleString()}</span>
              </div>
              <div className="text-[0.78rem] text-page-text overflow-hidden text-ellipsis whitespace-nowrap mb-0.5">
                <span className="font-semibold mr-1 text-dark-text-secondary">Original:</span>
                <span className="font-mono text-[0.72rem]">{snapshot.preview_original || '(empty)'}</span>
              </div>
              <div className="text-[0.78rem] text-page-text overflow-hidden text-ellipsis whitespace-nowrap mb-0.5">
                <span className="font-semibold mr-1 text-dark-text-secondary">Modified:</span>
                <span className="font-mono text-[0.72rem]">{snapshot.preview_modified || '(empty)'}</span>
              </div>
              {editingId !== snapshot.id && (
                <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <button
                    className="bg-transparent border-none text-dark-text-secondary cursor-pointer p-1 rounded hover:text-page-text hover:bg-btn-hover"
                    onClick={(e) => handleStartRename(e, snapshot)}
                    title="Rename"
                  >
                    <IconPencil size={14} />
                  </button>
                  <button
                    className="bg-transparent border-none text-dark-text-secondary cursor-pointer p-1 rounded hover:text-red-500 hover:bg-red-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(snapshot.id);
                    }}
                    title="Delete"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
