import type { CSSProperties } from "react";
import type { LastSynced } from "../state";

const kbd: CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: 10,
  padding: "1px 5px",
  border: "1px solid oklch(0.7 0.02 80 / 0.4)",
  borderRadius: 2,
  background: "oklch(0.4 0.04 55 / 0.4)",
  color: "oklch(0.92 0.02 80 / 0.85)",
};

function formatSynced(
  lastSynced: LastSynced | undefined,
  lastRefresh: Date | null,
): string {
  if (lastSynced?.label) return `Synced ${lastSynced.label}`;
  if (lastSynced?.iso) {
    const d = new Date(lastSynced.iso);
    if (!Number.isNaN(d.getTime())) {
      return `Synced ${d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }
  }
  if (lastRefresh) {
    return `Loaded ${lastRefresh.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }
  return "Not synced";
}

export function DeskFooter({
  lastRefresh,
  lastSynced,
}: {
  lastRefresh: Date | null;
  lastSynced?: LastSynced;
}) {
  const synced = formatSynced(lastSynced, lastRefresh);
  return (
    <div
      style={{
        padding: "20px 40px 40px",
        fontFamily: "var(--mono)",
        fontSize: 10,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "oklch(0.88 0.02 80 / 0.55)",
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <div>The Postcard Desk · Private Edition · {synced}</div>
      <div>
        <kbd style={kbd}>/</kbd> capture · <kbd style={kbd}>N</kbd> new task ·
        click cards to edit
      </div>
    </div>
  );
}
