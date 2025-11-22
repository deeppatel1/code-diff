import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css'; // Reuse existing styles

export default function MarkdownReader({ themeMode }) {
    const editorContainerRef = useRef(null);
    const editorRef = useRef(null);
    const [markdownContent, setMarkdownContent] = useState('# Hello Markdown\n\nStart typing on the left to see the preview on the right!');

    useEffect(() => {
        if (!editorContainerRef.current) return;

        // Determine theme based on prop
        const monacoTheme = themeMode === 'light' ? 'airbnb-light-diff' :
            themeMode === 'synthwave' ? 'airbnb-synthwave-diff' :
                themeMode === 'pink' ? 'airbnb-cute-diff' : 'airbnb-dark-diff';

        editorRef.current = monaco.editor.create(editorContainerRef.current, {
            value: markdownContent,
            language: 'markdown',
            theme: monacoTheme,
            automaticLayout: true,
            minimap: { enabled: false },
            fontFamily: 'ui-monospace, SFMono-Regular, SFMono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: 13,
            lineHeight: 20,
            wordWrap: 'on',
            renderWhitespace: 'boundary',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 }
        });

        const model = editorRef.current.getModel();
        model.onDidChangeContent(() => {
            setMarkdownContent(model.getValue());
        });

        return () => {
            if (editorRef.current) {
                editorRef.current.dispose();
            }
        };
    }, []);

    useEffect(() => {
        if (editorRef.current) {
            const monacoTheme = themeMode === 'light' ? 'airbnb-light-diff' :
                themeMode === 'synthwave' ? 'airbnb-synthwave-diff' :
                    themeMode === 'pink' ? 'airbnb-cute-diff' : 'airbnb-dark-diff';
            monaco.editor.setTheme(monacoTheme);
        }
    }, [themeMode]);

    return (
        <div className="markdown-reader-container">
            <div className="markdown-editor-pane" ref={editorContainerRef} />
            <div className="markdown-preview-pane">
                <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {markdownContent}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
