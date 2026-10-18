import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { AgentCard, Block, Heartbeat, LogLine, QueueFile, QueueItem, Runtime, SessionRow, Turn, View } from '../types'
import {
  AGENTS_MAX,
  EDIT_TOOLS,
  applyStep,
  basename,
  describeCall,
  fmtClock,
  fmtElapsed,
  fmtUntil,
  isLogged,
  kTokens,
  noteTool,
  pathOf,
  prettyModel,
  promptText,
  pushLog,
  shorten,
} from './core'
import {
  EMPTY_QUEUE,
  IDLE,
  USAGE_LIMIT,
  fire,
  fiveHourOf,
  isUsageBlocked,
  keepToday,
  move,
  newId,
  normalizeQueue,
  parseQ,
  projectKey,
  shouldStart,
} from './queue'
import { accountOf, dueAlerts, isQueueOwner, mergeLogs, parseHeartbeat, peerAgents, questionOf, rowOf, rowsOf, sharedAgents } from './sessions'

const PANE = 'glancedeck'
const PANE_COLUMNS = 58
const COUNTDOWN_MS = 5000

// Hue names a block; inside a block, color only says state: lantern waits on you, ember works, jade is done.
const C = {
  queue: '#5EE6E6',
  queueLit: '#167A80',
  queueDeep: '#0D3B40',
  sessions: '#FFC857',
  agents: '#8EA2FF',
  log: '#7A8194',
  text: '#E6E8EE',
  dim: '#8B93A7',
  faint: '#4A5060',
  jade: '#7EE0A1',
  ember: '#FF9F6B',
  rose: '#F39BD0',
  alarm: '#FF7A7A',
  ink: '#000000',
}

const DEFAULT_VIEW: View = {
  collapsed: [],
  logTab: 'this',
  expandedAgent: null,
  focusBlock: 'queue',
  selected: null,
  editing: null,
  picking: null,
  messageTo: null,
}
const view = atom({ plugin: 'glancedeck', key: 'view' } as const, DEFAULT_VIEW)
const agents = atom({ plugin: 'glancedeck', key: 'agents' } as const, [] as AgentCard[])
const log = atom({ plugin: 'glancedeck', key: 'log' } as const, [] as LogLine[])
const queue = atom({ plugin: 'glancedeck', key: 'queue' } as const, EMPTY_QUEUE)
const runtime = atom({ plugin: 'glancedeck', key: 'runtime' } as const, IDLE)
const others = atom({ plugin: 'glancedeck', key: 'others' } as const, [] as Heartbeat[])
const self = atom({ plugin: 'glancedeck', key: 'self' } as const, null as Heartbeat | null)
const NO_TURN: Turn = { startedAt: null, endedAt: null, model: '', edits: 0, errors: 0, agents: 0, reason: null }
const turn = atom({ plugin: 'glancedeck', key: 'turn' } as const, NO_TURN)
const setTurn = ($: EngineInterface, change: (t: Turn) => Turn) => update($, turn, t => change({ ...NO_TURN, ...t }))

const BLOCK_OF_KEY: Record<string, Block> = { q: 'queue', s: 'sessions', a: 'agents', l: 'log' }

const setView = ($: EngineInterface, change: (v: View) => View) => update($, view, v => change({ ...DEFAULT_VIEW, ...v }))
const setAgents = ($: EngineInterface, change: (a: AgentCard[]) => AgentCard[]) => update($, agents, a => change(a ?? []))
const setRuntime = ($: EngineInterface, change: (r: Runtime) => Runtime) => update($, runtime, r => change({ ...IDLE, ...r }))
const say = async ($: EngineInterface, line: Omit<LogLine, 'at'>) => {
  const at = await $.clock.now()
  await update($, log, l => pushLog(l ?? [], { ...line, at }))
}

/** Bookkeeping after the engine has acted: a failure here is logged, never passed on to the call. */
const quietly = async ($: EngineInterface, what: string, fn: () => Promise<unknown>) => {
  try {
    await fn()
  } catch (error) {
    $.ui.log(`glancedeck: ${what} failed: ${error instanceof Error ? error.message : String(error)}`, { to: 'debug' })
  }
}

const toggle = <T,>(list: readonly T[], item: T): T[] => (list.includes(item) ? list.filter(x => x !== item) : [...list, item])

/** `agent 2` for the second card of this session, or `agent` when it has no card. */
async function agentLabel($: EngineInterface, id: string): Promise<string> {
  const i = ((await read($, agents)) ?? []).findIndex(c => c.id === id)
  return i >= 0 ? `agent ${i + 1}` : 'agent'
}

async function openPane($: EngineInterface) {
  return $.ui.open({ id: PANE, title: 'GLANCEDECK', columns: PANE_COLUMNS, rows: 12 })
}

async function openFile($: EngineInterface, path: string) {
  const isWindows = (await $.env.get('OS')) === 'Windows_NT'
  const argv = isWindows ? ['cmd', '/c', 'code', '-g', path] : ['code', '-g', path]
  const ran = await $.process.run(argv, { timeoutMs: 10_000 }).catch(() => null)
  if (!ran || ran.exitCode !== 0) $.ui.toast(`glancedeck: could not open ${basename(path)} (is \`code\` on PATH?)`)
}

// The countdown's timer lives with this copy of the module; a reload drops it and the countdown with it.
let timer: Timer | null = null
let made = 0
// While the 5h window holds the queue: the timer that looks again at the reset, and whether it was said.
let resetTimer: Timer | null = null
let usageHeld = false

// ---------------------------------------------------------------- the queue, persisted per project

/** The folder every account's glancedeck shares: in the home folder, outside any CLAUDE_CONFIG_DIR. */
async function sharedDir($: EngineInterface): Promise<string | null> {
  const home = (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME'))
  return home ? `${home.replace(/\\/g, '/')}/.glancedeck` : null
}

async function queueKey($: EngineInterface): Promise<string | null> {
  const cwd = await $.session.cwd().catch(() => null)
  return cwd ? projectKey(cwd) : null
}

async function queuePath($: EngineInterface, key?: string): Promise<string | null> {
  const [dir, k] = [await sharedDir($), key ?? (await queueKey($))]
  return dir && k ? `${dir}/queues/${k}.json` : null
}

async function readQueueFile($: EngineInterface, path: string): Promise<QueueFile> {
  const text = await $.fs.read(path).catch(() => null)
  try {
    return normalizeQueue(typeof text === 'string' ? JSON.parse(text) : null)
  } catch {
    return normalizeQueue(null)
  }
}

/** Puts a prompt in another session's queue: that session's glancedeck sends it as the person's words. */
async function queueInto($: EngineInterface, key: string, text: string, atFront: boolean) {
  const path = await queuePath($, key)
  if (!path) return
  const q = await readQueueFile($, path)
  const now = await $.clock.now()
  made += 1
  const item: QueueItem = { id: newId(now, made), text, ifOk: false, addedAt: now }
  const items = atFront ? [item, ...q.items] : [...q.items, item]
  await $.fs.write(path, `${JSON.stringify({ ...q, items }, null, 2)}\n`)
}

// ---------------------------------------------------------------- heartbeat: this session for the others to see

const HEARTBEAT_MS = 5000
let ticker: Timer | null = null
let startedAt = 0
let status: { kind: Heartbeat['status']; since: number } = { kind: 'idle', since: 0 }

async function playAlert($: EngineInterface) {
  const os = await $.env.get('OS')
  const argv =
    os === 'Windows_NT'
      ? ['powershell', '-NoProfile', '-Command', '[System.Media.SystemSounds]::Exclamation.Play(); Start-Sleep -Milliseconds 600']
      : ['afplay', '/System/Library/Sounds/Glass.aiff']
  await $.process.run(argv, { timeoutMs: 5000 }).catch(() => null)
}

/** Writes this session's heartbeat, reads everyone's, and acts on what changed. */
async function tick($: EngineInterface, isGone = false) {
  const dir = await sharedDir($)
  const key = await queueKey($)
  if (!dir || !key) return
  const [id, cwd, configDir, rt0, own, cards, now] = await Promise.all([
    $.session.id(),
    $.session.cwd(),
    $.env.get('CLAUDE_CONFIG_DIR'),
    read($, runtime),
    read($, log),
    read($, agents),
    $.clock.now(),
  ])
  const rt = { ...IDLE, ...rt0 }
  const lines = own ?? []
  const kind: Heartbeat['status'] = rt.isAsking ? 'waiting' : rt.isTurnRunning || rt.background.length > 0 ? 'working' : 'idle'
  if (kind !== status.kind) status = { kind, since: now }
  const last = [...lines].reverse().find(l => l.who === 'main' || l.who === 'agent')
  const beat: Heartbeat = {
    sessionId: id,
    project: basename(cwd),
    cwd,
    queueKey: key,
    account: accountOf(configDir),
    status: kind,
    activity: kind === 'waiting' ? (rt.question ?? 'chờ bạn') : (last?.text ?? ''),
    since: status.since,
    startedAt,
    updatedAt: isGone ? 0 : now,
    log: lines.filter(l => l.who !== 'peer').slice(-20),
    agents: sharedAgents(cards ?? [], now),
  }
  await $.fs.write(`${dir}/sessions/${id}.json`, JSON.stringify(beat))
  if (isGone) return

  const entries = await $.fs.list(`${dir}/sessions`).catch(() => [])
  const beats: Heartbeat[] = []
  for (const entry of entries) {
    if (entry.kind !== 'file' || !entry.name.endsWith('.json') || now - entry.mtimeMs > 60_000) continue
    const text = await $.fs.read(`${dir}/sessions/${entry.name}`).catch(() => null)
    const h = typeof text === 'string' ? parseHeartbeat(text) : null
    if (h) beats.push(h)
  }
  await update($, others, () => beats.filter(h => h.sessionId !== id))
  await update($, self, () => beat)

  // Two sessions on one repo share its queue: only the one that started first sends it.
  const isOwner = isQueueOwner(beats, beat, now)
  if (isOwner !== rt.isQueueOwner) {
    if (!isOwner) await cancelCountdown($, 'turn')
    await setRuntime($, r => ({ ...r, isQueueOwner: isOwner }))
  }
  // Another session may have changed this queue (an item sent here): read it back and go on.
  if (!rt.countdown) {
    await loadQueue($)
    await maybeStart($)
  }

  for (const due of dueAlerts(beats, id, now)) {
    const mark = `${dir}/alerts/${due.key}.json`
    if (await $.fs.exists(mark)) continue
    await $.fs.write(mark, JSON.stringify({ at: now, by: id }))
    const who = `${due.beat.project}${due.beat.account ? ` @${due.beat.account}` : ''}`
    $.ui.toast(`glancedeck: ${who} chờ bạn đã 3 phút: ${due.beat.activity}`, { timeoutMs: 10_000 })
    await playAlert($)
  }
}

async function loadQueue($: EngineInterface): Promise<QueueFile> {
  const path = await queuePath($)
  const text = path ? await $.fs.read(path).catch(() => null) : null
  let parsed: unknown = null
  try {
    parsed = typeof text === 'string' ? JSON.parse(text) : null
  } catch {
    parsed = null
  }
  const q = normalizeQueue(parsed)
  await update($, queue, () => q)
  return q
}

async function saveQueue($: EngineInterface, q: QueueFile): Promise<QueueFile> {
  await update($, queue, () => q)
  const path = await queuePath($)
  if (path) await $.fs.write(path, `${JSON.stringify(q, null, 2)}\n`)
  return q
}

async function changeQueue($: EngineInterface, change: (q: QueueFile) => QueueFile): Promise<QueueFile> {
  return saveQueue($, change(normalizeQueue(await read($, queue))))
}

async function cancelCountdown($: EngineInterface, why: 'typed' | 'cancel' | 'turn') {
  const rt = { ...IDLE, ...(await read($, runtime)) }
  if (!rt.countdown) return
  timer?.cancel()
  timer = null
  await setRuntime($, r => ({ ...r, countdown: null }))
  if (why === 'cancel') await changeQueue($, q => ({ ...q, paused: true, pauseReason: 'cancel' }))
  if (why !== 'turn')
    await say($, { who: 'queue', label: 'queue', text: why === 'typed' ? 'huỷ lần gửi: bạn đang gõ' : 'huỷ lần gửi, queue dừng' })
}

/** Reads this account's 5-hour window afresh; the plain call is free. */
async function refreshUsage($: EngineInterface) {
  const u = await $.session.usage().catch(() => null)
  if (u) await setRuntime($, r => ({ ...r, fiveHour: fiveHourOf(u.rateLimits) }))
}

/** The queue waits on the 5h window: say so once, and look again when the window resets. */
async function holdForUsage($: EngineInterface, rt: Runtime, now: number) {
  const w = rt.fiveHour
  if (!w) return
  if (!usageHeld) {
    usageHeld = true
    const until = w.resetsAt ? ` đến ${fmtClock(w.resetsAt).slice(0, 5)}` : ''
    $.ui.toast(`glancedeck: queue dừng vì 5h đã dùng ${w.percent}%${until}.`)
    await say($, { who: 'queue', label: 'queue', text: `dừng: 5h ${w.percent}% > ${USAGE_LIMIT}%${until}` })
  }
  resetTimer?.cancel()
  resetTimer = w.resetsAt
    ? $.clock.after(Math.max(1000, w.resetsAt - now + 2000), () => void quietly($, 'usage resume', () => maybeStart($)))
    : null
}

/** Starts the head item's countdown when the session is free for it. */
async function maybeStart($: EngineInterface) {
  await refreshUsage($)
  const [q, rt] = [normalizeQueue(await read($, queue)), { ...IDLE, ...(await read($, runtime)) }]
  const now = await $.clock.now()
  if (isUsageBlocked(rt, now)) {
    if (q.items.length > 0 && !q.paused) await holdForUsage($, rt, now)
    return
  }
  if (usageHeld) {
    usageHeld = false
    resetTimer?.cancel()
    resetTimer = null
    if (q.items.length > 0) await say($, { who: 'queue', label: 'queue', text: 'chạy lại: cửa sổ 5h đã reset' })
  }
  if (!shouldStart(q, rt, now)) return
  const head = q.items[0]
  if (!head) return
  await setRuntime($, r => ({ ...r, countdown: { id: head.id, endsAt: now + COUNTDOWN_MS } }))
  timer?.cancel()
  timer = $.clock.after(COUNTDOWN_MS, () => void quietly($, 'queue send', () => sendHead($, head.id, false)))
}

/** Sends the head item now (the countdown ran out, or send-now), or holds it on a failed --if-ok. */
async function sendHead($: EngineInterface, id: string, isForced: boolean) {
  timer?.cancel()
  timer = null
  // Read the file again first: another session on this project may have taken the item.
  const q = await loadQueue($)
  const rt = { ...IDLE, ...(await read($, runtime)) }
  await setRuntime($, r => ({ ...r, countdown: null }))
  const now = await $.clock.now()
  const result = fire(q, rt, id, now, isForced)
  if (result.kind === 'none') return
  await saveQueue($, result.queue)
  if (result.kind === 'block') {
    $.ui.toast(`glancedeck: chưa gửi "${shorten(result.item.text, 40)}": lượt trước có lỗi (--if-ok). Queue đã dừng.`)
    await say($, { who: 'queue', label: 'queue', text: `giữ lại (--if-ok): ${shorten(result.item.text, 40)}`, isError: true })
    return
  }
  await say($, { who: 'queue', label: 'queue', text: `gửi: ${shorten(result.item.text, 60)}` })
  await $.prompt.submit({ text: result.item.text, asUser: true })
}

async function addItem($: EngineInterface, text: string, ifOk: boolean): Promise<QueueItem> {
  const now = await $.clock.now()
  made += 1
  const item: QueueItem = { id: newId(now, made), text, ifOk, addedAt: now }
  await changeQueue($, q => ({ ...q, items: [...q.items, item] }))
  await maybeStart($)
  return item
}

async function resume($: EngineInterface) {
  await changeQueue($, q => ({ ...q, paused: false, pauseReason: null, items: q.items.map(({ isBlocked: _, ...i }) => i) }))
  await maybeStart($)
}

async function pause($: EngineInterface) {
  await cancelCountdown($, 'turn')
  await changeQueue($, q => ({ ...q, paused: true, pauseReason: 'user' }))
}

/** Puts the focus ring on a text field that just appeared: autoFocus only acts when the pane first takes the keys. */
async function focusInput($: EngineInterface, key: string) {
  await quietly($, 'focus', () => $.ui.focus({ requestId: PANE, key }))
}

async function sendNow($: EngineInterface) {
  const q = normalizeQueue(await read($, queue))
  const head = q.items[0]
  if (head) await sendHead($, head.id, true)
}

export const register: Register = on => {
  // ---------------------------------------------------------------- session

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'glancedeck',
      description: 'GLANCEDECK pane: queue, other sessions, agents and log',
      argumentHint: '[open|close]',
    })
    await $.command.register({
      name: 'q',
      description: 'Queue a prompt for this project; it is sent when Claude is free',
      argumentHint: '[--if-ok] <text> | list | clear | pause | resume',
      immediate: true,
    })
    const started = await next(e)
    await quietly($, 'queue load', async () => {
      await setRuntime($, () => IDLE)
      await loadQueue($)
    })
    startedAt = await $.clock.now()
    status = { kind: 'idle', since: startedAt }
    ticker?.cancel()
    ticker = $.clock.every(HEARTBEAT_MS, () => void quietly($, 'heartbeat', () => tick($)))
    void quietly($, 'heartbeat', () => tick($))
    void openPane($).catch(() => undefined)

    return started
  })

  on('session.end', async ($, e, next) => {
    if (e.reason !== 'clear') {
      ticker?.cancel()
      ticker = null
      await quietly($, 'heartbeat off', () => tick($, true))
    }
    if (e.reason === 'clear') {
      await update($, agents, () => [])
      await update($, log, () => [])
      await update($, turn, () => NO_TURN)
      await setView($, v => ({ ...v, expandedAgent: null }))
    }

    return next(e)
  })

  on('command.run', { command: 'glancedeck' }, async ($, e) => {
    if (e.args.trim() === 'close') {
      await $.ui.close({ id: PANE })
      return { text: 'GLANCEDECK closed.' }
    }
    const opened = await openPane($)
    return { text: opened.isPlaced ? 'GLANCEDECK opened. Focus it with ctrl+x tab.' : `GLANCEDECK is not shown yet: ${opened.reason}` }
  })

  on('command.run', { command: 'q' }, async ($, e) => {
    const cmd = parseQ(e.args)
    if (cmd.kind === 'help') {
      return { text: 'Usage: /q <text> · /q --if-ok <text> · /q list · /q clear · /q pause · /q resume' }
    }
    if (cmd.kind === 'add') {
      const item = await addItem($, cmd.text, cmd.ifOk)
      const q = normalizeQueue(await read($, queue))
      const at = q.items.findIndex(i => i.id === item.id) + 1
      return { text: `Queued #${at}${cmd.ifOk ? ' (if the turn before has no errors)' : ''}: ${shorten(cmd.text, 70)}` }
    }
    if (cmd.kind === 'list') {
      const q = normalizeQueue(await read($, queue))
      const now = await $.clock.now()
      const sent = keepToday(q.sent, now)
      const lines = q.items.map((i, n) => `${n + 1}. ${i.ifOk ? '[if-ok] ' : ''}${i.isBlocked ? '[held] ' : ''}${i.text}`)
      return {
        text: [
          `Queue: ${q.items.length} waiting${q.paused ? ` · paused (${q.pauseReason ?? 'user'})` : ''}`,
          ...lines,
          ...(sent.length ? [`Sent today: ${sent.length}`, ...sent.slice(-5).map(s => `  ${fmtClock(s.at)} ${shorten(s.text, 60)}`)] : []),
        ].join('\n'),
      }
    }
    if (cmd.kind === 'clear') {
      await cancelCountdown($, 'turn')
      await changeQueue($, q => ({ ...q, items: [] }))
      return { text: 'Queue cleared.' }
    }
    if (cmd.kind === 'pause') {
      await pause($)
      return { text: 'Queue paused. /q resume to go on.' }
    }
    await resume($)
    return { text: 'Queue resumed.' }
  })

  // ---------------------------------------------------------------- what the sender waits on

  on('turn.start', async ($, e, next) => {
    if (!e.agentId) {
      await quietly($, 'turn.start', async () => {
        await cancelCountdown($, 'turn')
        await setRuntime($, r => ({ ...r, isTurnRunning: true, turnErrors: 0 }))
        const now = await $.clock.now()
        await setTurn($, t => ({ ...NO_TURN, model: t.model, startedAt: now }))
        const text = e.text ? promptText(e.text) : null
        if (text) await say($, { who: 'you', label: 'you', text })
      })
    }

    return next(e)
  })

  // Each API response reports the 5h window: hold the queue past the limit, go on once it is under.
  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) {
      await quietly($, 'usage measure', async () => {
        const fiveHour = fiveHourOf(e.rateLimits)
        const now = await $.clock.now()
        const was = { ...IDLE, ...(await read($, runtime)) }
        await setRuntime($, r => ({ ...r, fiveHour }))
        const is = { ...was, fiveHour }
        if (isUsageBlocked(is, now) && was.countdown) await cancelCountdown($, 'turn')
        if (isUsageBlocked(was, now) && !isUsageBlocked(is, now)) await maybeStart($)
      })
    }

    return next(e)
  })

  on('prompt.edit', async ($, e, next) => {
    // Typing in the prompt box while a send counts down: the person is writing their own message.
    if (e.origin.kind === 'composer') {
      const rt = await read($, runtime)
      if (rt?.countdown) await quietly($, 'cancel on typing', () => cancelCountdown($, 'typed'))
    }

    return next(e)
  })

  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    if (started.deny !== undefined || !started.agentId) return started
    const agentId = started.agentId
    await quietly($, 'agent.spawn card', async () => {
      const card: AgentCard = {
        id: agentId,
        name: shorten(e.description || e.name || e.subagentType, 28),
        ctx: 0,
        out: 0,
        spawnedAt: await $.clock.now(),
        endedAt: null,
        status: 'running',
        tools: [],
        answer: '',
      }
      await setAgents($, list => [...list, card].slice(-AGENTS_MAX))
      if (!e.parentAgentId) await setTurn($, t => (t.endedAt === null && t.startedAt !== null ? { ...t, agents: t.agents + 1 } : t))
      if (e.background && !e.parentAgentId) await setRuntime($, r => ({ ...r, background: [...r.background, agentId] }))
      await say($, { who: 'agent', label: await agentLabel($, card.id), text: `bắt đầu · ${card.name}` })
    })

    return started
  })

  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    const id = e.agentId
    if (id) await quietly($, 'turn.step usage', () => setAgents($, list => list.map(c => (c.id === id ? applyStep(c, result.usage) : c))))
    else if (e.model) {
      const model = e.model
      await quietly($, 'turn.step model', async () => {
        if ((await read($, turn))?.model !== model) await setTurn($, t => ({ ...t, model }))
      })
    }

    return result
  })

  on('tool.call', async ($, e, next) => {
    const isQuestion = e.tool === 'AskUserQuestion' && !e.agentId
    if (isQuestion) {
      const question = questionOf(e)
      await quietly($, 'asking on', async () => {
        await setRuntime($, r => ({ ...r, isAsking: true, question }))
        await say($, { who: 'main', label: 'main', text: `hỏi: ${question}`, isQuestion: true })
        await tick($)
      })
    }
    const ran = await next(e).finally(() => {
      if (isQuestion) void quietly($, 'asking off', () => setRuntime($, r => ({ ...r, isAsking: false, question: null })))
    })
    if (ran.deny !== undefined) return ran
    await quietly($, 'tool.call log', async () => {
      const isError = ran.isError === true
      const id = e.agentId
      if (isError && !id) await setRuntime($, r => ({ ...r, turnErrors: r.turnErrors + 1 }))
      if (isError && !id) await setTurn($, t => ({ ...t, errors: t.errors + 1 }))
      if (!isError && EDIT_TOOLS.has(e.tool)) await setTurn($, t => ({ ...t, edits: t.edits + 1 }))
      if (!isLogged(e.tool)) return
      const text = describeCall(e.tool, e)
      if (id) await setAgents($, list => list.map(c => (c.id === id ? noteTool(c, text) : c)))
      const path = EDIT_TOOLS.has(e.tool) && !isError ? pathOf(e) : undefined
      await say($, {
        who: id ? 'agent' : 'main',
        label: id ? await agentLabel($, id) : 'main',
        text: isError ? `${text}  ✗` : text,
        ...(path ? { path } : {}),
        ...(isError ? { isError } : {}),
      })
    })

    return ran
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    const id = e.agentId
    if (!id) {
      await quietly($, 'turn end', async () => {
        await setRuntime($, r => ({ ...r, isTurnRunning: false, lastTurnOk: r.turnErrors === 0 && e.reason === 'answer' }))
        const now = await $.clock.now()
        await setTurn($, t => (t.startedAt === null ? t : { ...t, endedAt: now, reason: e.reason }))
        await maybeStart($)
      })
      return done
    }
    await quietly($, 'turn.complete card', async () => {
      await setRuntime($, r => ({ ...r, background: r.background.filter(b => b !== id) }))
      const list = (await read($, agents)) ?? []
      if (list.some(c => c.id === id)) {
        const now = await $.clock.now()
        const status = e.reason === 'answer' ? 'done' : 'failed'
        const answer = shorten(e.answer ?? '', 200)
        await setAgents($, l => l.map(c => (c.id === id ? { ...c, status, endedAt: now, answer } : c)))
        const card = list.find(c => c.id === id)
        await say($, {
          who: 'agent',
          label: await agentLabel($, id),
          text: status === 'done' ? `xong · ${fmtElapsed(now - (card?.spawnedAt ?? now))}` : `dừng (${e.reason})`,
          ...(status === 'failed' ? { isError: true } : {}),
        })
      }
      await maybeStart($)
    })

    return done
  })

  // Remember which block, and which queue item, holds the focus ring.
  on('ui.focus', { component: 'Pane', requestId: PANE }, async ($, e, next) => {
    const el = e.element
    const block = el ? BLOCK_OF_KEY[el.split('-')[0] ?? ''] : undefined
    if (el && block) {
      const item = /^q-item-(.+)$/.exec(el)?.[1] ?? null
      await setView($, v => ({ ...v, focusBlock: block, selected: item ?? v.selected }))
    }

    return next(e)
  })

  // ---------------------------------------------------------------- the band above the prompt: a send about to happen

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const [rt, q0] = await Promise.all([read($, runtime), read($, queue)])
    const q = normalizeQueue(q0)
    const head = q.items[0]
    const isCounting = Boolean(rt?.countdown && head && rt.countdown.id === head.id)
    const isHeld = Boolean(head?.isBlocked)
    if (!head || (!isCounting && !isHeld)) return next(e)
    const { Box, Text, Button } = $.ui.resolve(e)

    return (
      <Box>
        <Text color={isHeld ? C.alarm : C.queue} bold>
          {isHeld ? '✗ giữ lại ' : '⏳ sắp gửi '}
        </Text>
        <Text color={C.text} wrap="truncate">
          {shorten(head.text, Math.max(10, e.props.bodyColumns - 34))}
        </Text>
        <Text> </Text>
        <Button key="band-send" label={isHeld ? 'Vẫn gửi' : 'Gửi ngay'} hotkey="n" onPress={() => sendNow($)} />
        <Text> </Text>
        <Button
          key="band-cancel"
          label={isHeld ? 'Bỏ' : 'Huỷ'}
          hotkey="x"
          onPress={() => (isHeld ? changeQueue($, x => ({ ...x, items: x.items.slice(1) })) : cancelCountdown($, 'cancel'))}
        />
      </Box>
    )
  })

  // ---------------------------------------------------------------- the pane

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const els = $.ui.resolve(e)
    const { Box, Text, Button } = els
    const Input = 'Input' in els ? els.Input : null
    const hasClient = 'Client' in els
    const [v0, cards0, lines0, q0, rt0, beats0, selfBeat, turn0, selfId, cwd, now] = await Promise.all([
      read($, view),
      read($, agents),
      read($, log),
      read($, queue),
      read($, runtime),
      read($, others),
      read($, self),
      read($, turn),
      $.session.id().catch(() => ''),
      $.session.cwd().catch(() => '?'),
      $.clock.now(),
    ])
    const beats = beats0 ?? []
    const ownKey = projectKey(cwd)
    const v = { ...DEFAULT_VIEW, ...v0 }
    const cards = cards0 ?? []
    const lines = lines0 ?? []
    const q = normalizeQueue(q0)
    const rt = { ...IDLE, ...rt0 }
    const t = { ...NO_TURN, ...turn0 }
    const W = Math.max(40, e.props.bodyColumns)
    const inner = W - 4
    const isOpen = (b: Block) => !v.collapsed.includes(b)
    const fold = (b: Block) => () => setView($, x => ({ ...x, collapsed: toggle(x.collapsed, b) }))

    // A row: what it is on the left, cut to fit; a fixed part on the right.
    const row = (key: string, left: JSX.Element, right: JSX.Element | null, bg?: string) => (
      <Box key={key} width={inner} backgroundColor={bg}>
        <Box flexGrow={1} flexShrink={1}>
          {left}
        </Box>
        {right ? (
          <Box flexShrink={0} marginLeft={1}>
            {right}
          </Box>
        ) : null}
      </Box>
    )

    const headRow = (block: Block, title: string, color: string, summary: JSX.Element, right: JSX.Element | null) =>
      row(
        `${block[0]}-head`,
        <Button key={`${block[0]}-head`} plain onPress={fold(block)}>
          <Text color={color} bold>{`${isOpen(block) ? '' : '▸ '}${title}`}</Text>
          {summary}
        </Button>,
        right,
      )

    // A block's border is dim while nothing happens in it and lights up when something does.
    const frame = (key: string, color: string, isLive: boolean, children: JSX.Element[]) => (
      <Box key={key} flexDirection="column" borderStyle="round" borderColor={color} borderDimColor={!isLive} paddingX={1} width={W}>
        {children}
      </Box>
    )

    // ---- QUEUE: the head sits on a lit ticket; while it counts down, the ticket itself drains
    const head = q.items[0]
    const counting = rt.countdown && head && rt.countdown.id === head.id ? rt.countdown : null
    const selected = v.selected && q.items.some(i => i.id === v.selected) ? v.selected : (head?.id ?? null)
    const isQueueFocused = e.props.isFocused && v.focusBlock === 'queue'
    const usageHold = isUsageBlocked(rt, now) && rt.fiveHour ? rt.fiveHour : null
    const autoText = !rt.isQueueOwner
      ? 'phiên khác gửi'
      : q.paused
        ? q.pauseReason === 'if-ok'
          ? 'dừng: lỗi'
          : 'auto off'
        : usageHold
          ? `dừng: 5h ${Math.round(usageHold.percent)}%`
          : 'auto on'
    const autoColor = q.paused ? (q.pauseReason === 'if-ok' ? C.alarm : C.dim) : usageHold ? C.sessions : C.jade
    const itemRight = (item: QueueItem, i: number) =>
      item.isBlocked ? (
        <Text color={C.alarm}>✗ có lỗi</Text>
      ) : i === 0 ? (
        q.paused ? (
          <Text color={C.dim}>⏸ dừng</Text>
        ) : (
          <Text color={C.queue} bold>
            kế tiếp
          </Text>
        )
      ) : item.ifOk ? (
        <Text color={C.sessions}>nếu 0 lỗi</Text>
      ) : (
        <Text color={C.faint}>chờ</Text>
      )
    const editor = (key: string, value: string, onSubmit: (text: string) => Promise<unknown>) => (
      <Box key={key} width={inner}>
        {Input ? (
          <Input
            key={key}
            label=""
            value={value}
            placeholder="việc cần Claude làm tiếp…"
            autoFocus
            onSubmit={(text: string) => {
              void setView($, x => ({ ...x, editing: null }))
              if (text.trim()) void onSubmit(text.trim())
            }}
          />
        ) : (
          <Text color={C.faint}>Dùng /q &lt;việc&gt; trên thiết bị này.</Text>
        )}
      </Box>
    )
    const itemRow = (item: QueueItem, i: number) => {
      if (v.editing === item.id) {
        return editor(`q-edit-${item.id}`, item.text, text =>
          changeQueue($, x => ({ ...x, items: x.items.map(it => (it.id === item.id ? { ...it, text, isBlocked: undefined } : it)) })),
        )
      }
      if (i === 0 && counting && hasClient) {
        return (
          <Box key={`q-item-${item.id}`} width={inner}>
            <els.Client
              key={`q-ticket-${item.id}`}
              module="./ticket.tsx"
              props={{
                left: `▸ ${item.text}`,
                endsAt: counting.endsAt,
                now,
                total: COUNTDOWN_MS,
                width: inner,
                fg: C.text,
                lit: C.queueLit,
                dark: C.queueDeep,
              }}
            />
          </Box>
        )
      }
      const isHead = i === 0
      const mark = item.id === selected && e.props.isFocused ? '›' : isHead ? '▸' : String(i + 1)
      return row(
        `q-row-${item.id}`,
        <Button key={`q-item-${item.id}`} plain onPress={() => setView($, x => ({ ...x, selected: item.id }))}>
          <Text color={isHead ? C.queue : C.faint} bold={isHead}>{`${mark} `}</Text>
          <Text color={isHead ? C.text : C.dim} bold={isHead}>
            {counting && isHead ? `${item.text} · sau ${Math.max(0, Math.ceil((counting.endsAt - now) / 1000))}s` : item.text}
          </Text>
        </Button>,
        itemRight(item, i),
        isHead ? C.queueDeep : undefined,
      )
    }
    const sentToday = keepToday(q.sent, now).length
    const act = (key: string, hotkey: string, label: string, onPress: () => unknown) => (
      <Button key={key} plain hotkey={hotkey} onPress={onPress}>
        {label}
      </Button>
    )
    const queueBlock = frame('queue', C.queue, q.items.length > 0 && !q.paused && !usageHold, [
      headRow(
        'queue',
        'QUEUE',
        C.queue,
        <Text color={C.dim}>
          {` · ${q.items.length} chờ · `}
          <Text color={autoColor}>{autoText}</Text>
        </Text>,
        usageHold?.resetsAt ? (
          <Text color={C.sessions}>{`↻ chạy lại sau ${fmtUntil(usageHold.resetsAt - now)}`}</Text>
        ) : (
          <Text color={C.faint}>{`dừng nếu 5h>${USAGE_LIMIT}%`}</Text>
        ),
      ),
      ...(isOpen('queue')
        ? [
            ...q.items.map(itemRow),
            ...(v.editing === 'new' ? [editor('q-new', '', text => addItem($, text, false))] : []),
            ...(q.items.length === 0 && v.editing !== 'new'
              ? [row('q-empty', <Text color={C.faint}>/q &lt;việc&gt; hoặc q để thêm. Gửi khi Claude rảnh.</Text>, null)]
              : []),
            ...(sentToday > 0 ? [row('q-sent', <Text color={C.faint}>{`✓ đã gửi hôm nay: ${sentToday}`}</Text>, null)] : []),
            ...(isQueueFocused && q.items.length > 0
              ? [
                  <Box key="q-keys" width={inner}>
                    {act('q-k-up', 'k', 'lên', () => selected && changeQueue($, x => move(x, selected, -1)))}
                    <Text color={C.faint}> </Text>
                    {act('q-k-down', 'j', 'xuống', () => selected && changeQueue($, x => move(x, selected, 1)))}
                    <Text color={C.faint}> </Text>
                    {act('q-k-edit', 'e', 'sửa', async () => {
                      if (!selected) return
                      await setView($, x => ({ ...x, editing: selected }))
                      await focusInput($, `q-edit-${selected}`)
                    })}
                    <Text color={C.faint}> </Text>
                    {act(
                      'q-k-del',
                      'd',
                      'xoá',
                      () => selected && changeQueue($, x => ({ ...x, items: x.items.filter(i => i.id !== selected) })),
                    )}
                    <Text color={C.faint}> </Text>
                    {act('q-k-pause', 'p', q.paused ? 'chạy' : 'dừng', () => (q.paused ? resume($) : pause($)))}
                    <Text color={C.faint}> </Text>
                    {act('q-k-now', 'n', 'gửi', () => sendNow($))}
                    <Text color={C.faint}> </Text>
                    {act(
                      'q-k-move',
                      'm',
                      'sang phiên',
                      () => selected && setView($, x => ({ ...x, picking: { kind: 'move', itemId: selected } })),
                    )}
                  </Box>,
                ]
              : []),
          ]
        : []),
    ])

    // ---- SESSIONS: the other sessions on this machine; whoever waits on you is a lit chip at the top
    const sessions = rowsOf(beats, selfId, now)
    const picking = v.picking
    const targets = sessions.filter(s => s.queueKey && s.queueKey !== ownKey)
    const pickSession = async (s: (typeof sessions)[number]) => {
      if (!picking) return
      if (picking.kind === 'move') {
        const item = q.items.find(i => i.id === picking.itemId)
        if (item) {
          await queueInto($, s.queueKey, item.text, false)
          await changeQueue($, x => ({ ...x, items: x.items.filter(i => i.id !== item.id) }))
          await say($, { who: 'queue', label: 'queue', text: `chuyển sang ${s.project}: ${shorten(item.text, 40)}` })
        }
        await setView($, x => ({ ...x, picking: null }))
      } else {
        await setView($, x => ({ ...x, picking: null, messageTo: s.sessionId }))
        await focusInput($, 's-msg-input')
      }
    }
    const messageTarget = v.messageTo ? sessions.find(s => s.sessionId === v.messageTo) : undefined
    const waiting = sessions.filter(s => s.status === 'waiting').length
    const MARK: Record<SessionRow['status'], { icon: string; color: string }> = {
      waiting: { icon: '!', color: C.sessions },
      working: { icon: '●', color: C.ember },
      done: { icon: '✓', color: C.jade },
    }
    const sessionsBlock = frame('sessions', C.sessions, waiting > 0, [
      headRow(
        'sessions',
        'SESSIONS',
        C.sessions,
        <Text color={C.dim}>{sessions.length === 0 ? ' · không có phiên khác' : ` · ${sessions.length} khác`}</Text>,
        picking ? (
          <Button key="s-pick-cancel" plain onPress={() => setView($, x => ({ ...x, picking: null }))}>
            <Text color={C.sessions}>chọn phiên · huỷ</Text>
          </Button>
        ) : waiting > 0 ? (
          <Text color={C.sessions} bold>{`${waiting} chờ bạn`}</Text>
        ) : null,
      ),
      ...(isOpen('sessions') && picking && targets.length === 0
        ? [row('s-none', <Text color={C.faint}>Không có phiên nào ở repo khác để gửi sang.</Text>, null)]
        : []),
      ...(isOpen('sessions') && picking
        ? targets.map((s, i) =>
            row(
              `s-pick-${i}`,
              <Button key={`s-pick-${i}`} plain hotkey={String(i + 1)} onPress={() => pickSession(s)}>
                <Text color={C.sessions} bold>{`${i + 1} `}</Text>
                <Text color={C.text}>{s.project}</Text>
                {s.account ? <Text color={C.rose}>{` @${s.account}`}</Text> : null}
              </Button>,
              <Text color={C.dim}>{s.status === 'done' ? 'rảnh' : 'xếp hàng'}</Text>,
            ),
          )
        : []),
      ...(isOpen('sessions') && messageTarget
        ? [
            <Box key="s-msg" width={inner}>
              <Text color={C.sessions}>{`→ ${messageTarget.project}${messageTarget.account ? ` @${messageTarget.account}` : ''}: `}</Text>
              {Input ? (
                <Input
                  key="s-msg-input"
                  label=""
                  placeholder="nhắn như lời bạn, gửi khi phiên đó rảnh…"
                  autoFocus
                  onSubmit={(text: string) => {
                    void setView($, x => ({ ...x, messageTo: null }))
                    if (text.trim()) {
                      void queueInto($, messageTarget.queueKey, text.trim(), true)
                      void say($, { who: 'queue', label: 'queue', text: `nhắn ${messageTarget.project}: ${shorten(text.trim(), 40)}` })
                    }
                  }}
                />
              ) : (
                <Text color={C.faint}>không nhập được trên thiết bị này</Text>
              )}
            </Box>,
          ]
        : []),
      ...(isOpen('sessions') && !picking && selfBeat
        ? [
            ((s: SessionRow) =>
              row(
                's-self',
                <Text wrap="truncate" color={C.dim}>
                  {` ${MARK[s.status].icon}  ${s.project}`}
                  {s.account ? ` @${s.account}` : ''}
                </Text>,
                <Text color={C.faint}>{s.elapsed ? `${s.activity} · ${s.elapsed}` : s.activity}</Text>,
              ))(rowOf(selfBeat, now)),
          ]
        : []),
      ...(isOpen('sessions') && !picking
        ? sessions.map((s, i) =>
            row(
              `s-${i}`,
              s.status === 'waiting' ? (
                <Text wrap="truncate">
                  <Text backgroundColor={C.sessions} color={C.ink} bold>{` ! ${s.project} `}</Text>
                  {s.account ? <Text color={C.rose}>{` @${s.account}`}</Text> : null}
                </Text>
              ) : (
                <Box>
                  {s.status === 'working' && hasClient ? (
                    <Box flexShrink={0}>
                      <Text> </Text>
                      <els.Client key={`s-spin-${i}`} module="./spin.tsx" props={{ color: C.ember, now }} />
                      <Text> </Text>
                    </Box>
                  ) : (
                    <Text color={MARK[s.status].color}>{` ${MARK[s.status].icon} `}</Text>
                  )}
                  <Text wrap="truncate">
                    <Text color={C.text}>{` ${s.project}`}</Text>
                    {s.account ? <Text color={C.rose}>{` @${s.account}`}</Text> : null}
                  </Text>
                </Box>
              ),
              <Text color={s.status === 'waiting' ? C.sessions : C.dim} bold={s.status === 'waiting'}>
                {s.elapsed ? `${s.activity} · ${s.elapsed}` : s.activity}
              </Text>,
            ),
          )
        : []),
    ])

    // ---- AGENTS: this session's subagents, then the other sessions' (tagged with where they run)
    const peers = peerAgents(beats, selfId, now)
    const running = cards.filter(c => c.status === 'running').length + peers.filter(a => a.status === 'running').length
    const totalAgents = cards.length + peers.length
    const shown = cards.slice(-9)
    const offset = cards.length - shown.length
    const expanded = v.expandedAgent !== null ? cards[v.expandedAgent] : undefined
    const clock = (c: AgentCard) =>
      c.status !== 'running' ? (
        <Text
          color={c.status === 'done' ? C.jade : C.alarm}
        >{`${c.status === 'done' ? '✓' : '✗'} ${fmtElapsed((c.endedAt ?? now) - c.spawnedAt)}`}</Text>
      ) : hasClient ? (
        <els.Client key={`a-clock-${c.id}`} module="./spin.tsx" props={{ since: c.spawnedAt, now, color: C.ember }} />
      ) : (
        <Text color={C.ember}>{`● ${fmtElapsed(now - c.spawnedAt)}`}</Text>
      )
    const agentsBlock = frame('agents', C.agents, running > 0, [
      headRow(
        'agents',
        'AGENTS',
        C.agents,
        <Text color={C.dim}>{totalAgents === 0 ? ' · chưa có' : ` · ${running} running · ${totalAgents} total`}</Text>,
        shown.length > 0 ? <Text color={C.faint}>{shown.length === 1 ? 'phím 1: xem việc' : `phím 1-${shown.length}: xem việc`}</Text> : null,
      ),
      ...(isOpen('agents')
        ? shown.flatMap((c, j) => {
            const i = offset + j
            return [
              row(
                `a-${j}`,
                <Button
                  key={`a-${j}`}
                  plain
                  hotkey={String(j + 1)}
                  onPress={() => setView($, x => ({ ...x, expandedAgent: x.expandedAgent === i ? null : i }))}
                >
                  <Text color={c.status === 'running' ? C.text : C.dim} wrap="truncate">{c.name}</Text>
                </Button>,
                clock(c),
              ),
              ...(v.expandedAgent === i && expanded
                ? [
                    row(`a-${j}-tok`, <Text color={C.faint}>{`   ${kTokens(expanded.ctx)} context · ${kTokens(expanded.out)} viết ra`}</Text>, null),
                    ...(expanded.tools.length === 0
                      ? [row(`a-${j}-none`, <Text color={C.faint}>{'   chưa gọi tool nào'}</Text>, null)]
                      : []),
                    ...expanded.tools.map((t, k) => row(`a-${j}-t${k}`, <Text color={C.dim} wrap="truncate">{`   · ${t}`}</Text>, null)),
                    ...(expanded.answer
                      ? [row(`a-${j}-ans`, <Text color={C.dim} wrap="truncate">{`   » ${expanded.answer}`}</Text>, null)]
                      : []),
                  ]
                : []),
            ]
          })
        : []),
      ...(isOpen('agents')
        ? peers.slice(0, 9).map((a, k) =>
            row(
              `a-peer-${k}`,
              <Text wrap="truncate">
                <Text color={C.agents}>◇ </Text>
                <Text color={a.status === 'running' ? C.text : C.dim}>{a.name}</Text>
                <Text color={C.faint}>{`  ${kTokens(a.ctx + a.out)} token · `}</Text>
                <Text color={C.dim}>{a.project}</Text>
                {a.account ? <Text color={C.rose}>{` @${a.account}`}</Text> : null}
              </Text>,
              a.status === 'running' ? (
                hasClient ? (
                  <els.Client key={`a-peer-clock-${k}`} module="./spin.tsx" props={{ since: a.spawnedAt, now, color: C.ember }} />
                ) : (
                  <Text color={C.ember}>{`● ${fmtElapsed(now - a.spawnedAt)}`}</Text>
                )
              ) : (
                <Text color={a.status === 'done' ? C.jade : C.alarm}>
                  {`${a.status === 'done' ? '✓' : '✗'} ${fmtElapsed((a.endedAt ?? now) - a.spawnedAt)}`}
                </Text>
              ),
            ),
          )
        : []),
    ])

    // ---- TURN: what the main model is doing now, or a receipt for the turn that just ended
    const model = prettyModel(t.model)
    const isTurnLive = t.startedAt !== null && t.endedAt === null
    const isTurnOk = t.errors === 0 && (t.reason === null || t.reason === 'answer')
    const stats = (
      <Text color={C.dim}>
        <Text color={t.edits > 0 ? C.text : C.dim}>{`${t.edits} sửa`}</Text>
        {' · '}
        <Text color={t.errors > 0 ? C.alarm : C.dim}>{`${t.errors} lỗi`}</Text>
        {' · '}
        <Text color={t.agents > 0 ? C.agents : C.dim}>{`${t.agents} agent`}</Text>
      </Text>
    )
    const turnBlock = frame('turn', C.ember, isTurnLive, [
      row(
        't-head',
        <Text wrap="truncate">
          <Text color={C.ember} bold>
            TURN
          </Text>
          <Text color={C.dim}>{` · ${model}`}</Text>
        </Text>,
        t.startedAt === null ? null : stats,
      ),
      t.startedAt === null ? (
        row('t-none', <Text color={C.faint}>chưa có lượt nào</Text>, null)
      ) : isTurnLive ? (
        row(
          't-now',
          <Text color={C.text}>đang làm</Text>,
          hasClient ? (
            <els.Client key="t-spin" module="./spin.tsx" props={{ color: C.ember, since: t.startedAt, now }} />
          ) : (
            <Text color={C.ember}>{`● ${fmtElapsed(now - t.startedAt)}`}</Text>
          ),
        )
      ) : (
        row(
          't-last',
          <Text color={isTurnOk ? C.jade : C.alarm}>
            {`${isTurnOk ? '✓' : '✗'} lượt trước · ${fmtElapsed((t.endedAt ?? now) - t.startedAt)}`}
            {t.reason && t.reason !== 'answer' ? ` · dừng (${t.reason})` : ''}
          </Text>,
          <Text color={C.faint}>{`xong ${fmtClock(t.endedAt ?? now)}`}</Text>,
        )
      ),
    ])

    // ---- SESSION LOG: a timeline, one glyph per source
    const LOG_MARK: Record<LogLine['who'], { icon: string; color: string }> = {
      you: { icon: '▸', color: C.text },
      main: { icon: '●', color: C.ember },
      agent: { icon: '◇', color: C.agents },
      peer: { icon: '!', color: C.rose },
      queue: { icon: '»', color: C.queue },
    }
    const logLines = (v.logTab === 'all' ? mergeLogs(lines, beats, selfId, now) : lines.filter(l => l.who !== 'peer')).slice(-12)
    const logRow = (l: LogLine, i: number) => {
      const mark = LOG_MARK[l.who]
      const body = (
        <Text wrap="truncate">
          <Text color={C.faint}>{`${fmtClock(l.at)} `}</Text>
          <Text color={mark.color}>{`${mark.icon} `}</Text>
          <Text color={mark.color} bold={l.who === 'you'}>
            {l.label.padEnd(8)}
          </Text>
          <Text color={l.isError ? C.alarm : l.isQuestion ? C.sessions : l.who === 'you' ? C.text : C.dim}>{l.text}</Text>
        </Text>
      )
      const path = l.path
      return row(
        `l-${i}`,
        path ? (
          <Button key={`l-${i}`} plain onPress={() => openFile($, path)}>
            {body}
          </Button>
        ) : (
          body
        ),
        null,
      )
    }
    const tab = (name: 'this' | 'all') => (
      <Button key={`l-tab-${name}`} plain onPress={() => setView($, x => ({ ...x, logTab: name }))}>
        <Text color={v.logTab === name ? C.text : C.faint} bold={v.logTab === name}>
          {v.logTab === name ? `[${name}]` : ` ${name} `}
        </Text>
      </Button>
    )
    const logBlock = frame('log', C.log, false, [
      row(
        'l-head',
        <Button key="l-head" plain onPress={fold('log')}>
          <Text color={C.text} bold>{`${isOpen('log') ? '' : '▸ '}SESSION LOG`}</Text>
          {logLines.length === 0 ? <Text color={C.dim}> · chưa có</Text> : null}
        </Button>,
        <Box>
          {tab('this')}
          {tab('all')}
        </Box>,
      ),
      ...(isOpen('log') ? logLines.map(logRow) : []),
    ])

    // The legend is also the summary: each block's color with the one number that matters in it.
    const chip = (color: string, value: string, isLive: boolean) => (
      <Text>
        <Text color={color}>{'  ● '}</Text>
        <Text color={isLive ? C.text : C.faint} bold={isLive}>{value}</Text>
      </Text>
    )

    return (
      <Box flexDirection="column" width={W}>
        <Box width={W} marginBottom={1}>
          <Box flexGrow={1} flexShrink={1}>
            <Text wrap="truncate">
              <Text bold color={C.text}>
                GLANCEDECK
              </Text>
              <Text color={C.faint}>{' · '}</Text>
              <Text color={C.queue}>{basename(cwd)}</Text>
            </Text>
          </Box>
          <Box flexShrink={0}>
            {chip(C.sessions, `${waiting} chờ bạn`, waiting > 0)}
            {chip(C.queue, `${q.items.length} chờ gửi`, q.items.length > 0)}
            {chip(C.agents, `${running} agent`, running > 0)}
          </Box>
        </Box>
        {sessionsBlock}
        {queueBlock}
        {turnBlock}
        {agentsBlock}
        {logBlock}
        {e.props.isFocused ? null : (
          <Box width={W}>
            <Text color={C.faint} wrap="truncate">
              <Text color={C.dim} bold>ctrl+x</Text> rồi <Text color={C.dim} bold>tab</Text> để vào glancedeck, rồi{' '}
              <Text color={C.dim} bold>↑↓</Text> để di chuyển
            </Text>
          </Box>
        )}
        <Box width={W}>
          <Text color={C.faint}>↑↓ di chuyển · </Text>
          <Button key="f-queue" plain hotkey="q" onPress={async () => {
              await setView($, x => ({ ...x, editing: 'new', focusBlock: 'queue' }))
              await focusInput($, 'q-new')
            }}>
            thêm queue
          </Button>
          <Text color={C.faint}> · </Text>
          <Button
            key="f-send"
            plain
            hotkey="s"
            onPress={() => setView($, x => ({ ...x, picking: { kind: 'message' }, focusBlock: 'sessions' }))}
          >
            nhắn phiên
          </Button>
          <Text color={C.faint}> · </Text>
          <Button
            key="f-collapse"
            plain
            hotkey="c"
            onPress={() => setView($, x => ({ ...x, collapsed: toggle(x.collapsed, x.focusBlock) }))}
          >
            thu gọn
          </Button>
        </Box>
      </Box>
    )
  })
}
