import React, { useRef, useState, useEffect } from 'react';
import { diffWords } from 'diff';

/**
 * A simple contenteditable component that highlights edits (added/removed words)
 * as you type. The user edits text directly, and the rendered HTML updates
 * with green/red highlights for new/removed text relative to the previous version.
 *
 * WARNING: The caret position will reset or jump around when the HTML is replaced.
 * This approach is purely for demonstration. For more robust editor solutions,
 * consider Draft.js, Slate, or ProseMirror, which handle selection states gracefully.
 */
function ContentEditableDiff() {
  const [text, setText] = useState('Type here…');
  const [prevText, setPrevText] = useState('');
  const contentRef = useRef(null);

  /**
   * Convert plain text into a highlighted HTML string showing
   * which words were added/removed compared to the old text.
   */
  function buildHighlightedHTML(oldStr, newStr) {
    const differences = diffWords(oldStr, newStr);
    /*
      differences array items look like:
      [
        { value: "some unchanged text", added: undefined, removed: undefined },
        { value: " new text", added: true, removed: undefined },
        { value: " old text", added: undefined, removed: true },
        ...
      ]
    */

    return differences
      .map((part) => {
        // Escape user input to avoid HTML injection
        const escapedValue = escapeHTML(part.value);
        if (part.added) {
          // Highlight newly added text in green
          return `<span class="added">${escapedValue}</span>`;
        } else if (part.removed) {
          // Highlight removed text in red (strikethrough or background color)
          return `<span class="removed">${escapedValue}</span>`;
        }
        // Unchanged text
        return escapedValue;
      })
      .join('');
  }

  // On every render, we update the contenteditable’s HTML to reflect
  // the diff between *previous* text and *current* text.
  useEffect(() => {
    if (!contentRef.current) return;
    const highlightedHTML = buildHighlightedHTML(prevText, text);

    // Replace the DOM inside contenteditable
    contentRef.current.innerHTML = highlightedHTML;
  }, [text, prevText]);

  /**
   * Handle changes in the contenteditable:
   *  1. We compare 'prevText' to the newly typed text 'newText'.
   *  2. We set 'prevText' to the old text (which we had in 'text'),
   *     and 'text' to the new text (the just-typed content).
   */
  function handleInput(e) {
    // The user's new text is everything minus HTML tags
    const newText = e.currentTarget.textContent;
    setPrevText(text); // store the old text as "previous"
    setText(newText);  // store the new text as "current"
  }

  return (
    <div className="content-container">
      <h2>Advanced ContentEditable Diff</h2>
      <p>
        This is a <code>contenteditable</code> div. Type below, and it will
        highlight differences between the old text and the new text as you
        type. <strong>Warning:</strong> The cursor may jump around on each
        keystroke!
      </p>

      <div
        ref={contentRef}
        className="contenteditable"
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
      />
    </div>
  );
}

/**
 * Basic HTML escape to avoid injecting unsafe content.
 */
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default ContentEditableDiff;
