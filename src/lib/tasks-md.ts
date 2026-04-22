import type { Priority, Task, DueBucket } from "../types";

// Canonical fallback headings — used only if TASKS.md has no matching section.
const BUCKET_FALLBACK: Record<DueBucket | "done", string> = {
  today: "## Today",
  week: "## This Week",
  waiting: "## Waiting On",
  done: "## Done",
};

// Identify which bucket a "## ..." heading belongs to.
// Matches by prefix (case-insensitive) so "## Today (Sun Apr 19)" counts as today,
// "## This Week (Week of Apr 13)" counts as week, etc. Unknown sections (e.g.
// "## Up Next", "## Daily Log") return null and are preserved verbatim.
function bucketFromHeading(line: string): DueBucket | "done" | null {
  const m = line.match(/^## (.+)$/);
  if (!m) return null;
  const label = m[1].trim().toLowerCase();
  if (label.startsWith("today")) return "today";
  if (label.startsWith("this week")) return "week";
  if (label.startsWith("waiting on") || label.startsWith("waiting")) return "waiting";
  if (label.startsWith("done")) return "done";
  return null;
}

const PRIORITY_RE = /\[P([123])\]/;

export function parseTasksMd(md: string): Task[] {
  const lines = md.split("\n");
  const tasks: Task[] = [];
  let currentBucket: DueBucket | "done" | null = null;
  let currentTask: Task | null = null;

  const flush = () => {
    if (currentTask) {
      tasks.push(currentTask);
      currentTask = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();

    if (/^## /.test(line)) {
      flush();
      currentBucket = bucketFromHeading(line);
      continue;
    }

    if (!currentBucket) continue;

    const item = line.match(/^- \[( |x|X)\] (.*)$/);
    if (item) {
      flush();
      const done = item[1].toLowerCase() === "x";
      let text = item[2].trim();
      let priority: Priority = 2;
      const pm = text.match(PRIORITY_RE);
      if (pm) {
        priority = Number(pm[1]) as Priority;
        text = text.replace(PRIORITY_RE, "").trim();
      }
      currentTask = {
        id: `md-${tasks.length}-${i}`,
        title: text,
        note: "",
        priority,
        due: currentBucket === "done" ? "today" : currentBucket,
        done: currentBucket === "done" ? true : done,
        created: Date.now() - i * 60_000,
      };
      continue;
    }

    if (currentTask) {
      const noteMatch = line.match(/^\s{2,}(.+)$/);
      if (noteMatch) {
        const noteLine = noteMatch[1].replace(/^[*_]+|[*_]+$/g, "").trim();
        if (noteLine) {
          currentTask.note = currentTask.note
            ? `${currentTask.note} ${noteLine}`
            : noteLine;
        }
        continue;
      }
      if (line === "") continue;
      flush();
    }
  }
  flush();
  return tasks;
}

export function serializeTasksMd(md: string, tasks: Task[]): string {
  const lines = md.split("\n");
  const buckets: Record<DueBucket | "done", Task[]> = {
    today: tasks.filter((t) => !t.done && t.due === "today"),
    week: tasks.filter((t) => !t.done && t.due === "week"),
    waiting: tasks.filter((t) => !t.done && t.due === "waiting"),
    done: tasks.filter((t) => t.done),
  };

  const sections = findBucketSections(lines);
  const matched = new Set<DueBucket | "done">();

  const out: string[] = [];
  let cursor = 0;
  for (const s of sections) {
    // Preserve everything between the last section and this one (including
    // unrecognized sections like "## Up Next" or "## Daily Log").
    out.push(...lines.slice(cursor, s.start));
    // Preserve the original heading line verbatim so user suffixes survive.
    out.push(lines[s.start]);
    out.push("");
    matched.add(s.bucket);
    const arr = buckets[s.bucket];
    if (arr.length === 0) {
      out.push("_nothing here_");
      out.push("");
    } else {
      for (const t of arr) {
        out.push(renderTask(t));
        if (t.note) out.push(`  _${t.note}_`);
      }
      out.push("");
    }
    cursor = s.end;
  }
  out.push(...lines.slice(cursor));

  // If a bucket has tasks but no matching section exists in the md, append one
  // so the task isn't silently dropped.
  const missing = (["today", "week", "waiting", "done"] as const).filter(
    (k) => !matched.has(k) && buckets[k].length > 0,
  );
  if (missing.length > 0) {
    if (out.length && out[out.length - 1] !== "") out.push("");
    for (const k of missing) {
      out.push(BUCKET_FALLBACK[k]);
      out.push("");
      for (const t of buckets[k]) {
        out.push(renderTask(t));
        if (t.note) out.push(`  _${t.note}_`);
      }
      out.push("");
    }
  }

  return out.join("\n");
}

function renderTask(t: Task): string {
  const box = t.done ? "[x]" : "[ ]";
  const prio = !t.done ? `[P${t.priority}] ` : "";
  return `- ${box} ${prio}${t.title}`;
}

type BucketSection = {
  bucket: DueBucket | "done";
  start: number; // line index of the `## ...` heading
  end: number; // exclusive — line index of the next `## ...` heading or EOF
};

// Returns only the bucket sections we manage, preserving source order.
// If the same bucket appears multiple times, only the FIRST is taken as
// authoritative; later duplicates are treated as unrecognized (preserved verbatim).
function findBucketSections(lines: string[]): BucketSection[] {
  const allH2: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^## /.test(lines[i])) allH2.push(i);
  }

  const result: BucketSection[] = [];
  const seen = new Set<DueBucket | "done">();
  for (let k = 0; k < allH2.length; k++) {
    const start = allH2[k];
    const b = bucketFromHeading(lines[start]);
    if (!b || seen.has(b)) continue;
    seen.add(b);
    const end = k + 1 < allH2.length ? allH2[k + 1] : lines.length;
    result.push({ bucket: b, start, end });
  }
  return result.sort((a, b) => a.start - b.start);
}
