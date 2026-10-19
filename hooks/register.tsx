import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { AgentCard, Block, Heartbeat, LogLine, QueueFile, QueueItem, Runtime, SessionRow, Turn, View } from '../types'
import {
  AGENTS_MAX,
  EDIT_TOOLS,
  applyStep,
  basename,
  describeCall,
  imageContext,
  fmtClock,
  fmtElapsed,
  fmtUntil,
  IMAGE_EXTS,
  imageNumbers,
  isLogged,
  kTokens,
  noteTool,
  pathOf,
  prettyModel,
  promptText,
  pushLog,
  sessionDirName,
  shorten,
} from './core'
import {
  EMPTY_QUEUE,
  IDLE,
  USAGE_LIMIT,
  fire,
  fiveHourOf,
  isSender,
  isUsageBlocked,
  keepToday,
  move,
  newId,
  normalizeQueue,
  parseQ,
  projectKey,
  shouldStart,
} from './queue'
import { accountOf, dueAlerts, isLive, isQueueOwner, mergeLogs, parseHeartbeat, peerAgents, questionOf, rowOf, rowsOf, sharedAgents } from './sessions'

const PANE = 'glancedeck'
const PANE_COLUMNS = 58
const COUNTDOWN_MS = 5000
// A waiting session's chip beats this long, then holds still so it never nags.
const PULSE_MS = 30_000

// Hue names a block; inside a block, color only says state: lantern waits on you, ember works, jade is done.
// Tuned by hand for a dark terminal.
const DARK = {
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
  emberLit: '#FFD9C2',
  agentsLit: '#D6DDFF',
  rowHover: '#2A3040',
  // The wordmark's "deck" rolls through these while anything works.
  ramp: ['#5EE6E6', '#3BB0B3', '#167A80'],
}
type Palette = typeof DARK
// Everywhere else (Desktop, VS Code, a light terminal theme) the same roles by theme key, so the host's own
// light or dark theme picks the shade: the dark palette's near-white text vanished on Desktop's white page.
const THEMED: Palette = {
  queue: 'planMode',
  queueLit: 'planMode',
  queueDeep: 'inactive',
  sessions: 'warning',
  agents: 'suggestion',
  log: 'inactive',
  text: 'text',
  dim: 'inactive',
  faint: 'subtle',
  jade: 'success',
  ember: 'claude',
  rose: 'bashBorder',
  alarm: 'error',
  ink: 'inverseText',
  emberLit: 'text',
  agentsLit: 'text',
  rowHover: 'subtle',
  ramp: ['planMode', 'suggestion', 'ide'],
}
const paletteOf = async ($: EngineInterface, surface: string): Promise<Palette> => {
  if (surface !== 'terminal') return THEMED
  const theme = await $.config
    .list()
    .then(rows => rows.find(r => r.key === 'theme')?.value)
    .catch(() => undefined)
  return typeof theme === 'string' && theme.startsWith('light') ? THEMED : DARK
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
const NO_TURN: Turn = { startedAt: null, endedAt: null, model: '', edits: 0, errors: 0, agents: 0, calls: '', reason: null }
const turn = atom({ plugin: 'glancedeck', key: 'turn' } as const, NO_TURN)
const setTurn = ($: EngineInterface, change: (t: Turn) => Turn) => update($, turn, t => change({ ...NO_TURN, ...t }))

// The TURN strip: one cell per main tool call, its color the kind of work.
const CALLS_MAX = 200
const RUN_TOOLS = new Set(['Bash', 'PowerShell'])
const AGENT_TOOLS = new Set(['Agent', 'Task'])
const LOOK_TOOLS = new Set(['Read', 'Grep', 'Glob', 'LS', 'WebFetch', 'WebSearch'])
const callKind = (tool: string, isError: boolean) =>
  isError ? 'x' : EDIT_TOOLS.has(tool) ? 'e' : RUN_TOOLS.has(tool) ? 'r' : AGENT_TOOLS.has(tool) ? 'a' : LOOK_TOOLS.has(tool) ? 's' : 'o'

/** `1 edit`, `2 edits`. */
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

const BLOCK_OF_KEY: Record<string, Block> ={ q: 'queue', s: 'sessions', a: 'agents', l: 'log' }

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

const firstCwd = new Map<string, string>()

/** The folder the session started in: a `cd` mid-session moves $.session.cwd() but must not rename or re-key the session. */
async function projectCwd($: EngineInterface): Promise<string | null> {
  const [id, cwd] = await Promise.all([$.session.id().catch(() => ''), $.session.cwd().catch(() => null)])
  if (!cwd) return firstCwd.get(id) ?? null
  if (!firstCwd.has(id)) firstCwd.set(id, cwd)
  return firstCwd.get(id) ?? cwd
}

async function queueKey($: EngineInterface): Promise<string | null> {
  const cwd = await projectCwd($)
  return cwd ? projectKey(cwd) : null
}

async function queuePath($: EngineInterface, key?: string): Promise<string | null> {
  const [dir, k] = [await sharedDir($), key ?? (await queueKey($))]
  return dir && k ? `${dir}/queues/${k}.json` : null
}

/** The file Claude Code saved for each `[Image #N]` of a /q, so the prompt sent later still carries the image. */
async function findImages($: EngineInterface, text: string): Promise<Record<string, string>> {
  const numbers = imageNumbers(text)
  if (numbers.length === 0) return {}
  const [id, first, now, ...temps] = await Promise.all([
    $.session.id().catch(() => ''),
    projectCwd($),
    $.session.cwd().catch(() => null),
    $.env.get('CLAUDE_CODE_TMPDIR'),
    $.env.get('TEMP'),
    $.env.get('TMP'),
  ])
  const roots = [...new Set([...temps, '/tmp'].filter((t): t is string => Boolean(t)))]
  const cwds = [...new Set([first, now].filter((c): c is string => Boolean(c)))]
  const files: Record<string, string> = {}
  for (const n of numbers) {
    find: for (const root of roots) {
      const sep = root.includes('\\') ? '\\' : '/'
      for (const cwd of cwds) {
        for (const ext of IMAGE_EXTS) {
          const path = [root.replace(/[\\/]+$/, ''), 'claude', sessionDirName(cwd), id, 'images', `${n}.${ext}`].join(sep)
          if (await $.fs.exists(path).catch(() => false)) {
            files[String(n)] = path
            break find
          }
        }
      }
    }
  }
  return files
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
async function queueInto($: EngineInterface, key: string, text: string, atFront: boolean, sender?: string) {
  const path = await queuePath($, key)
  if (!path) return
  const q = await readQueueFile($, path)
  const now = await $.clock.now()
  made += 1
  const item: QueueItem = { id: newId(now, made), text, ifOk: false, addedAt: now, ...(sender ? { sender } : {}) }
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
    projectCwd($).then(c => c ?? ''),
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
    activity: kind === 'waiting' ? (rt.question ?? 'waiting for you') : (last?.text ?? ''),
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

  // Sessions on one repo share its queue: each item goes out from the session it was queued in,
  // and the one that started first sends the items whose session is gone.
  const isOwner = isQueueOwner(beats, beat, now)
  const peers = beats.filter(h => h.queueKey === key && isLive(h, now)).map(h => h.sessionId)
  if (isOwner !== rt.isQueueOwner || id !== rt.selfId || peers.join() !== rt.queuePeers.join()) {
    const next = { ...rt, isQueueOwner: isOwner, selfId: id, queuePeers: peers }
    const head = normalizeQueue(await read($, queue)).items[0]
    if (rt.countdown && head && !isSender(head, next)) await cancelCountdown($, 'turn')
    await setRuntime($, r => ({ ...r, isQueueOwner: isOwner, selfId: id, queuePeers: peers }))
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
    $.ui.toast(`glancedeck: ${who} has been waiting for you for 3 min: ${due.beat.activity}`, { timeoutMs: 10_000 })
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
    await say($, { who: 'queue', label: 'queue', text: why === 'typed' ? 'send cancelled: you are typing' : 'send cancelled, queue paused' })
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
    const until = w.resetsAt ? ` until ${fmtClock(w.resetsAt).slice(0, 5)}` : ''
    $.ui.toast(`glancedeck: queue paused: 5h usage at ${w.percent}%${until}.`)
    await say($, { who: 'queue', label: 'queue', text: `paused: 5h ${w.percent}% > ${USAGE_LIMIT}%${until}` })
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
    if (q.items.length > 0) await say($, { who: 'queue', label: 'queue', text: 'resumed: 5h window reset' })
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
    $.ui.toast(`glancedeck: not sent "${shorten(result.item.text, 40)}": the last turn had errors (--if-ok). Queue paused.`)
    await say($, { who: 'queue', label: 'queue', text: `held (--if-ok): ${shorten(result.item.text, 40)}`, isError: true })
    return
  }
  await say($, { who: 'queue', label: 'queue', text: `sent: ${shorten(result.item.text, 60)}` })
  // The prompt shows `[Image #N]`; a row the person does not see tells the model where each one is.
  // (Not a prompt.submit hook's context: a plugin's own hooks skip the prompt it submits.)
  const images = imageContext(result.item.images)
  if (images.length > 0) {
    await $.session.append({ message: { type: 'user', content: [{ type: 'text', text: images.join('\n') }] } }).catch(() => undefined)
  }
  await $.prompt.submit({ text: result.item.text, asUser: true })
}

async function addItem($: EngineInterface, text: string, ifOk: boolean, images: Record<string, string> = {}): Promise<QueueItem> {
  const now = await $.clock.now()
  made += 1
  const sender = await $.session.id().catch(() => null)
  const item: QueueItem = {
    id: newId(now, made),
    text,
    ifOk,
    addedAt: now,
    ...(sender ? { sender } : {}),
    ...(Object.keys(images).length > 0 ? { images } : {}),
  }
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
      const item = await addItem($, cmd.text, cmd.ifOk, await findImages($, cmd.text))
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
        model: started.model,
      }
      await setAgents($, list => [...list, card].slice(-AGENTS_MAX))
      if (!e.parentAgentId) await setTurn($, t => (t.endedAt === null && t.startedAt !== null ? { ...t, agents: t.agents + 1 } : t))
      if (e.background && !e.parentAgentId) await setRuntime($, r => ({ ...r, background: [...r.background, agentId] }))
      await say($, { who: 'agent', label: await agentLabel($, card.id), text: `started · ${card.name}` })
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
        await say($, { who: 'main', label: 'main', text: `asks: ${question}`, isQuestion: true })
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
      if (!id) await setTurn($, t => (t.endedAt === null && t.startedAt !== null ? { ...t, calls: `${t.calls ?? ''}${callKind(e.tool, isError)}`.slice(-CALLS_MAX) } : t))
      if (!isLogged(e.tool)) return
      const text = describeCall(e.tool, e)
      if (id) await setAgents($, list => list.map(c => (c.id === id ? noteTool(c, text) : c)))
      const path = EDIT_TOOLS.has(e.tool) && !isError ? pathOf(e) : undefined
      await say($, {
        who: id ? 'agent' : 'main',
        label: id ? await agentLabel($, id) : 'main',
        text: isError ? `${text}  ×` : text,
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
          text: status === 'done' ? `done · ${fmtElapsed(now - (card?.spawnedAt ?? now))}` : `stopped (${e.reason})`,
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
    const C = await paletteOf($, e.surface)

    return (
      <Box>
        <Text color={isHeld ? C.alarm : C.queue} bold>
          {isHeld ? '× held ' : '► sending soon '}
        </Text>
        <Text color={C.text} wrap="truncate">
          {shorten(head.text, Math.max(10, e.props.bodyColumns - 34))}
        </Text>
        <Text> </Text>
        <Button key="band-send" label={isHeld ? 'Send anyway' : 'Send now'} hotkey="n" onPress={() => sendNow($)} />
        <Text> </Text>
        <Button
          key="band-cancel"
          label={isHeld ? 'Drop' : 'Cancel'}
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
    const C = await paletteOf($, e.surface)
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
      projectCwd($).then(c => c ?? '?'),
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
    // One column of air on each side of the pane.
    const W = Math.max(40, e.props.bodyColumns - 2)
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
          <Text color={color} bold>{`${isOpen(block) ? '▾' : '▸'} ${title}`}</Text>
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
    const autoText = (head ? !isSender(head, rt) : !rt.isQueueOwner)
      ? 'another session sends'
      : q.paused
        ? q.pauseReason === 'if-ok'
          ? 'paused: error'
          : 'auto off'
        : usageHold
          ? `paused: 5h ${Math.round(usageHold.percent)}%`
          : 'auto on'
    const autoColor = q.paused ? (q.pauseReason === 'if-ok' ? C.alarm : C.dim) : usageHold ? C.sessions : C.jade
    const itemRight = (item: QueueItem, i: number) =>
      item.isBlocked ? (
        <Text color={C.alarm}>× error</Text>
      ) : i === 0 ? (
        q.paused ? (
          <Text color={C.dim}>○ paused</Text>
        ) : (
          <Text color={C.queue} bold>
            next
          </Text>
        )
      ) : item.ifOk ? (
        <Text color={C.sessions}>if no errors</Text>
      ) : (
        <Text color={C.faint}>waiting</Text>
      )
    const editor = (key: string, value: string, onSubmit: (text: string) => Promise<unknown>) => (
      <Box key={key} width={inner}>
        {Input ? (
          <Input
            key={key}
            label=""
            value={value}
            placeholder="what Claude should do next…"
            autoFocus
            onSubmit={(text: string) => {
              void setView($, x => ({ ...x, editing: null }))
              if (text.trim()) void onSubmit(text.trim())
            }}
          />
        ) : (
          <Text color={C.faint}>Use /q &lt;task&gt; on this device.</Text>
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
                fg: C === DARK ? C.text : C.ink,
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
            {counting && isHead ? `${item.text} · in ${Math.max(0, Math.ceil((counting.endsAt - now) / 1000))}s` : item.text}
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
    const addNew = async () => {
      await setView($, x => ({ ...x, editing: 'new', focusBlock: 'queue' }))
      await focusInput($, 'q-new')
    }
    const queueBlock = frame('queue', C.queue, q.items.length > 0 && !q.paused && !usageHold, [
      headRow(
        'queue',
        'QUEUE',
        C.queue,
        <Text color={C.dim}>
          {` · ${q.items.length} queued · `}
          <Text color={autoColor}>{autoText}</Text>
        </Text>,
        usageHold?.resetsAt ? (
          <Text color={C.sessions}>{`○ resumes in ${fmtUntil(usageHold.resetsAt - now)}`}</Text>
        ) : (
          <Text color={C.faint}>{`pauses if 5h>${USAGE_LIMIT}%`}</Text>
        ),
      ),
      ...(isOpen('queue')
        ? [
            ...q.items.map(itemRow),
            ...(v.editing === 'new' ? [editor('q-new', '', text => addItem($, text, false))] : []),
            ...(v.editing !== 'new'
              ? [
                  row(
                    'q-add',
                    <Button key="q-add" plain hotkey="q" onPress={addNew}>
                      <Text color={C.dim}>+ add</Text>
                    </Button>,
                    null,
                  ),
                ]
              : []),
            ...(sentToday > 0 ? [row('q-sent', <Text color={C.faint}>{`• sent today: ${sentToday}`}</Text>, null)] : []),
            ...(isQueueFocused && q.items.length > 0
              ? [
                  <Box key="q-keys" width={inner}>
                    {act('q-k-up', 'k', 'up', () => selected && changeQueue($, x => move(x, selected, -1)))}
                    <Text color={C.faint}> </Text>
                    {act('q-k-down', 'j', 'down', () => selected && changeQueue($, x => move(x, selected, 1)))}
                    <Text color={C.faint}> </Text>
                    {act('q-k-edit', 'e', 'edit', async () => {
                      if (!selected) return
                      await setView($, x => ({ ...x, editing: selected }))
                      await focusInput($, `q-edit-${selected}`)
                    })}
                    <Text color={C.faint}> </Text>
                    {act(
                      'q-k-del',
                      'd',
                      'delete',
                      () => selected && changeQueue($, x => ({ ...x, items: x.items.filter(i => i.id !== selected) })),
                    )}
                    <Text color={C.faint}> </Text>
                    {act('q-k-pause', 'p', q.paused ? 'resume' : 'pause', () => (q.paused ? resume($) : pause($)))}
                    <Text color={C.faint}> </Text>
                    {act('q-k-now', 'n', 'send', () => sendNow($))}
                    <Text color={C.faint}> </Text>
                    {act(
                      'q-k-move',
                      'm',
                      'to session',
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
    const canMessage = (s: (typeof sessions)[number]) => Boolean(s.queueKey && s.queueKey !== ownKey)
    const targets = sessions.filter(canMessage)
    const pickSession = async (s: (typeof sessions)[number]) => {
      if (!picking) return
      if (picking.kind === 'move') {
        const item = q.items.find(i => i.id === picking.itemId)
        if (item) {
          await queueInto($, s.queueKey, item.text, false)
          await changeQueue($, x => ({ ...x, items: x.items.filter(i => i.id !== item.id) }))
          await say($, { who: 'queue', label: 'queue', text: `moved to ${s.project}: ${shorten(item.text, 40)}` })
        }
        await setView($, x => ({ ...x, picking: null }))
      } else {
        await setView($, x => ({ ...x, picking: null, messageTo: s.sessionId }))
        await focusInput($, 's-msg-input')
      }
    }
    // A click on another session's row opens the message line to it; a second click closes it.
    const messageSession = async (s: (typeof sessions)[number]) => {
      if (v.messageTo === s.sessionId) return setView($, x => ({ ...x, messageTo: null }))
      await setView($, x => ({ ...x, picking: null, messageTo: s.sessionId }))
      await focusInput($, 's-msg-input')
    }
    const messageTarget = v.messageTo ? sessions.find(s => s.sessionId === v.messageTo) : undefined
    const waiting = sessions.filter(s => s.status === 'waiting').length
    const MARK: Record<SessionRow['status'], { icon: string; color: string }> = {
      waiting: { icon: '!', color: C.sessions },
      working: { icon: '●', color: C.ember },
      done: { icon: '○', color: C.jade },
    }
    const sessionsBlock = frame('sessions', C.sessions, waiting > 0, [
      headRow(
        'sessions',
        'SESSIONS',
        C.sessions,
        <Text color={C.dim}>{sessions.length === 0 ? ' · no other sessions' : ` · ${sessions.length} other`}</Text>,
        picking ? (
          <Button key="s-pick-cancel" plain onPress={() => setView($, x => ({ ...x, picking: null }))}>
            <Text color={C.sessions}>pick a session · cancel</Text>
          </Button>
        ) : waiting > 0 ? (
          <Text color={C.sessions} bold>{`${waiting} waiting`}</Text>
        ) : null,
      ),
      ...(isOpen('sessions') && picking && targets.length === 0
        ? [row('s-none', <Text color={C.faint}>No sessions in other repos to send to.</Text>, null)]
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
              <Text color={C.dim}>{s.status === 'done' ? 'idle' : 'queues it'}</Text>,
            ),
          )
        : []),
      ...(isOpen('sessions') && messageTarget
        ? [
            <Box key="s-msg" width={inner}>
              {/* The label keeps its width; a long placeholder used to squeeze it onto two lines. */}
              <Box flexShrink={0}>
                <Text color={C.sessions}>{`→ ${shorten(messageTarget.project, 20)}${messageTarget.account ? ` @${messageTarget.account}` : ''}: `}</Text>
              </Box>
              {Input ? (
                <Input
                  key="s-msg-input"
                  label=""
                  placeholder="sent as you when it is idle…"
                  autoFocus
                  onSubmit={(text: string) => {
                    void setView($, x => ({ ...x, messageTo: null }))
                    if (text.trim()) {
                      void queueInto($, messageTarget.queueKey, text.trim(), true, messageTarget.sessionId)
                      void say($, { who: 'queue', label: 'queue', text: `message ${messageTarget.project}: ${shorten(text.trim(), 40)}` })
                    }
                  }}
                />
              ) : (
                <Text color={C.faint}>no text input on this device</Text>
              )}
            </Box>,
          ]
        : []),
      ...(isOpen('sessions') && !picking && selfBeat
        ? [
            ((s: SessionRow) =>
              row(
                's-self',
                s.status === 'working' && hasClient ? (
                  <Box>
                    <Box flexShrink={0}>
                      <Text> </Text>
                      <els.Client key="s-self-spin" module="./spin.tsx" props={{ color: C.ember, now }} />
                      <Text>  </Text>
                    </Box>
                    <Text wrap="truncate" color={C.dim}>
                      {s.project}
                      {s.account ? ` @${s.account}` : ''}
                    </Text>
                  </Box>
                ) : (
                  <Text wrap="truncate" color={C.dim}>
                    {` ${MARK[s.status].icon}  ${s.project}`}
                    {s.account ? ` @${s.account}` : ''}
                  </Text>
                ),
                // What this session is doing is the TURN block's to say; here it only marks which row is you.
                <Text color={C.faint}>this session</Text>,
              ))(rowOf(selfBeat, now)),
          ]
        : []),
      ...(isOpen('sessions') && !picking
        ? sessions.map((s, i) => {
            const mark =
              s.status === 'waiting' ? (
                hasClient ? (
                  <Box key={`s-mark-${i}`} flexShrink={0}>
                    <els.Client
                      key={`s-pulse-${i}`}
                      module="./pulse.tsx"
                      props={{ text: ` ! ${s.project} `, fg: C.ink, a: C.sessions, b: C.ember, bold: true, stopAfterMs: PULSE_MS }}
                    />
                  </Box>
                ) : (
                  <Text key={`s-mark-${i}`} backgroundColor={C.sessions} color={C.ink} bold>{` ! ${s.project} `}</Text>
                )
              ) : s.status === 'working' && hasClient ? (
                <Box key={`s-mark-${i}`} flexShrink={0}>
                  <Text> </Text>
                  <els.Client key={`s-spin-${i}`} module="./spin.tsx" props={{ color: C.ember, now }} />
                  <Text> </Text>
                </Box>
              ) : (
                <Text key={`s-mark-${i}`} color={MARK[s.status].color}>{` ${MARK[s.status].icon} `}</Text>
              )
            const markWidth = s.status === 'waiting' ? s.project.length + 4 : 3
            const name = `${s.status === 'waiting' ? '' : ` ${s.project}`}${s.account ? ` @${s.account}` : ''}`
            const activity = s.elapsed ? `${s.activity} · ${s.elapsed}` : s.activity
            const actColor = s.status === 'waiting' ? C.sessions : C.dim
            if (canMessage(s)) {
              // A Button has no width of its own, so the gap between name and activity is spaces inside it:
              // a click anywhere right of the mark opens the message line, not only on the words.
              const room = Math.max(0, inner - markWidth)
              const act = shorten(activity, Math.max(1, room - 1))
              const nm = name.length > room - act.length - 1 ? shorten(name, Math.max(1, room - act.length - 1)) : name
              const gap = ' '.repeat(Math.max(1, room - nm.length - act.length))
              const project = s.status === 'waiting' ? '' : nm.slice(0, s.project.length + 1)
              // A mark that is plain text goes inside the Button, so the row has no sibling to catch the
              // pointer: on the terminal a click on the name missed whenever the mark stood beside it.
              if (!(hasClient && (s.status === 'waiting' || s.status === 'working'))) {
                return (
                  <Box key={`s-${i}`} width={inner} hover={{ backgroundColor: C.rowHover }}>
                    <Button key={`s-row-${i}`} plain onPress={() => messageSession(s)}>
                      {mark}
                      <Text color={C.text}>{project}</Text>
                      <Text color={C.rose}>{nm.slice(project.length)}</Text>
                      {gap}
                      <Text color={actColor} bold={s.status === 'waiting'}>{act}</Text>
                    </Button>
                  </Box>
                )
              }
              return (
                // The row's keyed Box is a hover scope: the pointer anywhere on the line, the mark included,
                // lights the whole line. The terminal's hit region of a Button placed after a sibling lands
                // that sibling's width to the right of where it is drawn, so the Button starts the row (blanks
                // under the mark) and the mark, which may be a Client, is painted over those blanks.
                <Box key={`s-${i}`} width={inner} hover={{ backgroundColor: C.rowHover }}>
                  <Button key={`s-row-${i}`} plain onPress={() => messageSession(s)}>
                    {' '.repeat(markWidth)}
                    <Text color={C.text}>{project}</Text>
                    <Text color={C.rose}>{nm.slice(project.length)}</Text>
                    {gap}
                    <Text color={actColor} bold={s.status === 'waiting'}>{act}</Text>
                  </Button>
                  <Box position="absolute" left={0} top={0}>
                    {mark}
                  </Box>
                </Box>
              )
            }
            return row(
              `s-${i}`,
              <Box>
                {mark}
                <Text wrap="truncate">
                  <Text color={C.text}>{s.status === 'waiting' ? '' : ` ${s.project}`}</Text>
                  {s.account ? <Text color={C.rose}>{` @${s.account}`}</Text> : null}
                </Text>
              </Box>,
              <Text color={actColor} bold={s.status === 'waiting'}>{activity}</Text>,
            )
          })
        : []),
    ])

    // ---- AGENTS: this session's subagents, then the other sessions' (tagged with where they run)
    const peers = peerAgents(beats, selfId, now)
    const running = cards.filter(c => c.status === 'running').length + peers.filter(a => a.status === 'running').length
    const totalAgents = cards.length + peers.length
    const shown = cards.slice(-9)
    const offset = cards.length - shown.length
    const expanded = v.expandedAgent !== null ? cards[v.expandedAgent] : undefined
    // A light sweeps the names of the first few running agents; more would cost the drawing thread for little.
    const glowing = new Set(shown.filter(c => c.status === 'running').slice(0, 4).map(c => c.id))
    const clock = (c: AgentCard) =>
      c.status !== 'running' ? (
        <Text
          color={c.status === 'done' ? C.jade : C.alarm}
        >{`${c.status === 'done' ? '•' : '×'} ${fmtElapsed((c.endedAt ?? now) - c.spawnedAt)}`}</Text>
      ) : hasClient ? (
        <els.Client key={`a-clock-${c.id}`} module="./spin.tsx" props={{ since: c.spawnedAt, now, color: C.ember }} />
      ) : (
        <Text color={C.ember}>{`● ${fmtElapsed(now - c.spawnedAt)}`}</Text>
      )
    // The model sits on the right, just before the clock, so names keep the left column.
    const withModel = (model: string | undefined, right: JSX.Element) =>
      model ? (
        <Box>
          <Text color={C.faint}>{`${prettyModel(model)} `}</Text>
          {right}
        </Box>
      ) : (
        right
      )
    const agentsBlock = frame('agents', C.agents, running > 0, [
      headRow(
        'agents',
        'AGENTS',
        C.agents,
        <Text color={C.dim}>{totalAgents === 0 ? ' · none yet' : ` · ${running} running · ${totalAgents} total`}</Text>,
        shown.length > 0 ? <Text color={C.faint}>{shown.length === 1 ? 'key 1: view work' : `keys 1-${shown.length}: view work`}</Text> : null,
      ),
      ...(isOpen('agents')
        ? shown.flatMap((c, j) => {
            const i = offset + j
            return [
              row(
                `a-${j}`,
                // A Button holds only text, so it carries the agent's key; the name beside it may sweep.
                <Box>
                  <Button
                    key={`a-${j}`}
                    plain
                    hotkey={String(j + 1)}
                    onPress={() => setView($, x => ({ ...x, expandedAgent: x.expandedAgent === i ? null : i }))}
                  >
                    <Text color={v.expandedAgent === i ? C.agents : C.faint}>{`${j + 1} `}</Text>
                  </Button>
                  {hasClient && glowing.has(c.id) ? (
                    <els.Client key={`a-glow-${c.id}`} module="./spin.tsx" props={{ color: C.text, lit: C.agentsLit, label: c.name, noFrame: true, now }} />
                  ) : (
                    <Text wrap="truncate" color={c.status === 'running' ? C.text : C.dim}>
                      {c.name}
                    </Text>
                  )}
                </Box>,
                withModel(c.model, clock(c)),
              ),
              ...(v.expandedAgent === i && expanded
                ? [
                    row(`a-${j}-tok`, <Text color={C.faint}>{`   ${kTokens(expanded.ctx)} context · ${kTokens(expanded.out)} output`}</Text>, null),
                    ...(expanded.tools.length === 0
                      ? [row(`a-${j}-none`, <Text color={C.faint}>{'   no tool calls yet'}</Text>, null)]
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
                <Text color={C.agents}>◊ </Text>
                <Text color={a.status === 'running' ? C.text : C.dim}>{a.name}</Text>
                <Text color={C.faint}>{`  ${kTokens(a.ctx + a.out)} tokens · `}</Text>
                <Text color={C.dim}>{a.project}</Text>
                {a.account ? <Text color={C.rose}>{` @${a.account}`}</Text> : null}
              </Text>,
              withModel(a.model, a.status === 'running' ? (
                hasClient ? (
                  <els.Client key={`a-peer-clock-${k}`} module="./spin.tsx" props={{ since: a.spawnedAt, now, color: C.ember }} />
                ) : (
                  <Text color={C.ember}>{`● ${fmtElapsed(now - a.spawnedAt)}`}</Text>
                )
              ) : (
                <Text color={a.status === 'done' ? C.jade : C.alarm}>
                  {`${a.status === 'done' ? '•' : '×'} ${fmtElapsed((a.endedAt ?? now) - a.spawnedAt)}`}
                </Text>
              )),
            ),
          )
        : []),
    ])

    // ---- TURN: what the main model is doing now, or a receipt for the turn that just ended
    const model = prettyModel(t.model)
    const isTurnLive = t.startedAt !== null && t.endedAt === null
    const isTurnOk = t.errors === 0 && (t.reason === null || t.reason === 'answer')
    // The live row names what the turn is on: its latest tool call, or "thinking" before the first one.
    const turnStart = t.startedAt
    const latest = isTurnLive ? [...lines].reverse().find(l => l.who === 'main' && turnStart !== null && l.at >= turnStart) : undefined
    // Room for the label: the row less the spinner and its space, and the clock on the right with a cell of growth.
    const clockCols = fmtElapsed(now - (turnStart ?? now)).length + 2
    const doing = shorten(latest?.text ?? 'thinking…', Math.max(10, inner - 2 - clockCols))
    const stats = (
      <Text color={C.dim}>
        <Text color={t.edits > 0 ? C.text : C.dim}>{plural(t.edits, 'edit')}</Text>
        {' · '}
        <Text color={t.errors > 0 ? C.alarm : C.dim}>{plural(t.errors, 'error')}</Text>
        {' · '}
        <Text color={t.agents > 0 ? C.agents : C.dim}>{plural(t.agents, 'agent')}</Text>
      </Text>
    )
    // One ■ per tool call, colored by the kind of work, growing as calls come (no pre-drawn track);
    // past the width it shows the latest. The pointer on it shows the key.
    const CALL_COLOR: Record<string, string> = { e: C.jade, r: C.ember, a: C.agents, s: C.dim, o: C.log, x: C.alarm }
    const calls = t.calls ?? ''
    const callsLabel = plural(calls.length, 'call')
    const track = Math.max(4, inner - callsLabel.length - 1)
    const cells = calls.slice(-track)
    const runs: { kind: string; n: number }[] = []
    for (const k of cells) {
      const last = runs[runs.length - 1]
      if (last && last.kind === k) last.n += 1
      else runs.push({ kind: k, n: 1 })
    }
    const callStrip = row(
      't-strip',
      <Text wrap="truncate">
        {runs.map((r, k) => (
          <Text key={`t-run-${k}`} color={CALL_COLOR[r.kind] ?? C.faint}>
            {'■'.repeat(r.n)}
          </Text>
        ))}
      </Text>,
      <Text color={C.faint}>{callsLabel}</Text>,
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
        row('t-none', <Text color={C.faint}>no turns yet</Text>, null)
      ) : isTurnLive ? (
        row(
          't-now',
          hasClient ? (
            <els.Client key="t-spin-label" module="./spin.tsx" props={{ color: C.ember, lit: C.emberLit, label: doing, bold: true, now }} />
          ) : (
            <Text color={C.ember} bold>
              {`● ${doing}`}
            </Text>
          ),
          hasClient ? (
            <els.Client
              key="t-spin"
              module="./spin.tsx"
              props={{ color: C.ember, clockOnly: true, bold: true, since: t.startedAt, now }}
            />
          ) : (
            <Text color={C.ember}>{`● ${fmtElapsed(now - t.startedAt)}`}</Text>
          ),
        )
      ) : (
        row(
          't-last',
          <Text color={isTurnOk ? C.jade : C.alarm}>
            {`${isTurnOk ? '•' : '×'} last turn · ${fmtElapsed((t.endedAt ?? now) - t.startedAt)}`}
            {t.reason && t.reason !== 'answer' ? ` · stopped (${t.reason})` : ''}
          </Text>,
          <Text color={C.faint}>{`ended ${fmtClock(t.endedAt ?? now)}`}</Text>,
        )
      ),
      ...(t.startedAt !== null && calls.length > 0 ? [callStrip] : []),
    ])

    // ---- SESSION LOG: a timeline, one glyph per source
    const LOG_MARK: Record<LogLine['who'], { icon: string; color: string }> = {
      you: { icon: '▸', color: C.text },
      main: { icon: '●', color: C.ember },
      agent: { icon: '◊', color: C.agents },
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
          <Text color={C.log} bold>{`${isOpen('log') ? '' : '▸ '}SESSION LOG`}</Text>
          {logLines.length === 0 ? <Text color={C.dim}> · none yet</Text> : null}
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
      <Box flexDirection="column" width={W + 2} paddingX={1}>
        <Box width={W} marginBottom={1}>
          <Box flexGrow={1} flexShrink={1}>
            {hasClient ? (
              <els.Client key="wordmark" module="./wordmark.tsx" props={{ isBusy: isTurnLive || running > 0, text: C.text, ramp: C.ramp }} />
            ) : (
              <Text wrap="truncate">
                {/* ♦ is in Consolas, so the terminal draws it in one cell; ◈ came from a fallback font and spilled over the next cell. */}
                <Text color={C.queue}>{'♦ '}</Text>
                <Text bold color={C.text}>glance</Text>
                <Text bold color={C.queue}>deck</Text>
              </Text>
            )}
          </Box>
          <Box flexShrink={0}>
            {waiting > 0 && hasClient ? (
              <Box>
                <Text>{'  '}</Text>
                <els.Client
                  key="h-waiting"
                  module="./pulse.tsx"
                  props={{ text: ` ${waiting} waiting `, fg: C.ink, a: C.sessions, b: C.ember, bold: true, stopAfterMs: PULSE_MS }}
                />
              </Box>
            ) : (
              chip(C.sessions, `${waiting} waiting`, waiting > 0)
            )}
            {chip(C.queue, `${q.items.length} queued`, q.items.length > 0)}
            {chip(C.agents, plural(running, 'agent'), running > 0)}
          </Box>
        </Box>
        {/* A terminal's borders already part the blocks; elsewhere they touched, so give them air. */}
        <Box flexDirection="column" gap={e.surface === 'terminal' ? 0 : 1}>
          {sessionsBlock}
          {queueBlock}
          {turnBlock}
          {agentsBlock}
          {logBlock}
        </Box>
      </Box>
    )
  })
}
