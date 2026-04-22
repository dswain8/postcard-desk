import { Postcard, EmptyRow } from "../Postcard";
import type { DeskState, GoogleDoc } from "../../types";

const KIND_LABEL: Record<GoogleDoc["kind"], string> = {
  doc: "Doc",
  sheet: "Sheet",
  slide: "Slides",
  pdf: "PDF",
  other: "File",
};

export function GDocsCard({
  state,
  rotation,
}: {
  state: DeskState;
  rotation: number;
}) {
  return (
    <Postcard
      tone="var(--gdocs)"
      toneSoft="var(--gdocs-soft)"
      label="Docs · Google Drive"
      subtitle="recently touched in your Drive"
      stampText="DRAFT"
      rotation={rotation}
      count={state.docs.length}
    >
      {state.docs.length === 0 ? (
        <EmptyRow>Nothing new in the Drive.</EmptyRow>
      ) : (
        state.docs.map((d, i) => {
          const row = (
            <>
              <div
                style={{
                  width: 54,
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "var(--gdocs)",
                  flexShrink: 0,
                }}
              >
                {KIND_LABEL[d.kind] ?? "File"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 13,
                    color: "var(--ink)",
                    lineHeight: 1.35,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.title}
                </div>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    color: "var(--ink-3)",
                  }}
                >
                  {d.by} · {d.ago}
                </div>
              </div>
            </>
          );

          const baseStyle: React.CSSProperties = {
            display: "flex",
            gap: 10,
            padding: "7px 0",
            borderBottom:
              i < state.docs.length - 1 ? "1px dashed var(--rule)" : "none",
            alignItems: "center",
          };

          return d.url ? (
            <a
              key={d.id}
              href={d.url}
              target="_blank"
              rel="noreferrer"
              style={{ ...baseStyle, textDecoration: "none", color: "inherit" }}
            >
              {row}
            </a>
          ) : (
            <div key={d.id} style={baseStyle}>
              {row}
            </div>
          );
        })
      )}
    </Postcard>
  );
}
