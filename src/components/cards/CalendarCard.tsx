import { Postcard, EmptyRow } from "../Postcard";
import type { DeskState } from "../../types";

export function CalendarCard({
  state,
  rotation,
}: {
  state: DeskState;
  rotation: number;
}) {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const monthUpper = now
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  return (
    <Postcard
      tone="var(--cal)"
      toneSoft="var(--cal-soft)"
      label="Today · Calendar"
      subtitle="times in your local zone"
      stampText={`${now.getDate()} ${monthUpper}`}
      rotation={rotation}
      count={state.cal.length}
    >
      {state.cal.length === 0 ? (
        <EmptyRow>An open calendar. Guard it.</EmptyRow>
      ) : (
        state.cal.map((e, i) => {
          const [h, m] = e.time.split(":").map(Number);
          const eh = h + m / 60;
          const past = eh < currentHour - 0.5;
          const isNow = Math.abs(eh - currentHour) < 0.75;
          return (
            <div
              key={e.id}
              style={{
                display: "flex",
                gap: 10,
                padding: "7px 0",
                borderBottom:
                  i < state.cal.length - 1 ? "1px dashed var(--rule)" : "none",
                opacity: past ? 0.45 : 1,
              }}
            >
              <div
                style={{
                  width: 44,
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  fontWeight: 700,
                  color: isNow ? "var(--slack)" : "var(--ink)",
                }}
              >
                {e.time}
              </div>
              <div
                style={{
                  width: 2,
                  background:
                    e.kind === "focus"
                      ? "var(--cal)"
                      : e.kind === "recurring"
                        ? "var(--ink-3)"
                        : "var(--jira)",
                  borderRadius: 1,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}
                >
                  {isNow && (
                    <span
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 9,
                        color: "var(--slack)",
                        fontWeight: 700,
                        marginRight: 5,
                        letterSpacing: "0.08em",
                      }}
                    >
                      NOW
                    </span>
                  )}
                  {e.title}
                </div>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    color: "var(--ink-3)",
                  }}
                >
                  {e.loc}
                  {e.kind === "focus" && (
                    <span style={{ color: "var(--cal)" }}> · focus</span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </Postcard>
  );
}
