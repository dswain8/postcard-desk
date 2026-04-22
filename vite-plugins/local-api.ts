import type { Plugin } from "vite";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { parseTasksMd, serializeTasksMd } from "../src/lib/tasks-md";
import type { Task } from "../src/types";

const TASKS_PATH = path.join(homedir(), "TASKS.md");
const DATA_DIR = path.resolve(process.cwd(), "data");
const SEED_DIR = path.join(DATA_DIR, "seed");

const dataFile = (name: string) => path.join(DATA_DIR, `${name}.json`);
const seedFile = (name: string) => path.join(SEED_DIR, `${name}.json`);

async function readJson<T>(name: string, fallback: T): Promise<T> {
  // Prefer data/NAME.json; fall back to data/seed/NAME.json so a fresh clone
  // (no real user data yet) still boots with believable demo content.
  for (const file of [dataFile(name), seedFile(name)]) {
    if (!existsSync(file)) continue;
    try {
      return JSON.parse(await readFile(file, "utf8")) as T;
    } catch {
      continue;
    }
  }
  return fallback;
}

async function writeJson(name: string, value: unknown) {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
  await writeFile(dataFile(name), JSON.stringify(value, null, 2), "utf8");
}

function json(res: any, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readRequestBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function localApi(): Plugin {
  return {
    name: "postcard-desk-local-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        try {
          if (url === "/api/state" && req.method === "GET") {
            const md = existsSync(TASKS_PATH)
              ? await readFile(TASKS_PATH, "utf8")
              : "";
            const tasks = parseTasksMd(md);
            const [slack, prs, jira, conf, cal, docs, intention, lastSynced] =
              await Promise.all([
                readJson("slack", []),
                readJson("prs", []),
                readJson("jira", []),
                readJson("confluence", []),
                readJson("calendar", []),
                readJson("gdocs", []),
                readJson<{ text: string }>("intention", {
                  text: "Protect the focus block. Ship the thing that matters.",
                }),
                readJson<{ iso: string | null; label: string | null }>(
                  "last_synced",
                  { iso: null, label: null },
                ),
              ]);
            return json(res, 200, {
              tasks,
              slack,
              prs,
              jira,
              conf,
              cal,
              docs,
              intention: intention.text,
              lastSynced,
            });
          }

          if (url === "/api/tasks" && req.method === "PUT") {
            const body = await readRequestBody(req);
            const { tasks } = JSON.parse(body) as { tasks: Task[] };
            const md = existsSync(TASKS_PATH)
              ? await readFile(TASKS_PATH, "utf8")
              : defaultTasksMd();
            const next = serializeTasksMd(md, tasks);
            await writeFile(TASKS_PATH, next, "utf8");
            return json(res, 200, { ok: true });
          }

          if (url === "/api/intention" && req.method === "PUT") {
            const body = await readRequestBody(req);
            const { text } = JSON.parse(body) as { text: string };
            await writeJson("intention", { text });
            return json(res, 200, { ok: true });
          }

          if (url?.startsWith("/api/source/") && req.method === "PUT") {
            const source = url.split("/").pop()!;
            if (!/^[a-z]+$/.test(source))
              return json(res, 400, { error: "bad source" });
            const body = await readRequestBody(req);
            await writeJson(source, JSON.parse(body));
            return json(res, 200, { ok: true });
          }
        } catch (err: any) {
          return json(res, 500, { error: String(err?.message ?? err) });
        }
        next();
      });
    },
  };
}

function defaultTasksMd(): string {
  return [
    "# TASKS",
    "",
    "## Today",
    "",
    "## This Week",
    "",
    "## Waiting On",
    "",
    "## Done",
    "",
  ].join("\n");
}
