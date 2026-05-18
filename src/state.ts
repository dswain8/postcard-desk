import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AgentApi,
  AgentSpawnResponse,
  AgentState,
  DeskApi,
  DeskState,
  DueBucket,
  JiraStatus,
  SlackMessage,
  Task,
} from "./types";

const EMPTY: DeskState = {
  intention: "",
  tasks: [],
  slack: [],
  prs: [],
  jira: [],
  conf: [],
  cal: [],
  docs: [],
};

const newId = () =>
  `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export type LastSynced = {
  iso: string | null;
  label: string | null;
};

const EMPTY_AGENT_STATE: AgentState = {
  runs: [],
  drafts: [],
  budget: {
    date: "",
    dailyCapUsd: 5,
    perSpawnCapUsd: 0.5,
    spentUsd: 0,
    reservedUsd: 0,
    spawns: 0,
  },
  config: {
    enabled: true,
    dailyCapUsd: 5,
    perSpawnCapUsd: 0.5,
    workerTimeoutMs: 90_000,
  },
};

export function useDesk(): {
  state: DeskState;
  api: DeskApi;
  agentState: AgentState;
  agentApi: AgentApi;
  agentLoading: boolean;
  loading: boolean;
  lastRefresh: Date | null;
  lastSynced: LastSynced;
} {
  const [state, setState] = useState<DeskState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSynced, setLastSynced] = useState<LastSynced>({
    iso: null,
    label: null,
  });
  const [agentState, setAgentState] =
    useState<AgentState>(EMPTY_AGENT_STATE);
  const [agentLoading, setAgentLoading] = useState(false);
  const tasksDirty = useRef(false);

  const fetchState = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/state");
      if (!res.ok) throw new Error(`state ${res.status}`);
      const data = (await res.json()) as {
        intention: string;
        tasks: Task[];
        slack: DeskState["slack"];
        prs: DeskState["prs"];
        jira: DeskState["jira"];
        conf: DeskState["conf"];
        cal: DeskState["cal"];
        docs: DeskState["docs"];
        lastSynced?: LastSynced;
      };
      setState({
        intention: data.intention,
        tasks: data.tasks,
        slack: data.slack,
        prs: data.prs,
        jira: data.jira,
        conf: data.conf,
        cal: data.cal,
        docs: data.docs ?? [],
      });
      setLastRefresh(new Date());
      setLastSynced(data.lastSynced ?? { iso: null, label: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const fetchAgentState = useCallback(async () => {
    setAgentLoading(true);
    try {
      const res = await fetch("/api/agent/state");
      if (!res.ok) throw new Error(`agent state ${res.status}`);
      setAgentState((await res.json()) as AgentState);
    } finally {
      setAgentLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgentState().catch(() => {});
  }, [fetchAgentState]);

  useEffect(() => {
    const id = window.setInterval(() => {
      fetchAgentState().catch(() => {});
    }, 2_500);
    return () => window.clearInterval(id);
  }, [fetchAgentState]);

  const tasksRef = useRef<Task[]>(state.tasks);
  useEffect(() => {
    tasksRef.current = state.tasks;
  }, [state.tasks]);

  const flushTasks = useCallback(() => {
    if (!tasksDirty.current) return;
    tasksDirty.current = false;
    fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks: tasksRef.current }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!tasksDirty.current) return;
    const id = setTimeout(flushTasks, 80);
    return () => clearTimeout(id);
  }, [state.tasks, flushTasks]);

  // Flush any pending task changes before the page is hidden or unloaded so
  // quick click-refresh sequences don't lose the last mutation.
  useEffect(() => {
    const onHide = () => flushTasks();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushTasks();
    };
    window.addEventListener("beforeunload", onHide);
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", onHide);
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [flushTasks]);

  const persistIntention = useCallback((text: string) => {
    fetch("/api/intention", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }).catch(() => {});
  }, []);

  const mutateTasks = useCallback((fn: (tasks: Task[]) => Task[]) => {
    setState((s) => ({ ...s, tasks: fn(s.tasks) }));
    tasksDirty.current = true;
  }, []);

  const api = useMemo<DeskApi>(
    () => ({
      setIntention: (v) => {
        setState((s) => ({ ...s, intention: v }));
        persistIntention(v);
      },
      addTask: (t) =>
        mutateTasks((tasks) => [
          {
            id: newId(),
            title: t.title,
            note: t.note ?? "",
            priority: t.priority ?? 2,
            due: t.due ?? "today",
            done: t.done ?? false,
            created: Date.now(),
          },
          ...tasks,
        ]),
      updateTask: (id, patch) =>
        mutateTasks((tasks) =>
          tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        ),
      toggleTask: (id) =>
        mutateTasks((tasks) =>
          tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        ),
      deleteTask: (id) =>
        mutateTasks((tasks) => tasks.filter((t) => t.id !== id)),
      cyclePriority: (id) =>
        mutateTasks((tasks) =>
          tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  priority: (t.priority === 1
                    ? 2
                    : t.priority === 2
                      ? 3
                      : 1) as 1 | 2 | 3,
                }
              : t,
          ),
        ),
      moveDue: (id, due: DueBucket) =>
        mutateTasks((tasks) =>
          tasks.map((t) => (t.id === id ? { ...t, due } : t)),
        ),
      dismissSlack: (id) =>
        setState((s) => ({ ...s, slack: s.slack.filter((m) => m.id !== id) })),
      markSlackRead: (id) =>
        setState((s) => ({
          ...s,
          slack: s.slack.map((m) =>
            m.id === id ? { ...m, urgent: false } : m,
          ),
        })),
      dismissPR: (id) =>
        setState((s) => ({ ...s, prs: s.prs.filter((p) => p.id !== id) })),
      advanceJira: (id) => {
        const cycle: JiraStatus[] = [
          "To Do",
          "In Progress",
          "Review",
          "Blocked",
          "Done",
        ];
        setState((s) => ({
          ...s,
          jira: s.jira.map((j) =>
            j.id === id
              ? {
                  ...j,
                  status: cycle[(cycle.indexOf(j.status) + 1) % cycle.length],
                }
              : j,
          ),
        }));
      },
      snoozeJira: (id) =>
        setState((s) => ({ ...s, jira: s.jira.filter((j) => j.id !== id) })),
      refresh: fetchState,
    }),
    [fetchState, mutateTasks, persistIntention],
  );

  const agentApi = useMemo<AgentApi>(
    () => ({
      spawnSlackDraft: async (item: SlackMessage) => {
        const res = await fetch("/api/agent/spawn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "slack",
            action: "draft_reply",
            item,
          }),
        });
        const data = (await res.json()) as AgentSpawnResponse | { error: string };
        if (!res.ok || !("ok" in data)) {
          throw new Error("error" in data ? data.error : `agent ${res.status}`);
        }
        await fetchAgentState();
        return data;
      },
      refreshAgentState: fetchAgentState,
      discardDraft: async (id: string) => {
        const res = await fetch(`/api/agent/drafts/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(`discard ${res.status}`);
        await fetchAgentState();
      },
    }),
    [fetchAgentState],
  );

  return {
    state,
    api,
    agentState,
    agentApi,
    agentLoading,
    loading,
    lastRefresh,
    lastSynced,
  };
}
