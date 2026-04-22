import { Postcard, EmptyRow, miniBtn } from "../Postcard";
import type { DeskApi, DeskState } from "../../types";

export function JiraCard({
  state,
  api,
  rotation,
}: {
  state: DeskState;
  api: DeskApi;
  rotation: number;
}) {
  return (
    <Postcard
      tone="var(--jira)"
      toneSoft="var(--jira-soft)"
      label="Jira · Tickets"
      subtitle="click status to advance"
      stampText="IN MOTION"
      rotation={rotation}
      count={state.jira.length}
    >
      {state.jira.length === 0 ? (
        <EmptyRow>No tickets in your court.</EmptyRow>
      ) : (
        state.jira.map((j) => {
          const c =
            j.status === "In Progress"
              ? "var(--jira)"
              : j.status === "Review"
                ? "var(--conf)"
                : j.status === "Blocked"
                  ? "var(--slack)"
                  : j.status === "Done"
                    ? "var(--ink-4)"
                    : "var(--ink-3)";
          return (
            <div
              key={j.id}
              style={{
                padding: "8px 0",
                borderBottom: "1px dashed var(--rule)",
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <button
                onClick={() => api.advanceJira(j.id)}
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: c,
                  background: `color-mix(in oklch, ${c} 12%, transparent)`,
                  border: `1px solid ${c}`,
                  padding: "2px 6px",
                  borderRadius: 2,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {j.status}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ink)",
                    lineHeight: 1.35,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      color: "var(--ink-3)",
                      marginRight: 6,
                    }}
                  >
                    {j.key}
                  </span>
                  {j.title}
                </div>
              </div>
              <button onClick={() => api.snoozeJira(j.id)} style={miniBtn}>
                snooze
              </button>
            </div>
          );
        })
      )}
    </Postcard>
  );
}
