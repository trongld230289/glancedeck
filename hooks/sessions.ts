// Other sessions on this machine, across accounts: each glancedeck writes a heartbeat file to a
// shared folder and reads the others'. Pure functions here; the reads and writes are in register.tsx.
import type { AgentCard, Heartbeat, LogLine, SessionRow, SharedAgent } from '../types'
import { fmtUntil, shorten } from './core'

/** Older than this, a heartbeat's session is gone (closed, crashed, or its machine asleep). */
export const STALE_MS = 30_000
/** A session waiting on you this long gets a toast and a sound, once per wait. */
export const ALERT_MS = 3 * 60_000

/** `@acc2` for CLAUDE_CONFIG_DIR=~/.claude-acc2; no tag for the default ~/.claude. */
export const accountOf = (configDir: string | undefined): string | null => {
  if (!configDir) return null
  const name =
    configDir
      .replace(/[\\/]+$/, '')
      .split(/[\\/]/)
      .pop() ?? ''
  if (name === '.claude' || name === '') return null
  return name.replace(/^\.claude-?/, '') || name
}

export const isLive = (h: Heartbeat, now: number) => now - h.updatedAt < STALE_MS

export const parseHeartbeat = (text: string): Heartbeat | null => {
  try {
    const h = JSON.parse(text) as Partial<Heartbeat>
    if (typeof h.sessionId !== 'string' || typeof h.updatedAt !== 'number' || typeof h.project !== 'string') return null
    return {
      sessionId: h.sessionId,
      project: h.project,
      cwd: typeof h.cwd === 'string' ? h.cwd : '',
      queueKey: typeof h.queueKey === 'string' ? h.queueKey : '',
      account: typeof h.account === 'string' ? h.account : null,
      status: h.status === 'waiting' || h.status === 'working' ? h.status : 'idle',
      activity: typeof h.activity === 'string' ? h.activity : '',
      since: typeof h.since === 'number' ? h.since : h.updatedAt,
      startedAt: typeof h.startedAt === 'number' ? h.startedAt : h.updatedAt,
      updatedAt: h.updatedAt,
      log: Array.isArray(h.log) ? h.log.filter((l): l is LogLine => typeof l === 'object' && l !== null && typeof l.text === 'string') : [],
      agents: Array.isArray(h.agents)
        ? h.agents.filter(
            (a): a is SharedAgent => typeof a === 'object' && a !== null && typeof a.name === 'string' && typeof a.spawnedAt === 'number',
          )
        : [],
    }
  } catch {
    return null
  }
}

/** The others, live, as rows: whoever waits on you first, then work, then the idle; newest first within each. */
export const rowsOf = (
  beats: readonly Heartbeat[],
  selfId: string,
  now: number,
): (SessionRow & { sessionId: string; queueKey: string })[] => {
  const rank = { waiting: 0, working: 1, idle: 2 } as const
  return beats
    .filter(h => h.sessionId !== selfId && isLive(h, now))
    .sort((a, b) => rank[a.status] - rank[b.status] || b.since - a.since)
    .map(h => rowOf(h, now))
}

/** One heartbeat as a SESSIONS row. */
export const rowOf = (h: Heartbeat, now: number): SessionRow & { sessionId: string; queueKey: string } => ({
  sessionId: h.sessionId,
  queueKey: h.queueKey,
  status: h.status === 'idle' ? 'done' : h.status,
  project: h.project,
  account: h.account,
  activity: h.status === 'idle' ? 'idle' : shorten(h.activity || (h.status === 'waiting' ? 'waiting for you' : 'working'), 40),
  elapsed: fmtUntil(now - h.since),
})

/**
 * Which live session sends this project's queue: the one that started first. Two sessions on one
 * repo (two accounts, say) share the queue file; only one of them may count down and send.
 */
export const isQueueOwner = (beats: readonly Heartbeat[], self: Pick<Heartbeat, 'sessionId' | 'startedAt' | 'queueKey'>, now: number) =>
  !beats.some(
    h =>
      h.sessionId !== self.sessionId &&
      h.queueKey === self.queueKey &&
      isLive(h, now) &&
      (h.startedAt < self.startedAt || (h.startedAt === self.startedAt && h.sessionId < self.sessionId)),
  )

/** Sessions that have waited on you past ALERT_MS: the key of each wait, so it alerts once. */
export const dueAlerts = (beats: readonly Heartbeat[], selfId: string, now: number) =>
  beats
    .filter(h => h.sessionId !== selfId && isLive(h, now) && h.status === 'waiting' && now - h.since >= ALERT_MS)
    .map(h => ({ key: `${h.sessionId}-${h.since}`, beat: h }))

/** The other sessions' recent rows, tagged with who they are, merged with this session's by time. */
export const mergeLogs = (own: readonly LogLine[], beats: readonly Heartbeat[], selfId: string, now: number): LogLine[] => {
  const others = beats
    .filter(h => h.sessionId !== selfId && isLive(h, now))
    .flatMap(h =>
      h.log
        .filter(l => l.who === 'you' || l.isQuestion || l.isError || l.path !== undefined)
        .map(l => ({
          ...l,
          who: 'peer' as const,
          label: h.account ? `@${h.account}` : shorten(h.project, 8),
          text: l.isQuestion ? `${h.project} asks: ${l.text}` : `${h.project}: ${l.text}`,
          path: undefined,
        })),
    )
  return [...own, ...others].sort((a, b) => a.at - b.at)
}

/** How long a finished subagent stays in the others' AGENTS block. */
export const AGENT_LINGER_MS = 10 * 60_000

/** This session's subagents worth showing the others: running, or finished a short while ago. */
export const sharedAgents = (cards: readonly AgentCard[], now: number): SharedAgent[] =>
  cards
    .filter(c => c.status === 'running' || (c.endedAt !== null && now - c.endedAt < AGENT_LINGER_MS))
    .slice(-9)
    .map(({ name, ctx, out, spawnedAt, endedAt, status, model }) => ({ name, ctx, out, spawnedAt, endedAt, status, ...(model ? { model } : {}) }))

/** The other live sessions' subagents, each tagged with where it runs; running ones first. */
export const peerAgents = (beats: readonly Heartbeat[], selfId: string, now: number) =>
  beats
    .filter(h => h.sessionId !== selfId && isLive(h, now))
    .flatMap(h => h.agents.map(a => ({ ...a, project: h.project, account: h.account })))
    .sort((a, b) => Number(b.status === 'running') - Number(a.status === 'running') || b.spawnedAt - a.spawnedAt)

/** The question an AskUserQuestion call asks, for the heartbeat and the log. */
export const questionOf = (input: unknown): string => {
  const qs = typeof input === 'object' && input !== null ? (input as { questions?: unknown }).questions : undefined
  const first = Array.isArray(qs) ? qs[0] : undefined
  const text = typeof first === 'object' && first !== null ? (first as { question?: unknown }).question : undefined
  return typeof text === 'string' ? shorten(text, 60) : 'asking you'
}
