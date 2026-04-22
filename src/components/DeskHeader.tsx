import { useEffect, useRef, useState } from "react";
import type { DeskApi, DeskState } from "../types";

export function DeskHeader({
  state,
  api,
  ownerName,
  onRefresh,
  refreshing,
  lastRefresh,
}: {
  state: DeskState;
  api: DeskApi;
  ownerName: string;
  onRefresh: () => void;
  refreshing: boolean;
  lastRefresh: Date | null;
}) {
  const now = new Date();
  const hour = now.getHours();
  const greet =
    hour < 5
      ? "Still up"
      : hour < 11
        ? "Morning"
        : hour < 14
          ? "Hello"
          : hour < 18
            ? "Afternoon"
            : hour < 22
              ? "Evening"
              : "Late night";
  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const urgentSlack = state.slack.filter((s) => s.urgent).length;
  const today = state.tasks.filter((t) => t.due === "today" && !t.done).length;

  const [val, setVal] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "/" || e.key === "n" || e.key === "N") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = () => {
    if (val.trim()) {
      api.addTask({ title: val.trim(), due: "today", priority: 2 });
      setVal("");
    }
  };

  return (
    <div style={{ padding: "32px 40px 16px", color: "var(--card-cream)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "oklch(0.86 0.02 80 / 0.75)",
              fontWeight: 600,
            }}
          >
            {date} · {time}
          </div>
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(32px, 4.5vw, 52px)",
              fontWeight: 400,
              lineHeight: 1.05,
              margin: "6px 0 4px",
              letterSpacing: "-0.02em",
              color: "var(--card-cream)",
            }}
          >
            {greet},{" "}
            <span style={{ fontStyle: "italic", color: "oklch(0.85 0.06 35)" }}>
              {ownerName}
            </span>
            .
          </h1>
          <div
            style={{
              fontFamily: "var(--hand)",
              fontSize: 22,
              color: "oklch(0.88 0.025 80 / 0.92)",
              marginTop: 2,
            }}
          >
            {today} postcard{today === 1 ? "" : "s"} pinned for today ·{" "}
            {urgentSlack} awaiting reply
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 16px",
              background: "oklch(0.96 0.018 88 / 0.96)",
              borderRadius: 30,
              border: "1px solid oklch(0.82 0.025 75)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
              width: 380,
              maxWidth: "100%",
            }}
          >
            <span
              style={{
                fontFamily: "var(--serif)",
                fontSize: 18,
                color: "var(--todo)",
                fontStyle: "italic",
              }}
            >
              ✎
            </span>
            <input
              ref={ref}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") ref.current?.blur();
              }}
              placeholder="Pin a new postcard… (press / or N)"
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                fontFamily: "var(--serif)",
                fontSize: 15,
                color: "var(--ink)",
                outline: "none",
                fontStyle: val ? "normal" : "italic",
              }}
            />
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9,
                color: "var(--ink-4)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              ⏎
            </span>
          </div>

          <RefreshStamp
            onClick={onRefresh}
            refreshing={refreshing}
            lastRefresh={lastRefresh}
          />
        </div>
      </div>
    </div>
  );
}

function RefreshStamp({
  onClick,
  refreshing,
  lastRefresh,
}: {
  onClick: () => void;
  refreshing: boolean;
  lastRefresh: Date | null;
}) {
  const title = lastRefresh
    ? `Last synced ${lastRefresh.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`
    : "Refresh";
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={refreshing}
      style={{
        width: 52,
        height: 52,
        border: "1.5px solid oklch(0.86 0.06 35)",
        borderRadius: 4,
        padding: 3,
        background: "oklch(0.96 0.018 88 / 0.96)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        transform: "rotate(-4deg)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
        cursor: refreshing ? "progress" : "pointer",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          border: "1px dashed oklch(0.85 0.06 35)",
          borderRadius: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          padding: 2,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          style={{
            animation: refreshing
              ? "spin-stamp 0.9s linear infinite"
              : undefined,
          }}
        >
          <path
            d="M20 12a8 8 0 1 1-2.34-5.66"
            stroke="oklch(0.45 0.12 30)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M20 4v5h-5"
            stroke="oklch(0.45 0.12 30)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 7,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "oklch(0.45 0.12 30)",
            textTransform: "uppercase",
          }}
        >
          Sync
        </span>
      </div>
    </button>
  );
}
