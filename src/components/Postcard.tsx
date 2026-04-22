import { useState, type CSSProperties, type ReactNode } from "react";

type PostcardProps = {
  tone: string;
  toneSoft: string;
  label: string;
  count?: number;
  subtitle?: string;
  stampText?: string;
  rotation?: number;
  wide?: boolean;
  tall?: boolean;
  children: ReactNode;
};

export function Postcard({
  tone,
  toneSoft,
  label,
  count,
  subtitle,
  stampText,
  rotation = 0,
  wide,
  tall,
  children,
}: PostcardProps) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        perspective: 1400,
        gridColumn: wide ? "span 2" : undefined,
        gridRow: tall ? "span 2" : undefined,
      }}
    >
      <div
        style={{
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `rotate(${rotation}deg) ${hover ? "translateY(-3px)" : ""}`,
          transition: "transform 0.55s cubic-bezier(.2,.8,.3,1)",
        }}
      >
        <div
          className="postcard-paper"
          style={{
            position: "relative",
            borderRadius: 4,
            padding: "18px 20px 16px",
            boxShadow: `0 1px 2px rgba(0,0,0,0.08), 0 ${hover ? 22 : 14}px ${hover ? 48 : 32}px rgba(0,0,0,${hover ? 0.24 : 0.18})`,
            border: "1px solid oklch(0.84 0.02 78)",
            minHeight: 180,
            backfaceVisibility: "hidden",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 12,
              gap: 14,
              minHeight: 44,
            }}
          >
            <div
              style={{ minWidth: 0, flex: 1, paddingRight: stampText ? 4 : 0 }}
            >
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: tone,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  lineHeight: 1.2,
                }}
              >
                <span>{label}</span>
                {count != null && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 18,
                      height: 18,
                      padding: "0 5px",
                      borderRadius: 9,
                      background: toneSoft,
                      color: tone,
                      fontSize: 10,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {count}
                  </span>
                )}
              </div>
              {subtitle && (
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 12,
                    fontStyle: "italic",
                    color: "var(--ink-3)",
                    marginTop: 3,
                    lineHeight: 1.3,
                  }}
                >
                  {subtitle}
                </div>
              )}
            </div>
            {stampText && (
              <Stamp tone={tone} toneSoft={toneSoft} text={stampText} />
            )}
          </div>

          <div
            style={{ borderTop: `1px solid ${toneSoft}`, marginBottom: 10 }}
          />

          <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Stamp({
  tone,
  toneSoft,
  text,
}: {
  tone: string;
  toneSoft: string;
  text: string;
}) {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        border: `1.5px solid ${tone}`,
        borderRadius: 3,
        padding: 2,
        background: toneSoft,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        transform: "rotate(3deg)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          border: `1px dashed ${tone}`,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--mono)",
          fontSize: 8,
          fontWeight: 700,
          color: tone,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          textAlign: "center",
          lineHeight: 1.05,
          padding: 2,
        }}
      >
        {text}
      </div>
    </div>
  );
}

export function PriorityBead({
  p,
  onClick,
  size = 18,
}: {
  p: 1 | 2 | 3;
  onClick?: () => void;
  size?: number;
}) {
  const tone =
    p === 1 ? "var(--slack)" : p === 2 ? "var(--todo)" : "var(--ink-3)";
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    background: tone,
    border: "2px solid var(--card-cream)",
    boxShadow: `0 0 0 1px ${tone}`,
    fontFamily: "var(--mono)",
    fontSize: 9,
    fontWeight: 700,
    color: "var(--card-cream)",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };
  return (
    <button onClick={onClick} title="Cycle priority" style={style}>
      P{p}
    </button>
  );
}

export const miniBtn: CSSProperties = {
  padding: "2px 7px",
  fontFamily: "var(--mono)",
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--ink-3)",
  background: "transparent",
  border: "1px solid var(--rule)",
  borderRadius: 2,
};

export function EmptyRow({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: "14px 4px",
        fontFamily: "var(--serif)",
        fontStyle: "italic",
        fontSize: 13,
        color: "var(--ink-4)",
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}
