import { useState } from "react";
import { Postcard, EmptyRow, miniBtn } from "../Postcard";
import type {
  AgentApi,
  AgentState,
  DeskApi,
  DeskState,
  SlackMessage,
} from "../../types";

export function SlackCard({
  state,
  api,
  agentState,
  agentApi,
  rotation,
}: {
  state: DeskState;
  api: DeskApi;
  agentState: AgentState;
  agentApi: AgentApi;
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
        state.slack.map((m) => {
          const run = agentState.runs.find(
            (r) =>
              r.source === "slack" &&
              r.action === "draft_reply" &&
              r.itemId === m.id &&
              ["queued", "running", "complete"].includes(r.status),
          );
          const draft = agentState.drafts.find((d) => d.itemId === m.id);
          return (
            <SlackRow
              key={m.id}
              message={m}
              api={api}
              agentApi={agentApi}
              runStatus={run?.status}
              hasDraft={Boolean(draft)}
            />
          );
        })
      )}
    </Postcard>
  );
}

function SlackRow({
  message: m,
  api,
  agentApi,
  runStatus,
  hasDraft,
}: {
  message: SlackMessage;
  api: DeskApi;
  agentApi: AgentApi;
  runStatus?: string;
  hasDraft: boolean;
}) {
  const [hover, setHover] = useState(false);
  const [error, setError] = useState("");
  const busy = runStatus === "queued" || runStatus === "running";
  const drafted = hasDraft || runStatus === "complete";

  const spawnDraft = async () => {
    setError("");
    try {
      await agentApi.spawnSlackDraft(m);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    }
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
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
        }}
      >
        {m.msg}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
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
        <button
          aria-label={`Draft Slack reply to ${m.who}`}
          title={`Draft reply to ${m.who}`}
          disabled={busy || drafted}
          onClick={spawnDraft}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
          style={{
            ...miniBtn,
            opacity: hover || busy || drafted ? 1 : 0,
            transform:
              hover || busy || drafted ? "translateY(0)" : "translateY(2px)",
            transition: "opacity 0.18s ease, transform 0.18s ease",
            color: drafted ? "var(--conf)" : "var(--slack)",
            borderColor: drafted ? "var(--conf)" : "var(--slack)",
            background: drafted
              ? "color-mix(in oklch, var(--conf) 9%, transparent)"
              : busy
                ? "color-mix(in oklch, var(--slack) 8%, transparent)"
                : "transparent",
            cursor: busy || drafted ? "default" : "pointer",
          }}
        >
          {drafted ? "drafted" : busy ? "drafting" : "draft"}
        </button>
      </div>
      {error && (
        <div
          style={{
            marginTop: 5,
            fontFamily: "var(--mono)",
            fontSize: 9,
            color: "var(--slack)",
            lineHeight: 1.35,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
