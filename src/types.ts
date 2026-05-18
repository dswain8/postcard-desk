export type Priority = 1 | 2 | 3;
export type DueBucket = "today" | "week" | "waiting";

export type Task = {
  id: string;
  title: string;
  note: string;
  priority: Priority;
  due: DueBucket;
  done: boolean;
  created: number;
};

export type SlackMessage = {
  id: string;
  who: string;
  channel: string;
  msg: string;
  ago: string;
  urgent: boolean;
  sourceRef?: {
    workspaceId?: string;
    channelId?: string;
    channelName?: string;
    threadTs?: string;
    messageTs?: string;
    permalink?: string;
  };
};

export type PullRequest = {
  id: string;
  num: number;
  repo: string;
  title: string;
  age: string;
  stale: boolean;
  reviewers: number;
};

export type JiraStatus =
  | "To Do"
  | "In Progress"
  | "Review"
  | "Blocked"
  | "Done";

export type JiraTicket = {
  id: string;
  key: string;
  title: string;
  status: JiraStatus;
};

export type ConfluenceActivity = {
  id: string;
  space: string;
  title: string;
  by: string;
  ago: string;
  kind: "edited" | "shared" | "mentioned";
};

export type CalendarEvent = {
  id: string;
  time: string;
  end: string;
  title: string;
  loc: string;
  kind: "recurring" | "focus" | "meeting";
};

export type GoogleDoc = {
  id: string;
  title: string;
  kind: "doc" | "sheet" | "slide" | "pdf" | "other";
  by: string;
  ago: string;
  url?: string;
};

export type DeskState = {
  intention: string;
  tasks: Task[];
  slack: SlackMessage[];
  prs: PullRequest[];
  jira: JiraTicket[];
  conf: ConfluenceActivity[];
  cal: CalendarEvent[];
  docs: GoogleDoc[];
};

export type AgentSource = "slack";
export type AgentAction = "draft_reply";
export type AgentRunStatus =
  | "queued"
  | "running"
  | "complete"
  | "failed"
  | "discarded";

export type AgentRun = {
  id: string;
  source: AgentSource;
  action: AgentAction;
  status: AgentRunStatus;
  itemId: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  title: string;
  itemPreview: string;
  budget: {
    maxUsd: number;
    reservedUsd: number;
    actualUsd?: number;
  };
  error?: string;
};

export type AgentDraft = {
  id: string;
  runId: string;
  source: AgentSource;
  action: AgentAction;
  itemId: string;
  createdAt: string;
  title: string;
  sourceLabel: string;
  itemPreview: string;
  draftText: string;
  summary?: string;
  contextFresh: boolean;
  confidence: "low" | "medium" | "high";
  warnings: string[];
};

export type AgentBudget = {
  date: string;
  dailyCapUsd: number;
  perSpawnCapUsd: number;
  spentUsd: number;
  reservedUsd: number;
  spawns: number;
};

export type AgentConfig = {
  enabled: boolean;
  dailyCapUsd: number;
  perSpawnCapUsd: number;
  workerTimeoutMs: number;
};

export type AgentState = {
  runs: AgentRun[];
  drafts: AgentDraft[];
  budget: AgentBudget;
  config: AgentConfig;
};

export type AgentSpawnRequest = {
  source: AgentSource;
  action: AgentAction;
  item: SlackMessage;
};

export type AgentSpawnResponse = {
  ok: true;
  run: AgentRun;
  draft?: AgentDraft;
  budget: AgentBudget;
};

export type DeskApi = {
  setIntention: (v: string) => void;
  addTask: (t: Partial<Task> & { title: string }) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  cyclePriority: (id: string) => void;
  moveDue: (id: string, due: DueBucket) => void;
  dismissSlack: (id: string) => void;
  markSlackRead: (id: string) => void;
  dismissPR: (id: string) => void;
  advanceJira: (id: string) => void;
  snoozeJira: (id: string) => void;
  refresh: () => Promise<void>;
};

export type AgentApi = {
  spawnSlackDraft: (item: SlackMessage) => Promise<AgentSpawnResponse>;
  refreshAgentState: () => Promise<void>;
  discardDraft: (id: string) => Promise<void>;
};
