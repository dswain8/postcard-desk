import { useDesk } from "./state";
import { DeskHeader } from "./components/DeskHeader";
import { DeskFooter } from "./components/DeskFooter";
import { Draggable } from "./components/Draggable";
import { IntentionCard } from "./components/cards/IntentionCard";
import { ToDoCard } from "./components/cards/ToDoCard";
import { SlackCard } from "./components/cards/SlackCard";
import { PRCard } from "./components/cards/PRCard";
import { JiraCard } from "./components/cards/JiraCard";
import { CalendarCard } from "./components/cards/CalendarCard";
import { ConfluenceCard } from "./components/cards/ConfluenceCard";
import { GDocsCard } from "./components/cards/GDocsCard";
import { FocusTimerCard } from "./components/cards/FocusTimerCard";
import { AffirmationCard } from "./components/cards/AffirmationCard";
import { AgentTray } from "./components/AgentTray";

// Change this to your name — shows up in the header greeting ("Morning, Debjeet").
const OWNER_NAME = "Debjeet";

export function App() {
  const {
    state,
    api,
    agentState,
    agentApi,
    agentLoading,
    loading,
    lastRefresh,
    lastSynced,
  } = useDesk();

  return (
    <div style={{ minHeight: "100vh" }}>
      <DeskHeader
        state={state}
        api={api}
        ownerName={OWNER_NAME}
        onRefresh={() => api.refresh()}
        refreshing={loading}
        lastRefresh={lastRefresh}
      />

      <div
        style={{
          padding: "28px 40px 40px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridAutoRows: "minmax(200px, auto)",
          gap: 22,
          alignItems: "start",
        }}
      >
        <Draggable id="intention">
          <IntentionCard state={state} api={api} rotation={-1.0} />
        </Draggable>
        <Draggable id="affirmation">
          <AffirmationCard rotation={1.6} />
        </Draggable>
        <Draggable id="focus">
          <FocusTimerCard rotation={-1.2} />
        </Draggable>
        <Draggable id="calendar">
          <CalendarCard state={state} rotation={1.4} />
        </Draggable>
        <Draggable id="todo">
          <ToDoCard state={state} api={api} rotation={-0.6} />
        </Draggable>
        <Draggable id="slack">
          <SlackCard
            state={state}
            api={api}
            agentState={agentState}
            agentApi={agentApi}
            rotation={1.0}
          />
        </Draggable>
        <Draggable id="pr">
          <PRCard state={state} api={api} rotation={-1.4} />
        </Draggable>
        <Draggable id="jira">
          <JiraCard state={state} api={api} rotation={0.8} />
        </Draggable>
        <Draggable id="confluence">
          <ConfluenceCard state={state} rotation={-0.8} />
        </Draggable>
        <Draggable id="gdocs">
          <GDocsCard state={state} rotation={1.2} />
        </Draggable>
      </div>

      <AgentTray
        agentState={agentState}
        agentApi={agentApi}
        loading={agentLoading}
      />

      <DeskFooter lastRefresh={lastRefresh} lastSynced={lastSynced} />
    </div>
  );
}
