import { Postcard, EmptyRow, miniBtn } from "../Postcard";
import type { DeskApi, DeskState } from "../../types";

export function SlackCard({
  state,
  api,
  rotation,
}: {
  state: DeskState;
  api: DeskApi;
  rotation: number;
}) {
  const urgent = state.slack.filter((s) => s.urgent).length;
  return (
    <Postcard
      tone="var(--slack)"
      toneSoft="var(--slack-soft)"
      label="Slack"
      subtitle={urgent > 0 ? `${urgent} awaiting reply` : "Inbox calm"}
      stampText="MENTIONED"
      rotation={rotation}
      count={state.slack.length}
    >
      {state.slack.length === 0 ? (
        <EmptyRow>Clear skies. Inbox zero.</EmptyRow>
      ) : (
        state.slack.map((m) => (
          <div
            key={m.id}
            style={{
              padding: "8px 0 8px 10px",
              borderBottom: "1px dashed var(--rule)",
              borderLeft: m.urgent
                ? "3px solid var(--slack)"
                : "3px solid transparent",
              marginLeft: -10,
              paddingLeft: 10,
              opacity: m.urgent ? 1 : 0.62,
              transition: "opacity 0.25s ease, border-color 0.25s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "baseline",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: m.urgent ? 700 : 500,
                  color: "var(--ink)",
                }}
              >
                {m.who}
              </span>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: m.urgent ? "var(--slack)" : "var(--ink-4)",
                }}
              >
                {m.channel}
              </span>
              {!m.urgent && (
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 9,
                    color: "var(--ink-4)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  · read
                </span>
              )}
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: "var(--ink-4)",
                  marginLeft: "auto",
                }}
              >
                {m.ago}
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: 13,
                color: m.urgent ? "var(--ink-2)" : "var(--ink-3)",
                lineHeight: 1.45,
                marginTop: 3,
                textDecoration: m.urgent ? "none" : "none",
              }}
            >
              {m.msg}
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
              <button
                style={miniBtn}
                onClick={() =>
                  api.addTask({
                    title: `Reply to ${m.who}: ${m.msg.slice(0, 50)}`,
                    priority: m.urgent ? 1 : 2,
                    due: "today",
                  })
                }
              >
                + task
              </button>
              {m.urgent && (
                <button style={miniBtn} onClick={() => api.markSlackRead(m.id)}>
                  mark read
                </button>
              )}
              <button style={miniBtn} onClick={() => api.dismissSlack(m.id)}>
                archive
              </button>
            </div>
          </div>
        ))
      )}
    </Postcard>
  );
}
