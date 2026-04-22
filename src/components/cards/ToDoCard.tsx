import { useState, type CSSProperties } from "react";
import { Postcard, PriorityBead, miniBtn } from "../Postcard";
import type { DeskApi, DeskState, DueBucket, Task } from "../../types";

type Filter = DueBucket | "done";

export function ToDoCard({
  state,
  api,
  rotation,
}: {
  state: DeskState;
  api: DeskApi;
  rotation: number;
}) {
  const [filter, setFilter] = useState<Filter>("today");
  const [adding, setAdding] = useState(false);
  const [val, setVal] = useState("");

  const counts = {
    today: state.tasks.filter((t) => t.due === "today" && !t.done).length,
    week: state.tasks.filter((t) => t.due === "week" && !t.done).length,
    waiting: state.tasks.filter((t) => t.due === "waiting" && !t.done).length,
    done: state.tasks.filter((t) => t.done).length,
  };

  const filtered =
    filter === "done"
      ? state.tasks.filter((t) => t.done)
      : state.tasks
          .filter((t) => t.due === filter && !t.done)
          .sort((a, b) => a.priority - b.priority);

  const submit = () => {
    if (val.trim()) {
      api.addTask({
        title: val.trim(),
        due: filter === "done" ? "today" : filter,
      });
      setVal("");
    }
  };

  const tab = (v: Filter, n: number, label: string) => (
    <button
      onClick={() => setFilter(v)}
      key={v}
      style={{
        background: filter === v ? "var(--todo)" : "transparent",
        color: filter === v ? "var(--card-cream)" : "var(--ink-2)",
        border: filter === v ? "none" : "1px solid var(--rule)",
        padding: "3px 9px",
        fontFamily: "var(--mono)",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        borderRadius: 12,
      }}
    >
      <b>{n}</b> {label}
    </button>
  );

  return (
    <Postcard
      tone="var(--todo)"
      toneSoft="var(--todo-soft)"
      label="To-Do"
      subtitle="hand-kept, in ~/TASKS.md"
      stampText="PRIVATE"
      rotation={rotation}
      wide
      tall
    >
      <div
        style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}
      >
        {tab("today", counts.today, "Today")}
        {tab("week", counts.week, "Week")}
        {tab("waiting", counts.waiting, "Waiting")}
        {tab("done", counts.done, "Done")}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setAdding(true)}
          style={{
            background: "var(--ink)",
            color: "var(--card-cream)",
            border: "none",
            padding: "3px 10px",
            fontFamily: "var(--mono)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            borderRadius: 12,
          }}
        >
          + New
        </button>
      </div>

      {adding && (
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "8px 10px",
            marginBottom: 8,
            background: "var(--todo-soft)",
            borderRadius: 3,
            border: "1px dashed var(--todo)",
          }}
        >
          <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") {
                setAdding(false);
                setVal("");
              }
            }}
            onBlur={() => {
              if (val.trim()) {
                submit();
                setAdding(false);
              } else {
                setAdding(false);
              }
            }}
            placeholder="What needs doing?"
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              fontFamily: "var(--sans)",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--ink)",
              outline: "none",
            }}
          />
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              color: "var(--ink-4)",
              alignSelf: "center",
            }}
          >
            ⏎ save
          </span>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          maxHeight: 360,
          overflowY: "auto",
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              padding: 18,
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 13,
              color: "var(--ink-4)",
              textAlign: "center",
            }}
          >
            {filter === "today"
              ? "A quiet slate today."
              : filter === "done"
                ? "Nothing ticked yet."
                : "Nothing here."}
          </div>
        ) : (
          filtered.map((t) => <TaskLine key={t.id} task={t} api={api} />)
        )}
      </div>

      {filter !== "done" && !adding && (
        <button
          onClick={() => setAdding(true)}
          style={{
            marginTop: 8,
            width: "100%",
            padding: "6px 10px",
            background: "transparent",
            border: "1px dashed var(--rule)",
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--ink-3)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textAlign: "left",
            borderRadius: 3,
          }}
        >
          + add a task
        </button>
      )}
    </Postcard>
  );
}

function TaskLine({ task, api }: { task: Task; api: DeskApi }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [note, setNote] = useState(task.note || "");
  const [hover, setHover] = useState(false);

  const save = () => {
    api.updateTask(task.id, {
      title: title.trim() || task.title,
      note: note.trim(),
    });
    setEditing(false);
  };

  const rowStyle: CSSProperties = {
    display: "flex",
    gap: 10,
    padding: "8px 2px",
    borderBottom: "1px dashed var(--rule)",
    alignItems: "flex-start",
    opacity: task.done ? 0.5 : 1,
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={rowStyle}
    >
      <button
        onClick={() => api.toggleTask(task.id)}
        style={{
          width: 18,
          height: 18,
          marginTop: 2,
          border: `1.5px solid ${task.done ? "var(--conf)" : "var(--ink-3)"}`,
          background: task.done ? "var(--conf)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          flexShrink: 0,
          borderRadius: 3,
        }}
      >
        {task.done && (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8.5L6.5 12L13 4.5"
              stroke="var(--card-cream)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PriorityBead
            p={task.priority}
            onClick={() => api.cyclePriority(task.id)}
            size={16}
          />
          {editing ? (
            <input
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") {
                  setTitle(task.title);
                  setEditing(false);
                }
              }}
              style={{
                flex: 1,
                border: "none",
                borderBottom: "1px solid var(--todo)",
                background: "transparent",
                fontFamily: "var(--sans)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--ink)",
                outline: "none",
              }}
            />
          ) : (
            <span
              onClick={() => !task.done && setEditing(true)}
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--ink)",
                textDecoration: task.done ? "line-through" : "none",
                lineHeight: 1.3,
                cursor: task.done ? "default" : "text",
              }}
            >
              {task.title}
            </span>
          )}
        </div>
        {editing ? (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={save}
            placeholder="notes…"
            style={{
              width: "100%",
              marginTop: 4,
              border: "1px solid var(--rule)",
              background: "oklch(0.97 0.015 80)",
              fontFamily: "var(--serif)",
              fontSize: 12,
              color: "var(--ink-2)",
              padding: 6,
              outline: "none",
              resize: "vertical",
              minHeight: 38,
              borderRadius: 2,
            }}
          />
        ) : task.note ? (
          <div
            style={{
              marginTop: 2,
              marginLeft: 24,
              fontFamily: "var(--serif)",
              fontSize: 12,
              fontStyle: "italic",
              color: "var(--ink-3)",
              lineHeight: 1.4,
            }}
          >
            {task.note}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          gap: 3,
          opacity: hover ? 1 : 0,
          transition: "opacity 0.15s",
          flexShrink: 0,
        }}
      >
        {!task.done && (
          <button onClick={() => setEditing((e) => !e)} style={miniBtn}>
            edit
          </button>
        )}
        <button onClick={() => api.deleteTask(task.id)} style={miniBtn}>
          ×
        </button>
      </div>
    </div>
  );
}
