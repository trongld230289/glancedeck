// The queue's rules as pure functions: what /q means, when the next item may start, what a fire does.
import type { QueueFile, QueueItem, Runtime, SentItem } from '../types'

export const EMPTY_QUEUE: QueueFile = { items: [], paused: false, pauseReason: null, sent: [] }

export const IDLE: Runtime = {
  isTurnRunning: false,
  background: [],
  isAsking: false,
  turnErrors: 0,
  lastTurnOk: true,
  countdown: null,
  fiveHour: null,
  isQueueOwner: true,
  question: null,
}

/** Above this share of the 5-hour window the queue holds, until the window resets. */
export const USAGE_LIMIT = 90

/** The 5-hour reading from the rate-limit windows the last API response reported; null when there is none. */
export const fiveHourOf = (limits: readonly { kind: string; percentUsed: number; resetsAt?: string }[]): Runtime['fiveHour'] => {
  const w = limits.find(l => l.kind === 'five_hour')
  if (!w) return null
  const at = w.resetsAt ? Date.parse(w.resetsAt) : NaN
  return { percent: w.percentUsed, resetsAt: Number.isFinite(at) ? at : null }
}

/**
 * Over the limit and the window has not reset yet. The reading only moves when a request is made,
 * and a held queue makes none, so once the reset time passes the stale reading no longer holds it.
 */
export const isUsageBlocked = (rt: Runtime, now: number) =>
  rt.fiveHour !== null && rt.fiveHour.percent > USAGE_LIMIT && (rt.fiveHour.resetsAt === null || now < rt.fiveHour.resetsAt)

export type QCommand = { kind: 'add'; text: string; ifOk: boolean } | { kind: 'list' | 'clear' | 'pause' | 'resume' } | { kind: 'help' }

export const parseQ = (args: string): QCommand => {
  const a = args.trim()
  if (a === '' || a === 'help' || a === '--help') return { kind: 'help' }
  if (a === 'list' || a === 'clear' || a === 'pause' || a === 'resume') return { kind: a }
  const m = /^--if-ok\s+([\s\S]+)$/.exec(a)
  if (m?.[1]) return { kind: 'add', text: m[1].trim(), ifOk: true }
  if (a === '--if-ok') return { kind: 'help' }
  return { kind: 'add', text: a, ifOk: false }
}

/** Reads a stored file leniently: anything malformed becomes the empty queue's field. */
export const normalizeQueue = (x: unknown): QueueFile => {
  const o = typeof x === 'object' && x !== null ? (x as Record<string, unknown>) : {}
  const items = Array.isArray(o.items)
    ? o.items.filter(
        (i): i is QueueItem =>
          typeof i === 'object' && i !== null && typeof (i as QueueItem).id === 'string' && typeof (i as QueueItem).text === 'string',
      )
    : []
  const sent = Array.isArray(o.sent)
    ? o.sent.filter((s): s is SentItem => typeof s === 'object' && s !== null && typeof (s as SentItem).text === 'string')
    : []
  const reason = o.pauseReason
  return {
    items: items.map(i => ({ ...i, ifOk: i.ifOk === true })),
    paused: o.paused === true,
    pauseReason: reason === 'user' || reason === 'cancel' || reason === 'if-ok' || reason === 'usage' ? reason : null,
    sent,
  }
}

/** The session is free for the next item: no turn, no background agent, no open question, no countdown. */
export const isFree = (rt: Runtime) => !rt.isTurnRunning && rt.background.length === 0 && !rt.isAsking && rt.countdown === null

export const shouldStart = (q: QueueFile, rt: Runtime, now: number) =>
  rt.isQueueOwner && !q.paused && q.items.length > 0 && !q.items[0]?.isBlocked && isFree(rt) && !isUsageBlocked(rt, now)

export type Fire =
  { kind: 'send'; item: QueueItem; queue: QueueFile } | { kind: 'block'; item: QueueItem; queue: QueueFile } | { kind: 'none' }

/**
 * The countdown for `id` ran out (or the person pressed send-now): send the head item, or hold it
 * when it is --if-ok and the last turn failed. Anything else that changed meanwhile means no send.
 */
export const fire = (q: QueueFile, rt: Runtime, id: string, now: number, isForced = false): Fire => {
  const head = q.items[0]
  if (!head || head.id !== id) return { kind: 'none' }
  if (!isForced && (q.paused || rt.isTurnRunning || rt.background.length > 0 || rt.isAsking || isUsageBlocked(rt, now)))
    return { kind: 'none' }
  if (head.ifOk && !rt.lastTurnOk && !isForced) {
    return {
      kind: 'block',
      item: head,
      queue: { ...q, paused: true, pauseReason: 'if-ok', items: [{ ...head, isBlocked: true }, ...q.items.slice(1)] },
    }
  }
  return {
    kind: 'send',
    item: head,
    queue: { ...q, items: q.items.slice(1), sent: keepToday([...q.sent, { text: head.text, at: now }], now) },
  }
}

const dayOf = (at: number) => new Date(at).toDateString()

export const keepToday = (sent: readonly SentItem[], now: number): SentItem[] => sent.filter(s => dayOf(s.at) === dayOf(now)).slice(-50)

export const move = (q: QueueFile, id: string, by: -1 | 1): QueueFile => {
  const i = q.items.findIndex(x => x.id === id)
  const j = i + by
  if (i < 0 || j < 0 || j >= q.items.length) return q
  const items = [...q.items]
  const [a, b] = [items[i], items[j]]
  if (!a || !b) return q
  items[i] = b
  items[j] = a
  return { ...q, items }
}

export const newId = (now: number, n: number) => `${now.toString(36)}${n.toString(36)}`

/** A file name for the project: its folder name plus a short hash of the whole path, so two `app` folders differ. */
export const projectKey = (cwd: string) => {
  const norm = cwd.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
  let h = 0
  for (let i = 0; i < norm.length; i += 1) h = (Math.imul(h, 31) + norm.charCodeAt(i)) | 0
  const base = (norm.split('/').pop() || 'root').replace(/[^a-z0-9._-]/g, '_')
  return `${base}-${(h >>> 0).toString(36)}`
}
