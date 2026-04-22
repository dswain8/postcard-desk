import { useCallback, useEffect, useRef, useState } from "react";
import { Postcard, miniBtn } from "../Postcard";

const PRESETS = [25, 45, 60, 90] as const;
const STORAGE = "postcard-desk:focus-timer";

type Persisted =
  | { mode: "idle"; targetMin: number }
  | { mode: "running"; targetMin: number; endAt: number }
  | { mode: "paused"; targetMin: number; remainingMs: number };

const load = (): Persisted => {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { mode: "idle", targetMin: 45 };
};

const save = (p: Persisted) => {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(p));
  } catch {
    /* ignore */
  }
};

const fmt = (ms: number) => {
  if (ms < 0) ms = 0;
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// Encouragements rotate by progress phase so the card has personality.
const phaseCopy = (mode: "idle" | "running" | "paused", pct: number) => {
  if (mode === "idle") return "Flip the glass.";
  if (mode === "paused") return "The sand waits for you.";
  if (pct < 0.1) return "Heads down. One thing.";
  if (pct < 0.3) return "Phone face-down. Good.";
  if (pct < 0.55) return "You're in the cave now.";
  if (pct < 0.8) return "Flow state — don't look up.";
  if (pct < 0.95) return "Almost home.";
  return "Seconds to glory.";
};

const idleStamp = (m: number) => (m >= 60 ? "DEEP" : "FOCUS");

// --- Hourglass ---------------------------------------------------------------
// Draws an hourglass whose top bulb drains and bottom bulb fills as `pct`
// goes 0 → 1. The geometry lives in a 100x140 viewBox so everything else
// can scale with the card.
function Hourglass({
  pct,
  running,
  done,
}: {
  pct: number;
  running: boolean;
  done: boolean;
}) {
  // Geometry (viewBox 100x140)
  const top = 14;
  const neckTop = 66;
  const neckBot = 74;
  const bot = 126;
  const bulbHalfAtCap = 32; // half-width at the top/bottom caps
  const bulbHalfAtNeck = 3; // half-width at the neck

  // Sand surface y in the top bulb: at pct=0 it sits flush with the cap,
  // at pct=1 it has reached the neck (empty).
  const topSandY = top + pct * (neckTop - top);
  const widthAt = (y: number, startY: number, endY: number) => {
    // Linear interpolation of half-width between cap and neck
    const t = (y - startY) / (endY - startY);
    return bulbHalfAtCap + t * (bulbHalfAtNeck - bulbHalfAtCap);
  };
  const topHalf = widthAt(topSandY, top, neckTop);

  // Sand pile in the bottom bulb: starts flat at the base and rises toward
  // the neck as pct → 1. We want a small mound shape, so the surface is a
  // shallow arc rather than a straight line.
  const botSandY = bot - pct * (bot - neckBot);
  const botHalf = widthAt(botSandY, bot, neckBot);

  // A very subtle sway while running — makes the glass feel alive.
  // (Applied via CSS class animation on the outer <g>.)
  return (
    <svg
      viewBox="0 0 100 140"
      width="100%"
      height="100%"
      style={{ display: "block", overflow: "visible" }}
      aria-hidden
    >
      <defs>
        <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.75 0.14 75)" />
          <stop offset="100%" stopColor="oklch(0.6 0.15 60)" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.9 0.02 170 / 0.35)" />
          <stop offset="50%" stopColor="oklch(0.98 0.01 170 / 0.15)" />
          <stop offset="100%" stopColor="oklch(0.88 0.02 170 / 0.5)" />
        </linearGradient>
        <clipPath id="topBulbClip">
          <polygon
            points={`${50 - bulbHalfAtCap},${top} ${50 + bulbHalfAtCap},${top} ${50 + bulbHalfAtNeck},${neckTop} ${50 - bulbHalfAtNeck},${neckTop}`}
          />
        </clipPath>
        <clipPath id="botBulbClip">
          <polygon
            points={`${50 - bulbHalfAtNeck},${neckBot} ${50 + bulbHalfAtNeck},${neckBot} ${50 + bulbHalfAtCap},${bot} ${50 - bulbHalfAtCap},${bot}`}
          />
        </clipPath>
      </defs>

      <g
        className={running ? "hourglass-sway" : undefined}
        style={{ transformOrigin: "50px 70px" }}
      >
        {/* Wooden frame — top and bottom caps */}
        <rect
          x={10}
          y={top - 6}
          width={80}
          height={6}
          rx={2}
          fill="var(--focus)"
          opacity={0.85}
        />
        <rect
          x={10}
          y={bot}
          width={80}
          height={6}
          rx={2}
          fill="var(--focus)"
          opacity={0.85}
        />
        {/* Side posts connecting caps (skinny wooden dowels) */}
        <rect
          x={12}
          y={top - 6}
          width={3}
          height={bot - top + 12}
          rx={1.5}
          fill="var(--focus)"
          opacity={0.65}
        />
        <rect
          x={85}
          y={top - 6}
          width={3}
          height={bot - top + 12}
          rx={1.5}
          fill="var(--focus)"
          opacity={0.65}
        />

        {/* Glass body — top and bottom bulbs */}
        <polygon
          points={`${50 - bulbHalfAtCap},${top} ${50 + bulbHalfAtCap},${top} ${50 + bulbHalfAtNeck},${neckTop} ${50 - bulbHalfAtNeck},${neckTop}`}
          fill="url(#glass)"
          stroke="var(--focus)"
          strokeWidth={1.3}
          strokeLinejoin="round"
        />
        <polygon
          points={`${50 - bulbHalfAtNeck},${neckBot} ${50 + bulbHalfAtNeck},${neckBot} ${50 + bulbHalfAtCap},${bot} ${50 - bulbHalfAtCap},${bot}`}
          fill="url(#glass)"
          stroke="var(--focus)"
          strokeWidth={1.3}
          strokeLinejoin="round"
        />
        {/* Neck connector */}
        <rect
          x={50 - bulbHalfAtNeck - 0.5}
          y={neckTop}
          width={bulbHalfAtNeck * 2 + 1}
          height={neckBot - neckTop}
          fill="url(#glass)"
          stroke="var(--focus)"
          strokeWidth={1.1}
        />

        {/* Top sand — shrinks as pct → 1 */}
        {pct < 1 && (
          <g clipPath="url(#topBulbClip)">
            <polygon
              points={`${50 - topHalf},${topSandY} ${50 + topHalf},${topSandY} ${50 + bulbHalfAtNeck},${neckTop} ${50 - bulbHalfAtNeck},${neckTop}`}
              fill="url(#sand)"
            />
            {/* Subtle glint on the sand surface */}
            <line
              x1={50 - topHalf * 0.75}
              y1={topSandY + 0.8}
              x2={50 + topHalf * 0.75}
              y2={topSandY + 0.8}
              stroke="oklch(0.96 0.05 80)"
              strokeWidth={0.8}
              opacity={0.6}
            />
          </g>
        )}

        {/* Falling sand stream — only while running and mid-flow */}
        {running && pct > 0.001 && pct < 0.999 && (
          <g className="hourglass-stream">
            <rect
              x={49.4}
              y={neckTop + 1}
              width={1.2}
              height={neckBot - neckTop + 18}
              fill="url(#sand)"
              opacity={0.9}
            />
            {/* Tiny grains for texture */}
            <circle
              cx={50}
              cy={neckBot + 4}
              r={0.7}
              fill="oklch(0.7 0.14 65)"
            />
            <circle
              cx={49.6}
              cy={neckBot + 10}
              r={0.6}
              fill="oklch(0.7 0.14 65)"
              opacity={0.85}
            />
          </g>
        )}

        {/* Bottom sand pile — grows as pct → 1 */}
        {pct > 0 && (
          <g clipPath="url(#botBulbClip)">
            <polygon
              points={`${50 - botHalf},${botSandY} ${50 + botHalf},${botSandY} ${50 + bulbHalfAtCap},${bot} ${50 - bulbHalfAtCap},${bot}`}
              fill="url(#sand)"
            />
            {/* A little mound on top of the pile */}
            <ellipse
              cx={50}
              cy={botSandY}
              rx={Math.max(2, botHalf * 0.45)}
              ry={1.6}
              fill="url(#sand)"
            />
            <line
              x1={50 - botHalf * 0.6}
              y1={botSandY + 0.8}
              x2={50 + botHalf * 0.6}
              y2={botSandY + 0.8}
              stroke="oklch(0.96 0.05 80)"
              strokeWidth={0.8}
              opacity={0.5}
            />
          </g>
        )}
      </g>

      {/* Celebration sparkles when done */}
      {done && (
        <g className="hourglass-spark">
          {[
            { x: 20, y: 20, r: 1.5 },
            { x: 80, y: 24, r: 1.2 },
            { x: 15, y: 90, r: 1.3 },
            { x: 85, y: 100, r: 1.4 },
            { x: 35, y: 8, r: 1.1 },
            { x: 65, y: 10, r: 1.1 },
          ].map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill="oklch(0.8 0.18 80)"
              style={{ animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </g>
      )}
    </svg>
  );
}

export function FocusTimerCard({ rotation }: { rotation: number }) {
  const [state, setState] = useState<Persisted>(load);
  const [, force] = useState(0);
  const tickRef = useRef<number | null>(null);
  const [justFinished, setJustFinished] = useState(false);

  // Persist on change
  useEffect(() => save(state), [state]);

  // Ticker — only runs when mode is running
  useEffect(() => {
    if (state.mode !== "running") return;
    const tick = () => {
      force((n) => n + 1);
      if (Date.now() >= state.endAt) {
        setState({ mode: "idle", targetMin: state.targetMin });
        setJustFinished(true);
        // Confetti window lasts 6s, then fades
        window.setTimeout(() => setJustFinished(false), 6000);
        try {
          const AC = (window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext })
              .webkitAudioContext) as typeof AudioContext | undefined;
          if (AC) {
            const ac = new AC();
            // Two-note "ding-ding" that feels celebratory
            [
              { freq: 880, at: 0 },
              { freq: 1320, at: 0.25 },
            ].forEach(({ freq, at }) => {
              const o = ac.createOscillator();
              const g = ac.createGain();
              o.connect(g);
              g.connect(ac.destination);
              o.frequency.value = freq;
              o.type = "sine";
              g.gain.setValueAtTime(0.0001, ac.currentTime + at);
              g.gain.exponentialRampToValueAtTime(
                0.28,
                ac.currentTime + at + 0.02,
              );
              g.gain.exponentialRampToValueAtTime(
                0.0001,
                ac.currentTime + at + 0.55,
              );
              o.start(ac.currentTime + at);
              o.stop(ac.currentTime + at + 0.6);
            });
          }
        } catch {
          /* ignore */
        }
      }
    };
    tickRef.current = window.setInterval(tick, 250);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [state]);

  const start = useCallback(
    (min?: number) => {
      const targetMin = min ?? state.targetMin;
      const endAt = Date.now() + targetMin * 60_000;
      setState({ mode: "running", targetMin, endAt });
      setJustFinished(false);
    },
    [state.targetMin],
  );

  const pause = useCallback(() => {
    if (state.mode !== "running") return;
    setState({
      mode: "paused",
      targetMin: state.targetMin,
      remainingMs: Math.max(0, state.endAt - Date.now()),
    });
  }, [state]);

  const resume = useCallback(() => {
    if (state.mode !== "paused") return;
    setState({
      mode: "running",
      targetMin: state.targetMin,
      endAt: Date.now() + state.remainingMs,
    });
  }, [state]);

  const reset = useCallback(() => {
    setState({ mode: "idle", targetMin: state.targetMin });
    setJustFinished(false);
  }, [state.targetMin]);

  const setPreset = useCallback((min: number) => {
    setState({ mode: "idle", targetMin: min });
  }, []);

  const remainingMs =
    state.mode === "running"
      ? state.endAt - Date.now()
      : state.mode === "paused"
        ? state.remainingMs
        : state.targetMin * 60_000;

  const progress = 1 - remainingMs / (state.targetMin * 60_000);
  const pct = Math.max(0, Math.min(1, progress));

  const subtitle =
    state.mode === "running"
      ? "the sand is falling"
      : state.mode === "paused"
        ? "paused — pick up when ready"
        : justFinished
          ? "done — take a breath"
          : "flip the glass, vanish for a bit";

  return (
    <Postcard
      tone="var(--focus)"
      toneSoft="var(--focus-soft)"
      label="Deep Work"
      subtitle={subtitle}
      stampText={
        state.mode === "running"
          ? "RUNNING"
          : justFinished
            ? "DONE"
            : idleStamp(state.targetMin)
      }
      rotation={rotation}
    >
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: 14,
          marginTop: 2,
          marginBottom: 10,
        }}
      >
        {/* Hourglass column */}
        <div
          data-nodrag="true"
          style={{
            width: 78,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className={justFinished ? "hourglass-wobble" : undefined}
            style={{ width: "100%", height: 150 }}
          >
            <Hourglass
              pct={pct}
              running={state.mode === "running"}
              done={justFinished}
            />
          </div>
        </div>

        {/* Readout column */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 38,
              fontWeight: 700,
              color: "var(--ink)",
              letterSpacing: "0.02em",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {fmt(remainingMs)}
          </div>
          <div
            style={{
              marginTop: 6,
              fontFamily: "var(--hand)",
              fontSize: 19,
              lineHeight: 1.15,
              color: "var(--ink-2)",
            }}
          >
            {phaseCopy(state.mode, pct)}
          </div>
          <div
            style={{
              marginTop: 8,
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: "0.1em",
              color: "var(--ink-4)",
              textTransform: "uppercase",
            }}
          >
            {state.targetMin}-min block · {Math.round(pct * 100)}%
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 5,
          justifyContent: "center",
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        {PRESETS.map((m) => (
          <button
            key={m}
            onClick={() => setPreset(m)}
            disabled={state.mode !== "idle"}
            title={
              state.mode !== "idle"
                ? "Reset to change the span"
                : `Switch to ${m} minutes`
            }
            style={{
              ...miniBtn,
              background:
                state.targetMin === m ? "var(--focus)" : "transparent",
              color:
                state.targetMin === m ? "var(--card-cream)" : "var(--ink-3)",
              borderColor:
                state.targetMin === m ? "var(--focus)" : "var(--rule)",
              opacity: state.mode !== "idle" && state.targetMin !== m ? 0.4 : 1,
              cursor: state.mode !== "idle" ? "not-allowed" : "pointer",
            }}
          >
            {m}m
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
        {state.mode === "idle" && (
          <button
            onClick={() => start()}
            style={{
              ...miniBtn,
              background: "var(--focus)",
              color: "var(--card-cream)",
              borderColor: "var(--focus)",
              padding: "4px 16px",
              fontSize: 10,
            }}
          >
            Flip it ⏳
          </button>
        )}
        {state.mode === "running" && (
          <button
            onClick={pause}
            style={{ ...miniBtn, padding: "4px 14px", fontSize: 10 }}
          >
            Pause
          </button>
        )}
        {state.mode === "paused" && (
          <button
            onClick={resume}
            style={{
              ...miniBtn,
              background: "var(--focus)",
              color: "var(--card-cream)",
              borderColor: "var(--focus)",
              padding: "4px 14px",
              fontSize: 10,
            }}
          >
            Resume
          </button>
        )}
        {state.mode !== "idle" && (
          <button
            onClick={reset}
            style={{ ...miniBtn, padding: "4px 14px", fontSize: 10 }}
          >
            Reset
          </button>
        )}
      </div>
    </Postcard>
  );
}
