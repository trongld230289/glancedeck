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

const START = Date.UTC(2026, 9, 18, 3, 0, 0)
const norm = (p: string) => p.replace(/\\/g, '/')

test('other sessions show up across accounts; one waiting 3 minutes alerts once; an item moves to another session', async ($, on) => {
  const clock = mock.clock(on, { now: START })
  mock.env(on, { USERPROFILE: 'C:\\Users\\t', OS: 'Windows_NT', CLAUDE_CONFIG_DIR: 'C:\\Users\\t\\.claude' })
  const files = new Map<string, { text: string; at: number }>()
  const toasts: string[] = []
  const ran: string[][] = []
  const put = (path: string, value: object) => files.set(norm(path), { text: JSON.stringify(value), at: clock.now() })
  on('session.id', () => ({ value: 'self' }))
  on('session.cwd', () => ({ value: 'D:/Project/glanceline' }))
  on('session.start', () => ({ cwd: 'D:/Project/glanceline' }))
  on('command.register', () => ({ value: undefined }) as never)
  on('ui.open', () => ({ value: { isPlaced: true } }) as never)
  on('fs.read', (_, e) => {
    const f = files.get(norm(e.path))
    return f ? { value: f.text } : { deny: 'missing' }
  })
  on('fs.write', (_, e) => {
    files.set(norm(e.path), { text: e.text, at: clock.now() })
    return { value: undefined }
  })
  on('fs.exists', (_, e) => ({ value: files.has(norm(e.path)) }) as never)
  on('fs.list', (_, e) => {
    const dir = `${norm(e.path)}/`
    const names = [...files.entries()].filter(([p]) => p.startsWith(dir) && !p.slice(dir.length).includes('/'))
    return { value: names.map(([p, f]) => ({ name: p.slice(dir.length), kind: 'file', size: f.text.length, mtimeMs: f.at, isLink: false })) } as never
  })
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('process.run', (_, e) => {
    ran.push([...e.argv])
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })

  const SESSIONS = 'C:/Users/t/.glancedeck/sessions'
  const others = (now: number) => {
    put(`${SESSIONS}/ask.json`, {
      sessionId: 'ask',
      project: 'acme-api',
      cwd: 'D:/acme-api',
      queueKey: 'acme-api-abc',
      account: 'acc2',
      status: 'waiting',
      activity: 'xoá migration cũ?',
      since: START - 60_000,
      startedAt: START - 900_000,
      updatedAt: now,
      log: [{ at: START - 60_000, who: 'main', label: 'main', text: 'hỏi: xoá migration cũ?', isQuestion: true }],
    })
    put(`${SESSIONS}/busy.json`, {
      sessionId: 'busy',
      project: 'acme-web',
      cwd: 'D:/acme-web',
      queueKey: 'acme-web-def',
      account: null,
      status: 'working',
      activity: 'Bash → npm run build',
      since: START - 360_000,
      startedAt: START - 900_000,
      updatedAt: now,
      log: [],
    })
  }
  others(START)

  await $.session.start({ cwd: 'D:/Project/glanceline', surface: 'terminal', isInteractive: true } as never)
  await clock.advance(5000)

  let pane = await $.ui.mount({ plugin: 'glancedeck', surface: 'terminal', ...PANE })
  expect(await pane.find({ text: /! acme-api/ })).toBeDefined()
  expect(await pane.find({ text: '@acc2' })).toBeDefined()
  expect(await pane.find({ text: /Bash → npm run build/ })).toBeDefined()
  expect(await pane.find({ text: /1 waiting/ })).toBeDefined()
  await pane.press({ key: 'l-tab-all' })
  expect(await pane.find({ text: /acme-api asks/ })).toBeDefined()
  await pane.unmount()

  // This session's own heartbeat is in the shared folder for the others.
  expect(JSON.parse(files.get(`${SESSIONS}/self.json`)?.text ?? '{}')).toMatchObject({ sessionId: 'self', project: 'glanceline', account: null })

  // Waiting on you for 3 minutes: one toast and one sound, not one per heartbeat.
  others(START + 120_000)
  await clock.set(START + 120_000)
  await clock.advance(5000)
  others(clock.now())
  await clock.advance(5000)
  expect(toasts.filter(t => /waiting for you for 3 min/.test(t)).length).toBe(1)
  expect(ran.filter(a => a[0] === 'powershell').length).toBe(1)

  // m on a queue item, then pick the session: the item moves to that session's queue file.
  await $.command.run({ command: 'q', args: 'pause' } as never)
  await $.command.run({ command: 'q', args: 'viết migration mới' } as never)
  pane = await $.ui.mount({ plugin: 'glancedeck', surface: 'terminal', ...PANE })
  await pane.press({ key: 'q-k-move' })
  await pane.press({ key: 's-pick-0' })
  await pane.unmount()
  const target = JSON.parse(files.get('C:/Users/t/.glancedeck/queues/acme-api-abc.json')?.text ?? '{}')
  expect(target.items.map((i: { text: string }) => i.text)).toEqual(['viết migration mới'])
  const mine = [...files.entries()].find(([p]) => /queues\/glanceline-/.test(p))
  expect(JSON.parse(mine?.[1].text ?? '{}').items).toEqual([])
})
