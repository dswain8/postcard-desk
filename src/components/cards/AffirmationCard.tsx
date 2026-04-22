import { Postcard } from "../Postcard";

// Affirmations rotate daily. Pick based on day-of-year so the index
// is stable across reloads within the same day.
const AFFIRMATIONS = [
  "You ship taste, not tickets.",
  "The work you do today compounds.",
  "Your calm is a leadership act.",
  "You don't have to be loud to be right.",
  "Say the thing. Softly, but say it.",
  "You are the one who names the elephant.",
  "Great PMs defend the user, not their ego.",
  "A clear no is a gift to your team.",
  "You move faster when you slow down to think.",
  "Opinions are cheap — you commit.",
  "You write like you mean it.",
  "Decisions beat debates.",
  "Your job is clarity, not certainty.",
  "Don't chase perfect — chase useful.",
  "You are allowed to change your mind.",
  "Small bets, quick reads, real signal.",
  "You earn trust by doing what you said.",
  "Front-load the point. Your readers will thank you.",
  "Anti-sell: name the tradeoff before they ask.",
  "If it matters, it goes in writing.",
  "Your best work is grounded in code, not vibes.",
  "One well-run meeting saves ten bad ones.",
  "You hold the line on the bar.",
  "Brevity is a kindness.",
  "The simple version usually wins.",
  "You are allowed to be wrong — and fast about it.",
  "You make the complex feel obvious.",
  "Great products come from people who notice.",
  "Taste is a muscle. You trained it.",
  "Show up. That's already most of it.",
  "The right question is worth ten good answers.",
];

const dayOfYear = (d: Date) => {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
};

export function AffirmationCard({ rotation }: { rotation: number }) {
  const today = new Date();
  const idx = dayOfYear(today) % AFFIRMATIONS.length;
  const line = AFFIRMATIONS[idx];
  const stamp = `DAY ${dayOfYear(today)}`;

  return (
    <Postcard
      tone="var(--affirm)"
      toneSoft="var(--affirm-soft)"
      label="Affirmation"
      subtitle="one line, read it twice"
      stampText={stamp}
      rotation={rotation}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flex: 1,
          minHeight: 110,
          padding: "4px 2px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--hand)",
            fontSize: 28,
            lineHeight: 1.22,
            color: "var(--ink)",
            textAlign: "left",
          }}
        >
          “{line}”
        </div>
        <div
          style={{
            marginTop: 12,
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--ink-4)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          — for{" "}
          {today.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
    </Postcard>
  );
}
