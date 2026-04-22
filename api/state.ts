// Serverless function for the public demo on Vercel.
//
// In local dev, `vite-plugins/local-api.ts` handles /api/state by reading
// data/*.json (falling back to data/seed/*.json) + ~/TASKS.md from the host
// machine.
//
// On Vercel there's no host machine and no user data — so this function
// ships a read-only snapshot of the fictional seed data bundled at build
// time. It's the same shape the Vite middleware returns, minus the parts
// that would require filesystem access at runtime.

import slack from "../data/seed/slack.json" with { type: "json" };
import prs from "../data/seed/prs.json" with { type: "json" };
import jira from "../data/seed/jira.json" with { type: "json" };
import confluence from "../data/seed/confluence.json" with { type: "json" };
import calendar from "../data/seed/calendar.json" with { type: "json" };
import gdocs from "../data/seed/gdocs.json" with { type: "json" };
import intention from "../data/seed/intention.json" with { type: "json" };
import lastSynced from "../data/seed/last_synced.json" with { type: "json" };
import tasks from "../data/seed/tasks.json" with { type: "json" };

export function GET(): Response {
  return Response.json(
    {
      tasks,
      slack,
      prs,
      jira,
      conf: confluence,
      cal: calendar,
      docs: gdocs,
      intention: intention.text,
      lastSynced,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    },
  );
}
