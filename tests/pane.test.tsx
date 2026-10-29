import { expect, mock, test } from 'claude-code/testing'

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

test('the pane draws the four blocks at 58 columns', async ($, on) => {
  mock.clock(on, { now: Date.UTC(2026, 9, 18, 10, 0, 0) })
  on('session.cwd', () => ({ value: 'D:/Project/glanceline' }))
  const ui = await $.ui.mount({ plugin: 'glancedeck', surface: 'terminal', ...PANE })

  expect(await ui.find({ text: /glanceline/ })).toBeUndefined()
  expect(await ui.find({ text: 'glance', in: 'wordmark' })).toBeDefined()
  for (const title of ['QUEUE', 'SESSIONS', 'AGENTS', 'SESSION LOG']) {
    expect(await ui.find({ text: title })).toBeDefined()
  }
  expect(await ui.find({ text: /\+ add/ })).toBeDefined()
  expect(await ui.find({ text: /ctrl\+x/ })).toBeUndefined()
  expect(await ui.find({ text: /AGENTS · none yet|none yet/ })).toBeDefined()
  await ui.unmount()
})

test('tool calls land in the log, an edit row opens its file, a failed call is marked', async ($, on) => {
  mock.clock(on, { now: Date.UTC(2026, 9, 18, 10, 0, 0) })
  mock.env(on, { OS: 'Windows_NT' })
  const ran: string[][] = []
  on('tool.call', (_, e) => (e.tool === 'Bash' ? { isError: true, result: 'exit 1', text: 'exit 1' } : { result: { ok: true } as never }))
  on('process.run', (_, e) => {
    ran.push([...e.argv])
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })

  await $.tool.call({
    tool: 'Edit',
    tool_use_id: 't1',
    file_path: 'D:/Project/glanceline/install.py',
    old_string: 'a',
    new_string: 'b',
  } as never)
  await $.tool.call({ tool: 'Bash', tool_use_id: 't2', command: 'python install.py --token=abc123' } as never)
  await $.tool.call({ tool: 'TodoWrite', tool_use_id: 't3', todos: [] } as never)

  const ui = await $.ui.mount({ plugin: 'glancedeck', surface: 'terminal', ...PANE })
  expect(await ui.find({ text: /Edit → glanceline\/install\.py/ })).toBeDefined()
  expect(await ui.find({ text: /Bash → python install\.py --token=•••  ×/ })).toBeDefined()
  expect(await ui.find({ text: /TodoWrite/ })).toBeUndefined()

  // Newest on top: the Bash line is first, the Edit line (with a path to open) second.
  expect(await ui.find({ key: 'l-1' })).toBeDefined()
  await ui.press({ key: 'l-1' })
  expect(ran.at(-1)?.slice(-2)).toEqual(['-g', 'D:/Project/glanceline/install.py'])
  await ui.unmount()
})

test('a subagent gets a card, its tools, and a done mark with its answer', async ($, on) => {
  const clock = mock.clock(on, { now: Date.UTC(2026, 9, 18, 10, 0, 0) })
  on('agent.spawn', () => ({ agentId: 'ag1', model: 'claude-haiku-5-5' }))
  on('tool.call', () => ({ result: { ok: true } as never }))
  on('turn.complete', () => ({ text: '' }))

  await $.agent.spawn({ prompt: 'review', description: 'Review flow', subagentType: 'general-purpose', background: false } as never)
  await $.tool.call({ tool: 'Read', tool_use_id: 't9', agentId: 'ag1', file_path: 'D:/x/src/flow.ts' } as never)

  let ui = await $.ui.mount({ plugin: 'glancedeck', surface: 'terminal', ...PANE })
  expect(await ui.find({ text: /Review flow/ })).toBeDefined()
  expect(await ui.find({ text: /1 running · 1 total/ })).toBeDefined()
  expect(await ui.find({ text: /agent 1/ })).toBeDefined()
  await ui.unmount()

  await clock.advance(158_000)
  await $.turn.complete({
    agentId: 'ag1',
    reason: 'answer',
    answer: 'Two retries are missing.',
    durationMs: 1000,
    isAborted: false,
    turnId: 'x',
  } as never)
  ui = await $.ui.mount({ plugin: 'glancedeck', surface: 'terminal', ...PANE })
  expect(await ui.find({ text: /0 running · 1 total/ })).toBeDefined()
  expect(await ui.find({ text: '• 2:38' })).toBeDefined()

  await ui.press({ key: 'a-0' })
  expect(await ui.find({ text: /Read → src\/flow\.ts/ })).toBeDefined()
  expect(await ui.find({ text: /Two retries are missing/ })).toBeDefined()
  await ui.unmount()
})

test('a click on a block title folds it; the all tab shows other sessions', async ($, on) => {
  mock.clock(on, { now: Date.UTC(2026, 9, 18, 10, 0, 0) })
  const ui = await $.ui.mount({ plugin: 'glancedeck', surface: 'terminal', ...PANE })

  expect(await ui.find({ text: /\+ add/ })).toBeDefined()
  await ui.press({ key: 'q-head' })
  expect(await ui.find({ text: /\+ add/ })).toBeUndefined()

  await ui.press({ key: 'l-tab-all' })
  expect(await ui.find({ text: '[all]' })).toBeDefined()
  await ui.unmount()
})

test('the TURN block runs while the main turn does, then becomes a receipt', async ($, on) => {
  const clock = mock.clock(on, { now: Date.UTC(2026, 9, 18, 10, 0, 0) })
  on('turn.start', () => ({ turnId: 't1' }))
  on('turn.complete', () => ({ text: '' }))
  on('tool.call', (_, e) => (e.tool === 'Bash' ? { isError: true, result: 'exit 1', text: 'exit 1' } : { result: { ok: true } as never }))

  let ui = await $.ui.mount({ plugin: 'glancedeck', surface: 'terminal', ...PANE })
  expect(await ui.find({ text: 'no turns yet' })).toBeDefined()
  await ui.unmount()

  await $.turn.start({ text: 'sửa lỗi', turnId: 't1' } as never)
  await $.tool.call({ tool: 'Edit', tool_use_id: 'e1', file_path: 'D:/x/a.ts', old_string: 'a', new_string: 'b' } as never)
  await $.tool.call({ tool: 'Bash', tool_use_id: 'b1', command: 'npm test' } as never)
  ui = await $.ui.mount({ plugin: 'glancedeck', surface: 'terminal', ...PANE })
  expect(await ui.find({ text: 'TURN' })).toBeDefined()
  expect(await ui.find({ text: '1 edit' })).toBeDefined()
  expect(await ui.find({ text: '1 error' })).toBeDefined()
  expect(await ui.find({ text: /last turn/ })).toBeUndefined()
  expect(await ui.find({ text: /npm test/ })).toBeDefined()
  // The strip: one cell per call, an edit then a failed run.
  expect(await ui.find({ text: '2 calls' })).toBeDefined()
  expect(await ui.find({ key: 't-strip' })).toBeDefined()
  await ui.unmount()

  await clock.advance(79_000)
  await $.turn.complete({ reason: 'answer', answer: '', durationMs: 1, isAborted: false, turnId: 't1' } as never)
  ui = await $.ui.mount({ plugin: 'glancedeck', surface: 'terminal', ...PANE })
  expect(await ui.find({ text: /× last turn · 1:19/ })).toBeDefined()
  await ui.unmount()
})

test('the pane colors follow the host theme off a dark terminal', async ($, on) => {
  mock.clock(on, { now: Date.UTC(2026, 9, 18, 10, 0, 0) })
  on('session.cwd', () => ({ value: 'D:/Project/glanceline' }))
  // The terminal runs the wordmark Client; the desktop (no Client shell) gets the plain Text in the theme's color.
  const terminal = await $.ui.mount({ plugin: 'glancedeck', surface: 'terminal', ...PANE })
  const mark = await terminal.find({ key: 'wordmark' })
  expect((mark?.props as { props?: { text?: string } })?.props?.text).toBe('#E6E8EE')
  await terminal.unmount()
  const desktop = await $.ui.mount({ plugin: 'glancedeck', surface: 'desktop', ...PANE })
  expect(await desktop.find({ key: 'wordmark' })).toBeUndefined()
  expect((await desktop.find({ type: 'Text', text: /^glance$/ }))?.props.color).toBe('text')
  await desktop.unmount()
})

test('an agent resumed under its id keeps one card, so the pane still draws (two Clients under one key refused it)', async ($, on) => {
  mock.clock(on, { now: Date.UTC(2026, 9, 18, 10, 0, 0) })
  on('session.cwd', () => ({ value: 'D:/Project/glanceline' }))
  on('turn.start', () => ({ turnId: 't1' }))
  on('agent.spawn', () => ({ agentId: 'ac8e', model: 'claude-haiku-5-5' }))
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  await $.agent.spawn({ prompt: 'p', description: 'Build core', subagentType: 'general-purpose' } as never)
  // SendMessage to the same agent: agent.spawn fires again with its id (2026-10-29: the second card drew a second
  // spin Client under the same key, the terminal refused the tree, and the pane went blank).
  await $.agent.spawn({ prompt: 'more', description: 'Build core', subagentType: 'general-purpose', resume: { agentId: 'ac8e' } } as never)

  const ui = await $.ui.mount({ plugin: 'glancedeck', surface: 'terminal', ...PANE })
  expect(await ui.find({ text: /1 running · 1 total/ })).toBeDefined()
  expect(await ui.find({ key: 'a-0' })).toBeDefined()
  expect(await ui.find({ key: 'a-1' })).toBeUndefined()
  await ui.unmount()
})
