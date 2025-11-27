import React, { useState, useEffect, useRef } from "react";

interface Props {
  code: string;
  onChange: (newCode: string) => void;
  language?: string;
}

export default function LiveCodeEditor({
  code,
  onChange,
  language = "json",
}: Props) {
  const [value, setValue] = useState(code);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    setValue(code);
  }, [code]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (preRef.current) {
      preRef.current.scrollTop = e.target.scrollTop;
      preRef.current.scrollLeft = e.target.scrollLeft;
    }

    try {
      if (language === "json") {
        JSON.parse(newValue);
      }
      setError(null);
      onChange(newValue);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const highlightCode = (code: string) => {
    if (language !== "json") return code;
    return code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
        (match) => {
          let cls = "json-number";
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = "json-key";
            } else {
              cls = "json-string";
            }
          } else if (/true|false/.test(match)) {
            cls = "json-boolean";
          } else if (/null/.test(match)) {
            cls = "json-null";
          }
          return `<span class="${cls}">${match}</span>`;
        },
      );
  };

  const lineNumbers = value
    .split("\n")
    .map((_, i) => i + 1)
    .join("\n");

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        background: "var(--docs-code-bg)",
        borderRadius: "var(--docs-radius-md)",
        border: `1px solid ${error ? "var(--docs-accent)" : isFocused ? "rgba(92, 225, 230, 0.4)" : "var(--docs-code-border)"}`,
        overflow: "hidden",
        display: "flex",
        transition: "border-color 0.2s ease",
        boxShadow: isFocused ? "0 0 0 3px rgba(92, 225, 230, 0.1)" : "none",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "36px",
          background: "rgba(0, 0, 0, 0.3)",
          borderBottom: "1px solid var(--docs-code-border)",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: "8px",
          zIndex: 5,
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: "flex", gap: "6px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#ff5f57",
            }}
          />
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#febc2e",
            }}
          />
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#28c840",
            }}
          />
        </div>

        {/* Filename */}
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--docs-font-mono)",
            fontSize: "11px",
            color: "var(--docs-text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          model.jem
        </span>

        {/* Live indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginLeft: "12px",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: error ? "var(--docs-accent)" : "#22c55e",
              animation: error ? "none" : "pulse 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontFamily: "var(--docs-font-mono)",
              fontSize: "10px",
              color: error ? "var(--docs-accent)" : "#22c55e",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {error ? "Error" : "Live"}
          </span>
        </div>
      </div>

      {/* Line Numbers */}
      <div
        style={{
          paddingTop: "48px",
          paddingBottom: "12px",
          paddingLeft: "12px",
          paddingRight: "12px",
          background: "rgba(0, 0, 0, 0.2)",
          color: "var(--docs-text-muted)",
          fontFamily: "var(--docs-font-mono)",
          fontSize: "13px",
          lineHeight: "1.6",
          textAlign: "right",
          userSelect: "none",
          minWidth: "48px",
          overflow: "hidden",
        }}
      >
        <pre style={{ margin: 0 }}>{lineNumbers}</pre>
      </div>

      {/* Editor Container */}
      <div
        style={{
          position: "relative",
          flex: 1,
          height: "100%",
          overflow: "hidden",
          paddingTop: "36px",
        }}
      >
        {/* Highlight Overlay */}
        <pre
          ref={preRef}
          aria-hidden="true"
          style={{
            margin: 0,
            padding: "12px",
            position: "absolute",
            top: "36px",
            left: 0,
            width: "100%",
            height: "calc(100% - 36px)",
            color: "var(--docs-code-text)",
            fontFamily: "var(--docs-font-mono)",
            fontSize: "13px",
            lineHeight: "1.6",
            whiteSpace: "pre",
            overflow: "hidden",
            pointerEvents: "none",
            boxSizing: "border-box",
          }}
          dangerouslySetInnerHTML={{ __html: highlightCode(value) }}
        />

        {/* Actual Input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onScroll={handleScroll}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          spellCheck={false}
          style={{
            margin: 0,
            padding: "12px",
            position: "absolute",
            top: "36px",
            left: 0,
            width: "100%",
            height: "calc(100% - 36px)",
            color: "transparent",
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            fontFamily: "var(--docs-font-mono)",
            fontSize: "13px",
            lineHeight: "1.6",
            whiteSpace: "pre",
            overflow: "auto",
            caretColor: "var(--docs-accent-secondary)",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Error Toast */}
      {error && (
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            left: "12px",
            right: "12px",
            background: "rgba(255, 92, 92, 0.95)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "var(--docs-radius-sm)",
            fontSize: "12px",
            fontFamily: "var(--docs-font-mono)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backdropFilter: "blur(8px)",
          }}
        >
          <span style={{ fontSize: "14px" }}>⚠️</span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {error}
          </span>
        </div>
      )}

      <style>{`
                .json-string { color: #5ce1e6; }
                .json-number { color: #8b5cf6; }
                .json-boolean { color: #22c55e; }
                .json-null { color: #f59e0b; }
                .json-key { color: #ff8f70; }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
    </div>
  );
}
