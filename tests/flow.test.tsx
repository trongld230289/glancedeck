import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const PANE = {
  component: 'Pane',
  requestId: 'glancedeck',
  props: {
    title: 'GLANCEDECK',
    isFocused: true,
    bodyColumns: 58,
    placement: 'dock',
    scroll: { bodyRows: 60, offset: 0, contentRows: 0 },
    view: {},
  },
} as const

const BAND = {
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 100,
    scroll: { bodyRows: 10, offset: 0, contentRows: 0 },
    view: {},
  },
} as const

/** A session on D:/Project/glanceline with an in-memory disk; returns the disk, the clock and what was submitted. */
function world(on: On) {
  const clock = mock.clock(on, { now: Date.UTC(2026, 9, 18, 3, 0, 0) })
  mock.env(on, { USERPROFILE: 'C:\\Users\\t', OS: 'Windows_NT', TEMP: 'C:\\Users\\t\\Temp' })
  const files = new Map<string, string>()
  const submitted: { text: string; asUser?: true }[] = []
  const toasts: string[] = []
  on('session.cwd', () => ({ value: 'D:/Project/glanceline' }))
  on('fs.read', (_, e) => {
    const text = files.get(e.path)
    return text === undefined ? { deny: `no such file: ${e.path}` } : { value: text }
  })
  on('fs.write', (_, e) => {
    files.set(e.path, e.text)
    return { value: undefined }
  })
  on('prompt.submit', (_, e) => {
    submitted.push({ text: e.text, ...(e.origin.kind === 'plugin' && e.origin.asUser ? { asUser: true as const } : {}) })
    return { text: e.text }
  })
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('tool.call', (_, e) => (e.tool === 'Bash' ? { isError: true, result: 'exit 1', text: 'exit 1' } : { result: { ok: true } as never }))
  on('turn.complete', () => ({ text: '' }))
  on('turn.start', () => ({ turnId: 't1' }))
  on('session.start', () => ({ cwd: 'D:/Project/glanceline' }))
  on('command.register', () => ({ value: undefined }) as never)
  on('agent.spawn', () => ({ agentId: 'bg1', model: 'claude-haiku-5-5' }))
  return {
    clock,
    files,
    submitted,
    toasts,
    queueText: () => [...files.entries()].find(([p]) => /[\\/]\.glancedeck[\\/]queues[\\/]glanceline-/.test(p))?.[1] ?? '',
  }
}

const q = ($: Engine, args: string) => $.command.run({ command: 'q', args } as never)
const turnStart = ($: Engine) => $.turn.start({ text: 'làm việc', turnId: 't1' } as never)
const turnEnd = ($: Engine, extra: object = {}) =>
  $.turn.complete({ reason: 'answer', answer: '', durationMs: 1, isAborted: false, turnId: 't1', ...extra } as never)

test('/q while idle counts down 5 seconds, then sends the text as the person', async ($, on) => {
  const w = world(on)
  await q($, 'viết test cho install.py')

  const band = await $.ui.mount({ plugin: 'glancedeck', surface: 'terminal', ...BAND })
  expect(await band.find({ text: /sending soon/ })).toBeDefined()
  await band.unmount()
  expect(w.submitted).toEqual([])

  await w.clock.advance(5000)
  expect(w.submitted).toEqual([{ text: 'viết test cho install.py', asUser: true }])
  expect(JSON.parse(w.queueText()).items).toEqual([])
  expect(JSON.parse(w.queueText()).sent.length).toBe(1)
})

test('a /q with a pasted image sends the image file along, not the bare [Image #N]', async ($, on) => {
  const w = world(on)
  const saved = 'C:\\Users\\t\\Temp\\claude\\D--Project-glanceline\\s1\\images\\4.png'
  on('session.id', () => ({ value: 's1' }))
  on('fs.exists', (_, e) => ({ value: e.path === saved }) as never)
  await q($, '[Image #4] [Image #9] sửa lỗi này')

  await w.clock.advance(5000)
  expect(w.submitted).toEqual([{ text: `[Image: source: ${saved}] [Image #9] sửa lỗi này`, asUser: true }])
})

test('items wait for the turn and for background agents, then go one at a time', async ($, on) => {
  const w = world(on)
  await turnStart($)
  await q($, 'một')
  await q($, 'hai')
  await $.agent.spawn({ prompt: 'p', description: 'Build core', subagentType: 'general-purpose', background: true } as never)
  await turnEnd($)
  await w.clock.advance(10_000)
  expect(w.submitted).toEqual([])

  await turnEnd($, { agentId: 'bg1' })
  await w.clock.advance(5000)
  expect(w.submitted.map(s => s.text)).toEqual(['một'])

  // The sent item starts a turn; the second waits for it to end.
  await turnStart($)
  await w.clock.advance(10_000)
  expect(w.submitted.map(s => s.text)).toEqual(['một'])
  await turnEnd($)
  await w.clock.advance(5000)
  expect(w.submitted.map(s => s.text)).toEqual(['một', 'hai'])
})

test('--if-ok after a turn with a failed tool call is held, the queue pauses and a toast says why', async ($, on) => {
  const w = world(on)
  await turnStart($)
  await $.tool.call({ tool: 'Bash', tool_use_id: 'b1', command: 'npm test' } as never)
  await q($, '--if-ok chạy installer --all-accounts')
  await turnEnd($)
  await w.clock.advance(5000)

  expect(w.submitted).toEqual([])
  expect(w.toasts.some(t => /last turn had errors/.test(t))).toBe(true)
  const stored = JSON.parse(w.queueText())
  expect(stored.paused).toBe(true)
  expect(stored.pauseReason).toBe('if-ok')

  const pane = await $.ui.mount({ plugin: 'glancedeck', surface: 'terminal', ...PANE })
  expect(await pane.find({ text: /× error/ })).toBeDefined()
  await pane.unmount()
})

test('Cancel in the band cancels and pauses; Send now sends at once', async ($, on) => {
  const w = world(on)
  await q($, 'một')
  let band = await $.ui.mount({ plugin: 'glancedeck', surface: 'terminal', ...BAND })
  await band.press({ key: 'band-cancel' })
  await band.unmount()
  await w.clock.advance(10_000)
  expect(w.submitted).toEqual([])
  expect(JSON.parse(w.queueText()).pauseReason).toBe('cancel')

  await q($, 'resume')
  band = await $.ui.mount({ plugin: 'glancedeck', surface: 'terminal', ...BAND })
  await band.press({ key: 'band-send' })
  await band.unmount()
  expect(w.submitted.map(s => s.text)).toEqual(['một'])
})

test('the queue survives a restart: session.start reads it back', async ($, on) => {
  const w = world(on)
  await q($, 'giữ lại qua restart')
  await q($, 'pause')
  const saved = w.queueText()

  await $.session.start({ cwd: 'D:/Project/glanceline', surface: 'terminal', isInteractive: true } as never)
  expect(w.queueText()).toBe(saved)
  const pane = await $.ui.mount({ plugin: 'glancedeck', surface: 'terminal', ...PANE })
  expect(await pane.find({ text: /giữ lại qua restart/ })).toBeDefined()
  expect(await pane.find({ text: /auto off/ })).toBeDefined()
  await pane.unmount()
})

test('over 90% of the 5h window holds the queue, says so once, and goes on by itself after the reset', async ($, on) => {
  const w = world(on)
  const resetsAt = Date.UTC(2026, 9, 18, 3, 30, 0)
  on('session.usage', () => ({
    value: {
      startedAt: 0,
      context: { window: 200_000 },
      rateLimits: [{ kind: 'five_hour', percentUsed: 93, resetsAt: new Date(resetsAt).toISOString() }],
    } as never,
  }))

  await q($, 'chạy test sau khi reset')
  await w.clock.advance(10_000)
  expect(w.submitted).toEqual([])
  expect(w.toasts.filter(t => /5h usage at 93%/.test(t)).length).toBe(1)

  const pane = await $.ui.mount({ plugin: 'glancedeck', surface: 'terminal', ...PANE })
  expect(await pane.find({ text: /paused: 5h 93%/ })).toBeDefined()
  expect(await pane.find({ text: /resumes in 30m/ })).toBeDefined()
  await pane.unmount()

  // A second item while held: still no second toast.
  await q($, 'việc thứ hai')
  expect(w.toasts.filter(t => /5h usage at/.test(t)).length).toBe(1)

  // The window resets: the stale 93% no longer holds the queue.
  await w.clock.set(resetsAt + 2000)
  await w.clock.advance(5000)
  expect(w.submitted.map(s => s.text)).toEqual(['chạy test sau khi reset'])
})
