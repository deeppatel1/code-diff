import React, { useEffect, useState } from 'react';
import { Clock, Trash2, X } from 'lucide-react';
import { getHistory, deleteSnapshot, clearHistory } from '../lib/historyStore';
import { analytics } from '../services/analytics';

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

  if (!isOpen) return null;

  return (
    <div className="history-panel-overlay" onClick={onClose}>
      <div className="history-panel" onClick={(e) => e.stopPropagation()}>
        <div className="history-panel-header">
          <div className="history-panel-title">
            <Clock size={16} />
            <span>History</span>
          </div>
          <div className="history-panel-actions">
            {snapshots.length > 0 && (
              <button className="history-clear-btn" onClick={handleClearAll}>
                Clear All
              </button>
            )}
            <button className="history-close-btn" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="history-panel-body">
          {loading && <div className="history-empty">Loading...</div>}
          {!loading && snapshots.length === 0 && (
            <div className="history-empty">No history yet. Edits are auto-saved after 5 seconds.</div>
          )}
          {snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              className="history-item"
              onClick={() => handleRestore(snapshot)}
            >
              <div className="history-item-time">
                {new Date(snapshot.created_at).toLocaleString()}
              </div>
              <div className="history-item-preview">
                <span className="history-preview-label">Original:</span>
                <span className="history-preview-text">{snapshot.preview_original || '(empty)'}</span>
              </div>
              <div className="history-item-preview">
                <span className="history-preview-label">Modified:</span>
                <span className="history-preview-text">{snapshot.preview_modified || '(empty)'}</span>
              </div>
              <button
                className="history-item-delete"
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
      </div>
    </div>
  );
}
