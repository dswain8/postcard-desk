import { Postcard, EmptyRow } from "../Postcard";
import type { DeskState } from "../../types";

export function ConfluenceCard({
  state,
  rotation,
}: {
  state: DeskState;
  rotation: number;
}) {
  return (
    <Postcard
      tone="var(--conf)"
      toneSoft="var(--conf-soft)"
      label="Docs · Confluence"
      subtitle="recent in your spaces"
      stampText="FILED"
      rotation={rotation}
      count={state.conf.length}
    >
      {state.conf.length === 0 ? (
        <EmptyRow>Quiet in the archives.</EmptyRow>
      ) : (
        state.conf.map((c, i) => (
          <div
            key={c.id}
            style={{
              display: "flex",
              gap: 10,
              padding: "7px 0",
              borderBottom:
                i < state.conf.length - 1 ? "1px dashed var(--rule)" : "none",
            }}
          >
            <div
              style={{
                width: 64,
                fontFamily: "var(--mono)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color:
                  c.kind === "edited"
                    ? "var(--jira)"
                    : c.kind === "shared"
                      ? "var(--conf)"
                      : "var(--slack)",
                flexShrink: 0,
              }}
            >
              {c.kind === "edited"
                ? "You edited"
                : c.kind === "shared"
                  ? "Shared"
                  : "Mentioned"}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 13,
                  color: "var(--ink)",
                  lineHeight: 1.35,
                }}
              >
                {c.title}
              </div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: "var(--ink-3)",
                }}
              >
                {c.space} · {c.by} · {c.ago}
              </div>
            </div>
          </div>
        ))
      )}
    </Postcard>
  );
}
