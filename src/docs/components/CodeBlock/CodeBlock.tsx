type CodeBlockProps = {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
};

export default function CodeBlock({
  code,
  language = "json",
  filename,
  showLineNumbers = true,
}: CodeBlockProps) {
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

  const lines = code.split("\n");
  const lineNumbers = lines.map((_, i) => i + 1).join("\n");

  return (
    <div
      style={{
        background: "var(--docs-code-bg)",
        borderRadius: "var(--docs-radius-md)",
        border: "1px solid var(--docs-code-border)",
        overflow: "hidden",
        fontFamily: "var(--docs-font-mono)",
        fontSize: "0.875rem",
        lineHeight: "1.6",
        margin: "1rem 0",
      }}
    >
      {/* Header */}
      {filename && (
        <div
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            borderBottom: "1px solid var(--docs-code-border)",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
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
          <span
            style={{
              marginLeft: "auto",
              fontSize: "11px",
              color: "var(--docs-text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {filename}
          </span>
        </div>
      )}

      <div style={{ display: "flex" }}>
        {/* Line Numbers */}
        {showLineNumbers && (
          <div
            style={{
              padding: "1rem 0.75rem",
              background: "rgba(0, 0, 0, 0.2)",
              color: "var(--docs-text-muted)",
              textAlign: "right",
              userSelect: "none",
              minWidth: "40px",
            }}
          >
            <pre style={{ margin: 0 }}>{lineNumbers}</pre>
          </div>
        )}

        {/* Code */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "1rem",
          }}
        >
          <pre style={{ margin: 0 }}>
            <code
              dangerouslySetInnerHTML={{ __html: highlightCode(code) }}
              style={{ color: "var(--docs-code-text)" }}
            />
          </pre>
        </div>
      </div>

      <style>{`
                .json-string { color: #5ce1e6; }
                .json-number { color: #8b5cf6; }
                .json-boolean { color: #22c55e; }
                .json-null { color: #f59e0b; }
                .json-key { color: #ff8f70; }
            `}</style>
    </div>
  );
}
