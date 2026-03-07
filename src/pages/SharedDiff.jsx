import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import * as monaco from 'monaco-editor';
import { db, doc, getDoc } from '../lib/firebase';
import { analytics } from '../services/analytics';

export default function SharedDiff() {
  const { id } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [diffData, setDiffData] = useState(null);

  useEffect(() => {
    if (!db) {
      setError('Sharing is not available.');
      setLoading(false);
      return;
    }

    getDoc(doc(db, 'diffs', id))
      .then((snap) => {
        if (!snap.exists()) {
          setError("This diff doesn't exist or has been deleted.");
        } else {
          setDiffData(snap.data());
          analytics.sharedDiffViewed(id);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("This diff doesn't exist or has been deleted.");
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!diffData || !containerRef.current || editorRef.current) return;

    editorRef.current = monaco.editor.createDiffEditor(containerRef.current, {
      theme: 'airbnb-dark-diff',
      automaticLayout: true,
      renderSideBySide: true,
      minimap: { enabled: false },
      fontFamily: 'ui-monospace, SFMono-Regular, SFMono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 13,
      lineHeight: 20,
      wordWrap: 'on',
      readOnly: true,
      originalEditable: false,
      scrollBeyondLastLine: false,
      glyphMargin: false,
    });

    const originalModel = monaco.editor.createModel(
      diffData.original,
      diffData.original_lang || 'plaintext'
    );
    const modifiedModel = monaco.editor.createModel(
      diffData.modified,
      diffData.modified_lang || 'plaintext'
    );
    editorRef.current.setModel({ original: originalModel, modified: modifiedModel });

    editorRef.current.getOriginalEditor().updateOptions({
      padding: { top: 16, bottom: 16 },
    });
    editorRef.current.getModifiedEditor().updateOptions({
      padding: { top: 16, bottom: 16 },
    });

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
      originalModel.dispose();
      modifiedModel.dispose();
    };
  }, [diffData]);

  const handleOpenInEditor = () => {
    if (diffData) {
      sessionStorage.setItem('diffright-session-original', diffData.original);
      sessionStorage.setItem('diffright-session-modified', diffData.modified);
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="shared-diff-page">
        <div className="shared-diff-message">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-diff-page">
        <Helmet>
          <title>Diff Not Found - Diff Please</title>
        </Helmet>
        <div className="shared-diff-message">
          <h2>{error}</h2>
          <button className="shared-diff-btn" onClick={() => navigate('/')}>
            Go to Editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-diff-page">
      <Helmet>
        <title>Shared Diff - Diff Please</title>
      </Helmet>
      <div className="shared-diff-header">
        <span className="shared-diff-title">Shared Diff (read-only)</span>
        <button className="shared-diff-btn" onClick={handleOpenInEditor}>
          Open in Editor
        </button>
      </div>
      <div className="shared-diff-editor" ref={containerRef} />
    </div>
  );
}
