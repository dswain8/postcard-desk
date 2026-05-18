import type { Plugin } from "vite";
import { readdir, readFile, unlink, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { parseTasksMd, serializeTasksMd } from "../src/lib/tasks-md";
import type {
  AgentBudget,
  AgentConfig,
  AgentDraft,
  AgentRun,
  AgentSpawnRequest,
  SlackMessage,
  Task,
} from "../src/types";

const TASKS_PATH = path.join(homedir(), "TASKS.md");
const DATA_DIR = path.resolve(process.cwd(), "data");
const SEED_DIR = path.join(DATA_DIR, "seed");
const AGENT_DIR = path.resolve(process.cwd(), "agent");
const RUNS_DIR = path.join(AGENT_DIR, "runs");
const DRAFTS_DIR = path.join(AGENT_DIR, "drafts");
const BUDGET_DIR = path.join(AGENT_DIR, "budget");
const QUEUE_FILE = path.join(AGENT_DIR, "queue.jsonl");
const CONFIG_FILE = path.join(AGENT_DIR, "config.json");

const DEFAULT_AGENT_CONFIG: AgentConfig = {
  enabled: true,
  dailyCapUsd: 5,
  perSpawnCapUsd: 0.5,
  workerTimeoutMs: 90_000,
};

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

async function writeFileJson(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value, null, 2), "utf8");
}

async function readFileJson<T>(file: string): Promise<T | null> {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
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

async function ensureAgentDirs() {
  await Promise.all([
    mkdir(AGENT_DIR, { recursive: true }),
    mkdir(RUNS_DIR, { recursive: true }),
    mkdir(DRAFTS_DIR, { recursive: true }),
    mkdir(BUDGET_DIR, { recursive: true }),
  ]);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function budgetFile(date = todayKey()) {
  return path.join(BUDGET_DIR, `${date}.json`);
}

async function readAgentConfig(): Promise<AgentConfig> {
  const config = await readFileJson<Partial<AgentConfig>>(CONFIG_FILE);
  return { ...DEFAULT_AGENT_CONFIG, ...(config ?? {}) };
}

async function readBudget(config: AgentConfig): Promise<AgentBudget> {
  const date = todayKey();
  const existing = await readFileJson<Partial<AgentBudget>>(budgetFile(date));
  return {
    date,
    dailyCapUsd: Number(existing?.dailyCapUsd ?? config.dailyCapUsd),
    perSpawnCapUsd: Number(existing?.perSpawnCapUsd ?? config.perSpawnCapUsd),
    spentUsd: Number(existing?.spentUsd ?? 0),
    reservedUsd: Number(existing?.reservedUsd ?? 0),
    spawns: Number(existing?.spawns ?? 0),
  };
}

async function writeBudget(budget: AgentBudget) {
  await writeFileJson(budgetFile(budget.date), budget);
}

async function listJsonFiles<T>(dir: string): Promise<T[]> {
  if (!existsSync(dir)) return [];
  const files = await readdir(dir);
  const values: T[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const value = await readFileJson<T>(path.join(dir, file));
    if (value != null) values.push(value);
  }
  return values;
}

async function readAgentState() {
  await ensureAgentDirs();
  const config = await readAgentConfig();
  const [runs, drafts, budget] = await Promise.all([
    listJsonFiles<AgentRun>(RUNS_DIR),
    listJsonFiles<AgentDraft>(DRAFTS_DIR),
    readBudget(config),
  ]);
  return {
    runs: runs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 20),
    drafts: drafts
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10),
    budget,
    config,
  };
}

function runFile(id: string) {
  return path.join(RUNS_DIR, `${id}.json`);
}

function draftFile(id: string) {
  return path.join(DRAFTS_DIR, `${id}.json`);
}

function randomId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function itemTitle(item: SlackMessage) {
  return `Reply to ${item.who}`;
}

function itemPreview(item: SlackMessage) {
  return item.msg.length > 160 ? `${item.msg.slice(0, 157)}...` : item.msg;
}

function idempotencyKey(body: AgentSpawnRequest) {
  return [body.source, body.action, body.item.id].join(":");
}

async function findExistingRun(key: string): Promise<AgentRun | null> {
  const runs = await listJsonFiles<AgentRun>(RUNS_DIR);
  return (
    runs
      .filter(
        (run) =>
          run.idempotencyKey === key &&
          ["queued", "running", "complete"].includes(run.status),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
  );
}

async function appendQueue(runId: string) {
  await mkdir(AGENT_DIR, { recursive: true });
  const line = JSON.stringify({ runId, queuedAt: new Date().toISOString() });
  await writeFile(QUEUE_FILE, `${line}\n`, { flag: "a" });
}

async function createAgentRun(body: AgentSpawnRequest) {
  await ensureAgentDirs();
  if (body.source !== "slack" || body.action !== "draft_reply") {
    return { status: 400, body: { error: "unsupported agent action" } };
  }

  const config = await readAgentConfig();
  const budget = await readBudget(config);
  if (!config.enabled) {
    return { status: 423, body: { error: "agent worker disabled", budget } };
  }

  const key = idempotencyKey(body);
  const existing = await findExistingRun(key);
  if (existing) {
    const draft = await readFileJson<AgentDraft>(draftFile(existing.id));
    return { status: 200, body: { ok: true, run: existing, draft, budget } };
  }

  const projected = budget.spentUsd + budget.reservedUsd + budget.perSpawnCapUsd;
  if (projected > budget.dailyCapUsd) {
    return {
      status: 429,
      body: {
        error: "daily agent budget reached",
        budget,
      },
    };
  }

  const now = new Date().toISOString();
  const run: AgentRun = {
    id: randomId("run"),
    source: "slack",
    action: "draft_reply",
    status: "queued",
    itemId: body.item.id,
    idempotencyKey: key,
    createdAt: now,
    updatedAt: now,
    title: itemTitle(body.item),
    itemPreview: itemPreview(body.item),
    budget: {
      maxUsd: budget.perSpawnCapUsd,
      reservedUsd: budget.perSpawnCapUsd,
    },
  };

  budget.reservedUsd = Number(
    (budget.reservedUsd + budget.perSpawnCapUsd).toFixed(4),
  );
  budget.spawns += 1;
  await Promise.all([writeFileJson(runFile(run.id), run), writeBudget(budget)]);
  await appendQueue(run.id);

  const jobFile = path.join(AGENT_DIR, "jobs", `${run.id}.json`);
  await writeFileJson(jobFile, { run, item: body.item });

  return { status: 202, body: { ok: true, run, budget } };
}

async function discardDraft(id: string) {
  const draft = await readFileJson<AgentDraft>(draftFile(id));
  if (existsSync(draftFile(id))) await unlink(draftFile(id));
  if (draft) {
    const run = await readFileJson<AgentRun>(runFile(draft.runId));
    if (run) {
      run.status = "discarded";
      run.updatedAt = new Date().toISOString();
      await writeFileJson(runFile(run.id), run);
    }
  }
}

export function localApi(): Plugin {
  return {
    name: "postcard-desk-local-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const { pathname } = new URL(req.url || "/", "http://localhost");
        try {
          if (pathname === "/api/state" && req.method === "GET") {
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

          if (pathname === "/api/agent/state" && req.method === "GET") {
            return json(res, 200, await readAgentState());
          }

          if (pathname === "/api/agent/spawn" && req.method === "POST") {
            const body = JSON.parse(
              await readRequestBody(req),
            ) as AgentSpawnRequest;
            const result = await createAgentRun(body);
            return json(res, result.status, result.body);
          }

          if (
            pathname.startsWith("/api/agent/drafts/") &&
            req.method === "DELETE"
          ) {
            const id = pathname.split("/").pop()!;
            if (!/^run_[a-z0-9_]+$/.test(id))
              return json(res, 400, { error: "bad draft id" });
            await discardDraft(id);
            return json(res, 200, { ok: true });
          }

          if (pathname === "/api/tasks" && req.method === "PUT") {
            const body = await readRequestBody(req);
            const { tasks } = JSON.parse(body) as { tasks: Task[] };
            const md = existsSync(TASKS_PATH)
              ? await readFile(TASKS_PATH, "utf8")
              : defaultTasksMd();
            const next = serializeTasksMd(md, tasks);
            await writeFile(TASKS_PATH, next, "utf8");
            return json(res, 200, { ok: true });
          }

          if (pathname === "/api/intention" && req.method === "PUT") {
            const body = await readRequestBody(req);
            const { text } = JSON.parse(body) as { text: string };
            await writeJson("intention", { text });
            return json(res, 200, { ok: true });
          }

          if (pathname?.startsWith("/api/source/") && req.method === "PUT") {
            const source = pathname.split("/").pop()!;
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
