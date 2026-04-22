import { useEffect, useRef, useState, type ReactNode } from "react";

const STORAGE = "postcard-desk:positions";

type PosMap = Record<string, { dx: number; dy: number }>;

const load = (): PosMap => {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {};
};

const save = (m: PosMap) => {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(m));
  } catch {
    /* ignore */
  }
};

// An element is "interactive" if a drag on it would stomp existing
// behaviour (typing, clicking, scrolling). We only begin a drag when
// the mousedown target is NOT one of these.
const INTERACTIVE = new Set(["BUTTON", "INPUT", "TEXTAREA", "SELECT", "A"]);
const isInteractive = (el: EventTarget | null): boolean => {
  let node = el as HTMLElement | null;
  while (node && node.nodeType === 1) {
    if (INTERACTIVE.has(node.tagName)) return true;
    if (node.isContentEditable) return true;
    if (node.dataset && node.dataset.nodrag === "true") return true;
    node = node.parentElement;
  }
  return false;
};

export function Draggable({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  // One shared store across all draggable cards.
  const store = useRef<PosMap>(load());
  const [pos, setPos] = useState<{ dx: number; dy: number }>(
    () => store.current[id] || { dx: 0, dy: 0 },
  );
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{
    x: number;
    y: number;
    dx: number;
    dy: number;
  } | null>(null);

  // Re-sync if another tab writes positions
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE || !e.newValue) return;
      try {
        const next = JSON.parse(e.newValue) as PosMap;
        store.current = next;
        const mine = next[id];
        if (mine) setPos(mine);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [id]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      if (!dragStart.current) return;
      e.preventDefault();
      const next = {
        dx: dragStart.current.dx + (e.clientX - dragStart.current.x),
        dy: dragStart.current.dy + (e.clientY - dragStart.current.y),
      };
      setPos(next);
    };
    const onUp = () => {
      setDragging(false);
      dragStart.current = null;
      // Persist final position
      store.current[id] = pos;
      save(store.current);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    // We intentionally depend on `pos` so the final persisted value is
    // the latest one. (Closure over the ref alone would be fine too, but
    // this keeps the code easy to reason about.)
  }, [dragging, id, pos]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // left click only
    if (isInteractive(e.target)) return;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      dx: pos.dx,
      dy: pos.dy,
    };
    setDragging(true);
    e.preventDefault();
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (isInteractive(e.target)) return;
    const next = { dx: 0, dy: 0 };
    setPos(next);
    store.current[id] = next;
    save(store.current);
  };

  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      title={
        dragging
          ? undefined
          : "Drag to move · double-click to snap back to the desk"
      }
      style={{
        transform: `translate(${pos.dx}px, ${pos.dy}px)`,
        transition: dragging
          ? "none"
          : "transform 0.35s cubic-bezier(.2,.8,.3,1)",
        cursor: dragging ? "grabbing" : "grab",
        zIndex: dragging ? 50 : undefined,
        userSelect: dragging ? "none" : undefined,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
