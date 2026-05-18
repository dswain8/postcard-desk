import { useState } from "react";
import type { CSSProperties } from "react";
import type { AgentApi, AgentDraft, AgentRun, AgentState } from "../types";

export function AgentTray({
  agentState,
  agentApi,
  loading,
}: {
  agentState: AgentState;
  agentApi: AgentApi;
  loading: boolean;
}) {
  const active = agentState.runs.filter((run) =>
    ["queued", "running"].includes(run.status),
  );
  const failed = agentState.runs.filter((run) => run.status === "failed").slice(0, 2);
  const show = agentState.drafts.length > 0 || active.length > 0 || failed.length > 0;

  if (!show) return null;

  const budgetUsed = agentState.budget.spentUsd + agentState.budget.reservedUsd;
  const budgetLabel = `$${budgetUsed.toFixed(2)} / $${agentState.budget.dailyCapUsd.toFixed(2)}`;

  return (
    <section
      style={{
        margin: "0 40px",
        padding: "13px 16px 15px",
        borderRadius: 4,
        border: "1px solid oklch(0.72 0.025 75 / 0.5)",
        background: "oklch(0.96 0.018 88 / 0.93)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
        animation: "slide-up 0.22s ease-out",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--slack)",
            fontWeight: 700,
          }}
        >
          Agent drafts
        </div>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink-4)",
          }}
        >
          {loading ? "checking" : budgetLabel}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 10,
        }}
      >
        {active.map((run) => (
          <RunPill key={run.id} run={run} />
        ))}
        {agentState.drafts.map((draft) => (
          <DraftCard key={draft.id} draft={draft} agentApi={agentApi} />
        ))}
        {failed.map((run) => (
          <RunPill key={run.id} run={run} />
        ))}
      </div>
    </section>
  );
}

function RunPill({ run }: { run: AgentRun }) {
  const tone = run.status === "failed" ? "var(--slack)" : "var(--jira)";
  return (
    <div
      style={{
        padding: "9px 10px",
        border: `1px dashed ${tone}`,
        background: `color-mix(in oklch, ${tone} 7%, transparent)`,
        borderRadius: 3,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: tone,
            fontWeight: 700,
          }}
        >
          {run.status}
        </div>
        <div
          style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-4)" }}
        >
          ${run.budget.maxUsd.toFixed(2)}
        </div>
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 12,
          fontWeight: 600,
          color: "var(--ink)",
          lineHeight: 1.35,
        }}
      >
        {run.title}
      </div>
      {run.error && (
        <div
          style={{
            marginTop: 4,
            fontFamily: "var(--mono)",
            fontSize: 9,
            color: "var(--slack)",
            lineHeight: 1.35,
          }}
        >
          {run.error.slice(0, 160)}
        </div>
      )}
    </div>
  );
}

function DraftCard({
  draft,
  agentApi,
}: {
  draft: AgentDraft;
  agentApi: AgentApi;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(draft.draftText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1300);
  };

  const discard = async () => {
    setBusy(true);
    try {
      await agentApi.discardDraft(draft.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      style={{
        padding: "10px 12px",
        border: "1px solid var(--rule)",
        borderRadius: 3,
        background: "oklch(0.99 0.008 88 / 0.72)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--ink)",
            lineHeight: 1.35,
          }}
        >
          {draft.title}
        </div>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            color: draft.contextFresh ? "var(--conf)" : "var(--todo)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            whiteSpace: "nowrap",
          }}
        >
          {draft.contextFresh ? "fresh" : "snapshot"}
        </div>
      </div>

      <p
        style={{
          margin: "7px 0 8px",
          fontFamily: "var(--serif)",
          fontSize: 13,
          color: "var(--ink-2)",
          lineHeight: 1.45,
          whiteSpace: "pre-wrap",
        }}
      >
        {draft.draftText}
      </p>

      {draft.warnings.length > 0 && (
        <div
          style={{
            marginBottom: 8,
            fontFamily: "var(--mono)",
            fontSize: 9,
            color: "var(--todo)",
            lineHeight: 1.35,
          }}
        >
          {draft.warnings[0]}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <button onClick={copy} style={actionButton("var(--conf)")}>
          {copied ? "Copied" : "Copy"}
        </button>
        <button disabled={busy} onClick={discard} style={actionButton("var(--ink-3)")}>
          Discard
        </button>
      </div>
    </article>
  );
}

function actionButton(tone: string): CSSProperties {
  return {
    padding: "4px 9px",
    border: `1px solid ${tone}`,
    borderRadius: 2,
    background: "transparent",
    color: tone,
    fontFamily: "var(--mono)",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  };
}
