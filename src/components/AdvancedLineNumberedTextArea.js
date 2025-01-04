import React, { useRef, useEffect } from 'react';

function AdvancedLineNumberedTextarea({
  value,
  onChange,
  rows = 10,
  placeholder = '',
}) {
  const textRef = useRef(null);
  const lineRef = useRef(null);

  // Count how many lines in 'value' by splitting on newline
  const lineCount = value.split('\n').length;
  // Build a string of line numbers: "1\n2\n3\n..."
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');

  // Scroll sync: when main text scrolls, match the line-number scroll
  const handleScroll = () => {
    if (textRef.current && lineRef.current) {
      lineRef.current.scrollTop = textRef.current.scrollTop;
    }
  };

  // Also keep line-number scroll in sync when the text changes (in case it reflows)
  useEffect(() => {
    if (textRef.current && lineRef.current) {
      lineRef.current.scrollTop = textRef.current.scrollTop;
    }
  }, [value]);

  return (
    <div className="advanced-line-numbered-textarea">
      {/* Read-only line-number box */}
      <textarea
        ref={lineRef}
        className="line-numbers"
        value={lineNumbers}
        readOnly
      />
      {/* Editable text box */}
      <textarea
        ref={textRef}
        className="text-input-box"
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onScroll={handleScroll}
      />
    </div>
  );
}

export default AdvancedLineNumberedTextarea;
