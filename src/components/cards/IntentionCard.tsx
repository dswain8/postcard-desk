import { useEffect, useState } from "react";
import { Postcard } from "../Postcard";
import type { DeskApi, DeskState } from "../../types";

export function IntentionCard({
  state,
  api,
  rotation,
}: {
  state: DeskState;
  api: DeskApi;
  rotation: number;
}) {
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(state.intention);
  useEffect(() => setDraft(state.intention), [state.intention]);

  const commit = () => {
    api.setIntention(draft.trim() || state.intention);
    setEdit(false);
  };

  const now = new Date();
  const stamp = `${now
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase()} ${now.getDate()}`;

  return (
    <Postcard
      tone="var(--intent)"
      toneSoft="var(--intent-soft)"
      label="Today's Intention"
      subtitle="What I'm really optimizing for"
      stampText={stamp}
      rotation={rotation}
      wide
    >
      {edit ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraft(state.intention);
              setEdit(false);
            }
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit();
          }}
          style={{
            width: "100%",
            border: "none",
            background: "transparent",
            fontFamily: "var(--hand)",
            fontSize: 26,
            color: "var(--ink)",
            outline: "none",
            resize: "vertical",
            minHeight: 70,
            lineHeight: 1.3,
          }}
        />
      ) : (
        <div
          onClick={() => setEdit(true)}
          style={{
            cursor: "text",
            fontFamily: "var(--hand)",
            fontSize: 28,
            lineHeight: 1.25,
            color: "var(--ink)",
          }}
        >
          {state.intention || "Click to set today's intention…"}
        </div>
      )}
      <div
        style={{
          marginTop: 10,
          fontFamily: "var(--mono)",
          fontSize: 10,
          color: "var(--ink-4)",
          letterSpacing: "0.08em",
        }}
      >
        — written {edit ? "now" : "this morning"}
      </div>
    </Postcard>
  );
}
