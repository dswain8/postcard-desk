import { Postcard, EmptyRow, miniBtn } from "../Postcard";
import type { DeskApi, DeskState } from "../../types";

export function PRCard({
  state,
  api,
  rotation,
}: {
  state: DeskState;
  api: DeskApi;
  rotation: number;
}) {
  const stale = state.prs.filter((p) => p.stale).length;
  return (
    <Postcard
      tone="var(--gh)"
      toneSoft="var(--gh-soft)"
      label="GitHub · PRs"
      subtitle={stale > 0 ? "One's gone stale" : "All fresh"}
      stampText="PAR AVION"
      rotation={rotation}
      count={state.prs.length}
    >
      {state.prs.length === 0 ? (
        <EmptyRow>Clean slate — ship something.</EmptyRow>
      ) : (
        state.prs.map((p) => (
          <div
            key={p.id}
            style={{ padding: "8px 0", borderBottom: "1px dashed var(--rule)" }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <span
                style={{
                  color: p.stale ? "var(--slack)" : "var(--conf)",
                  fontSize: 10,
                }}
              >
                ●
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--ink)",
                  lineHeight: 1.35,
                  flex: 1,
                }}
              >
                {p.title}
              </span>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: p.stale ? "var(--slack)" : "var(--ink-4)",
                  whiteSpace: "nowrap",
                }}
              >
                {p.age}
                {p.stale && " · stale"}
              </span>
            </div>
            <div
              style={{
                marginLeft: 16,
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "var(--ink-3)",
                marginTop: 2,
              }}
            >
              {p.repo} · #{p.num} · {p.reviewers} reviewer
              {p.reviewers === 1 ? "" : "s"}
            </div>
            <div
              style={{ display: "flex", gap: 4, marginTop: 5, marginLeft: 16 }}
            >
              <button
                style={miniBtn}
                onClick={() =>
                  api.addTask({
                    title: `Review PR #${p.num}`,
                    priority: 2,
                    due: "today",
                  })
                }
              >
                + task
              </button>
              <button style={miniBtn} onClick={() => api.dismissPR(p.id)}>
                reviewed
              </button>
            </div>
          </div>
        ))
      )}
    </Postcard>
  );
}
