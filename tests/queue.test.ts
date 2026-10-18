import { expect, test } from 'claude-code/testing'

import {
  EMPTY_QUEUE,
  IDLE,
  fire,
  fiveHourOf,
  isSender,
  isUsageBlocked,
  keepToday,
  move,
  normalizeQueue,
  parseQ,
  projectKey,
  shouldStart,
} from '../hooks/queue'
import type { QueueFile, QueueItem } from '../types'

const item = (id: string, extra: Partial<QueueItem> = {}): QueueItem => ({ id, text: `task ${id}`, ifOk: false, addedAt: 0, ...extra })
const withItems = (...items: QueueItem[]): QueueFile => ({ ...EMPTY_QUEUE, items })

test('/q parses add, --if-ok and the verbs', () => {
  expect(parseQ('viết test cho install.py')).toEqual({ kind: 'add', text: 'viết test cho install.py', ifOk: false })
  expect(parseQ('--if-ok  chạy installer')).toEqual({ kind: 'add', text: 'chạy installer', ifOk: true })
  expect(parseQ('list')).toEqual({ kind: 'list' })
  expect(parseQ('resume')).toEqual({ kind: 'resume' })
  expect(parseQ('')).toEqual({ kind: 'help' })
  expect(parseQ('--if-ok')).toEqual({ kind: 'help' })
})

test('the next item starts only when the main turn, background agents and questions are all done', () => {
  const q = withItems(item('a'))
  expect(shouldStart(q, IDLE, 0)).toBe(true)
  expect(shouldStart(q, { ...IDLE, isTurnRunning: true }, 0)).toBe(false)
  expect(shouldStart(q, { ...IDLE, background: ['ag1'] }, 0)).toBe(false)
  expect(shouldStart(q, { ...IDLE, isAsking: true }, 0)).toBe(false)
  expect(shouldStart(q, { ...IDLE, countdown: { id: 'a', endsAt: 1 } }, 0)).toBe(false)
  expect(shouldStart({ ...q, paused: true }, IDLE, 0)).toBe(false)
  expect(shouldStart(withItems(item('a', { isBlocked: true })), IDLE, 0)).toBe(false)
  expect(shouldStart(EMPTY_QUEUE, IDLE, 0)).toBe(false)
})

test('over 90% of the 5h window holds the queue until the window resets', () => {
  const q = withItems(item('a'))
  const resetsAt = Date.UTC(2026, 9, 18, 12)
  const hot = { ...IDLE, fiveHour: { percent: 93, resetsAt } }
  expect(isUsageBlocked(hot, resetsAt - 1)).toBe(true)
  expect(shouldStart(q, hot, resetsAt - 1)).toBe(false)
  expect(fire(q, hot, 'a', resetsAt - 1).kind).toBe('none')
  expect(fire(q, hot, 'a', resetsAt - 1, true).kind).toBe('send')
  // Past the reset the stale reading no longer holds it.
  expect(shouldStart(q, hot, resetsAt)).toBe(true)
  expect(shouldStart(q, { ...IDLE, fiveHour: { percent: 90, resetsAt } }, 0)).toBe(true)
  expect(
    fiveHourOf([
      { kind: 'seven_day', percentUsed: 99 },
      { kind: 'five_hour', percentUsed: 93, resetsAt: new Date(resetsAt).toISOString() },
    ]),
  ).toEqual({
    percent: 93,
    resetsAt,
  })
  expect(fiveHourOf([])).toBeNull()
})

test('a fire sends the head and records it as sent today', () => {
  const r = fire(withItems(item('a'), item('b')), IDLE, 'a', 1000)
  expect(r.kind).toBe('send')
  if (r.kind !== 'send') return
  expect(r.item.id).toBe('a')
  expect(r.queue.items.map(i => i.id)).toEqual(['b'])
  expect(r.queue.sent).toEqual([{ text: 'task a', at: 1000 }])
})

test('--if-ok after a failed turn holds the item and pauses the queue; send-now overrides', () => {
  const q = withItems(item('a', { ifOk: true }), item('b'))
  const bad = { ...IDLE, lastTurnOk: false }
  const r = fire(q, bad, 'a', 0)
  expect(r.kind).toBe('block')
  if (r.kind !== 'block') return
  expect(r.queue.paused).toBe(true)
  expect(r.queue.pauseReason).toBe('if-ok')
  expect(r.queue.items[0]?.isBlocked).toBe(true)
  expect(fire(q, bad, 'a', 0, true).kind).toBe('send')
})

test('a fire that finds things changed sends nothing', () => {
  const q = withItems(item('a'), item('b'))
  expect(fire(q, IDLE, 'b', 0).kind).toBe('none')
  expect(fire(q, { ...IDLE, isTurnRunning: true }, 'a', 0).kind).toBe('none')
  expect(fire({ ...q, paused: true }, IDLE, 'a', 0).kind).toBe('none')
})

test('move reorders within bounds', () => {
  const q = withItems(item('a'), item('b'), item('c'))
  expect(move(q, 'b', -1).items.map(i => i.id)).toEqual(['b', 'a', 'c'])
  expect(move(q, 'c', 1)).toBe(q)
  expect(move(q, 'zz', 1)).toBe(q)
})

test('a stored file is read leniently and sent history keeps today only', () => {
  const q = normalizeQueue({ items: [{ id: 'a', text: 'x' }, { nope: 1 }], paused: 'yes', pauseReason: 'weird' })
  expect(q.items).toEqual([{ id: 'a', text: 'x', ifOk: false }])
  expect(q.paused).toBe(false)
  expect(q.pauseReason).toBeNull()
  const day = Date.UTC(2026, 9, 18, 5)
  expect(
    keepToday(
      [
        { text: 'old', at: day - 2 * 86_400_000 },
        { text: 'new', at: day },
      ],
      day,
    ),
  ).toEqual([{ text: 'new', at: day }])
})

test('two folders with the same name get different queue files', () => {
  expect(projectKey('D:\\Project\\app')).not.toBe(projectKey('C:/work/app'))
  expect(projectKey('D:\\Project\\App\\')).toBe(projectKey('d:/project/app'))
  expect(projectKey('D:/Project/acme-web')).toMatch(/^acme-web-[a-z0-9]+$/)
})

test('an item goes out from the session it was queued in; the owner sends it once that session is gone', () => {
  const here = { ...IDLE, selfId: 'a', queuePeers: ['a', 'b'], isQueueOwner: false }
  const owner = { ...IDLE, selfId: 'b', queuePeers: ['a', 'b'], isQueueOwner: true }
  const mine = withItems(item('1', { sender: 'a' }))
  expect(isSender(mine.items[0]!, here)).toBe(true)
  expect(shouldStart(mine, here, 0)).toBe(true)
  expect(shouldStart(mine, owner, 0)).toBe(false)
  // a is gone: the owner takes it
  expect(shouldStart(mine, { ...owner, queuePeers: ['b'] }, 0)).toBe(true)
  // an item with no sender is the owner's, as before
  expect(shouldStart(withItems(item('2')), owner, 0)).toBe(true)
  expect(shouldStart(withItems(item('2')), here, 0)).toBe(false)
})
