import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, doc, getDoc } from '../lib/firebase';
import { decompressFromEncodedURIComponent } from 'lz-string';
import { analytics } from '../services/analytics';

export default function SharedDiff() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAndRedirect = async (data) => {
      sessionStorage.setItem('diffright-session-original', data.original || '');
      sessionStorage.setItem('diffright-session-modified', data.modified || '');
      if (data.preview) {
        sessionStorage.setItem('diffright-shared-preview', data.preview);
      }
      navigate('/', { replace: true });
    };

    // lz-string compressed fallback
    if (id.startsWith('lz:')) {
      try {
        const compressed = id.slice(3);
        const json = decompressFromEncodedURIComponent(compressed);
        if (!json) throw new Error('Decompression returned null');
        const data = JSON.parse(json);
        const MAX_SIZE = 500_000;
        if ((data.original?.length || 0) > MAX_SIZE || (data.modified?.length || 0) > MAX_SIZE) {
          throw new Error('Content exceeds maximum size');
        }
        analytics.sharedDiffViewed('lz-compressed');
        loadAndRedirect(data);
      } catch {
        setError('Failed to decode shared diff from URL.');
      }
      return;
    }

    // Firebase lookup
    if (!db) {
      setError('Sharing is not available.');
      return;
    }

    getDoc(doc(db, 'diffs', id))
      .then((snap) => {
        if (!snap.exists()) {
          setError("This diff doesn't exist or has been deleted.");
        } else {
          analytics.sharedDiffViewed(id);
          loadAndRedirect(snap.data());
        }
      })
      .catch(() => {
        setError("This diff doesn't exist or has been deleted.");
      });
  }, [id, navigate]);

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-page-bg text-page-text font-[-apple-system,BlinkMacSystemFont,'Segoe_UI','Noto_Sans',Helvetica,Arial,sans-serif]">
        <div className="flex flex-col items-center justify-center h-full gap-4 text-dark-text-secondary">
          <h2 className="text-[1.1rem] font-semibold text-page-text">{error}</h2>
          <button
            className="py-1.5 px-3.5 bg-btn-bg text-btn-text border border-btn-border rounded-md text-[0.8rem] font-semibold cursor-pointer transition-colors duration-150 hover:bg-btn-hover"
            onClick={() => navigate('/')}
          >
            Go to Editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-page-bg text-page-text font-[-apple-system,BlinkMacSystemFont,'Segoe_UI','Noto_Sans',Helvetica,Arial,sans-serif]">
      <div className="flex items-center justify-center h-full text-dark-text-secondary">Loading...</div>
    </div>
  );
}
