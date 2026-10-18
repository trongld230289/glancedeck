export type Block = 'queue' | 'sessions' | 'agents' | 'log'

export type View = {
  collapsed: Block[]
  logTab: 'this' | 'all'
  expandedAgent: number | null
  focusBlock: Block
  /** The queue item the focus ring last rested on: what j/k/e/d act on. */
  selected: string | null
  /** Choosing a session: to move this queue item there (`m`), or to send it a new message (`s`). */
  picking: { kind: 'move'; itemId: string } | { kind: 'message' } | null
  /** The session a message is being written to, after `s` and a pick. */
  messageTo: string | null
  /** An Input is open: adding a new item, or editing the one with this id. */
  editing: 'new' | string | null
}

export type SessionRow = {
  status: 'waiting' | 'working' | 'done'
  project: string
  account: string | null
  activity: string
  elapsed?: string
}

/** One subagent of this session, from agent.spawn to turn.complete. */
export type AgentCard = {
  id: string
  name: string
  ctx: number
  out: number
  spawnedAt: number
  endedAt: number | null
  status: 'running' | 'done' | 'failed'
  tools: string[]
  answer: string
}

/** One row of the session log. `path` is set on an edit, so the row can open the file. */
export type LogLine = {
  at: number
  who: 'you' | 'main' | 'agent' | 'peer' | 'queue'
  label: string
  text: string
  path?: string
  isError?: boolean
  isQuestion?: boolean
}

export type QueueItem = {
  id: string
  text: string
  /** Send only if the turn before it ended with no failed tool call. */
  ifOk: boolean
  addedAt: number
  /** Held at the head: its --if-ok check failed. Cleared by resume, edit or send-now. */
  isBlocked?: true
}

export type PauseReason = 'user' | 'cancel' | 'if-ok' | 'usage'

export type SentItem = { text: string; at: number }

/** What is persisted per project, in the shared folder all accounts read. */
export type QueueFile = {
  items: QueueItem[]
  paused: boolean
  pauseReason: PauseReason | null
  sent: SentItem[]
}

/** This session's live facts the sender waits on. */
export type Runtime = {
  isTurnRunning: boolean
  /** Background subagents of this session still running. */
  background: string[]
  isAsking: boolean
  /** Failed tool calls in the current (or last) main turn. */
  turnErrors: number
  lastTurnOk: boolean
  countdown: { id: string; endsAt: number } | null
  /** This account's 5-hour window, as the last API response reported it. Per session: each account has its own. */
  fiveHour: { percent: number; resetsAt: number | null } | null
  /** This session may send this project's queue: no other live session on it started earlier. */
  isQueueOwner: boolean
  /** What this session is asking you, while an AskUserQuestion is open. */
  question: string | null
}

/** What each session writes to the shared folder every few seconds. */
export type Heartbeat = {
  sessionId: string
  project: string
  cwd: string
  queueKey: string
  account: string | null
  status: 'waiting' | 'working' | 'idle'
  /** The question when waiting, the last action when working. */
  activity: string
  /** When the current status began. */
  since: number
  startedAt: number
  updatedAt: number
  log: LogLine[]
  /** This session's subagents running now, or ended in the last 10 minutes. */
  agents: SharedAgent[]
}

/** A subagent as the other sessions see it in a heartbeat. */
export type SharedAgent = Pick<AgentCard, 'name' | 'ctx' | 'out' | 'spawnedAt' | 'endedAt' | 'status'>

declare module 'claude-code' {
  interface PluginState {
    glancedeck: {
      view: View
      agents: AgentCard[]
      log: LogLine[]
      queue: QueueFile
      runtime: Runtime
      others: Heartbeat[]
    }
  }
}
