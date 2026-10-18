import { expect, test } from 'claude-code/testing'

import {
  ALERT_MS,
  STALE_MS,
  accountOf,
  dueAlerts,
  isQueueOwner,
  mergeLogs,
  parseHeartbeat,
  peerAgents,
  questionOf,
  rowsOf,
  sharedAgents,
} from '../hooks/sessions'
import type { AgentCard, Heartbeat } from '../types'

const NOW = 1_000_000_000
const beat = (sessionId: string, extra: Partial<Heartbeat> = {}): Heartbeat => ({
  sessionId,
  project: `p-${sessionId}`,
  cwd: `D:/p-${sessionId}`,
  queueKey: `p-${sessionId}-x`,
  account: null,
  status: 'idle',
  activity: '',
  since: NOW - 60_000,
  startedAt: NOW - 600_000,
  updatedAt: NOW - 1000,
  log: [],
  agents: [],
  ...extra,
})

test('the account tag comes from CLAUDE_CONFIG_DIR', () => {
  expect(accountOf(undefined)).toBeNull()
  expect(accountOf('C:\\Users\\me\\.claude')).toBeNull()
  expect(accountOf('C:\\Users\\me\\.claude-acc2')).toBe('acc2')
  expect(accountOf('/home/me/.claude-work/')).toBe('work')
})

test('rows: others only, live only, whoever waits on you first', () => {
  const beats = [
    beat('self'),
    beat('idle'),
    beat('busy', { status: 'working', activity: 'Bash → npm run build' }),
    beat('ask', { status: 'waiting', activity: 'xoá migration cũ?', account: 'acc2' }),
    beat('gone', { updatedAt: NOW - STALE_MS - 1 }),
  ]
  const rows = rowsOf(beats, 'self', NOW)
  expect(rows.map(r => r.sessionId)).toEqual(['ask', 'busy', 'idle'])
  expect(rows[0]).toMatchObject({ status: 'waiting', account: 'acc2', activity: 'xoá migration cũ?' })
  expect(rows[2]?.activity).toBe('rảnh')
})

test('two live sessions on one repo: the one that started first sends the queue', () => {
  const first = beat('a', { queueKey: 'repo-1', startedAt: NOW - 900_000 })
  const second = beat('b', { queueKey: 'repo-1', startedAt: NOW - 100_000 })
  expect(isQueueOwner([first, second], first, NOW)).toBe(true)
  expect(isQueueOwner([first, second], second, NOW)).toBe(false)
  // Once the first is gone, the second takes over.
  expect(isQueueOwner([{ ...first, updatedAt: NOW - STALE_MS - 1 }, second], second, NOW)).toBe(true)
})

test('an alert is due once a session has waited on you for 3 minutes', () => {
  const fresh = beat('w1', { status: 'waiting', since: NOW - ALERT_MS + 1000 })
  const long = beat('w2', { status: 'waiting', since: NOW - ALERT_MS })
  expect(dueAlerts([fresh, long], 'self', NOW).map(d => d.key)).toEqual([`w2-${NOW - ALERT_MS}`])
})

test('the all tab merges the other sessions’ prompts, questions, errors and edits, tagged', () => {
  const other = beat('o', {
    account: 'acc2',
    project: 'acme-api',
    log: [
      { at: NOW - 5000, who: 'main', label: 'main', text: 'Read → a.ts' },
      { at: NOW - 3000, who: 'main', label: 'main', text: 'hỏi: xoá migration cũ?', isQuestion: true },
    ],
  })
  const merged = mergeLogs([{ at: NOW - 4000, who: 'you', label: 'you', text: 'hi' }], [other], 'self', NOW)
  expect(merged.map(l => l.text)).toEqual(['hi', 'acme-api hỏi: hỏi: xoá migration cũ?'])
  expect(merged[1]).toMatchObject({ who: 'peer', label: '@acc2' })
})

test('other sessions’ subagents are shared: running ones, and finished ones for 10 minutes', () => {
  const card = (name: string, status: 'running' | 'done', endedAt: number | null): AgentCard => ({
    id: name,
    name,
    ctx: 1000,
    out: 10,
    spawnedAt: NOW - 120_000,
    endedAt,
    status,
    tools: [],
    answer: '',
  })
  const shared = sharedAgents(
    [card('Build core', 'running', null), card('Old', 'done', NOW - 11 * 60_000), card('Review', 'done', NOW - 60_000)],
    NOW,
  )
  expect(shared.map(a => a.name)).toEqual(['Build core', 'Review'])
  const peers = peerAgents(
    [
      beat('self', { agents: shared }),
      beat('o', { project: 'acme-api', account: 'acc2', agents: shared }),
      beat('gone', { updatedAt: 0, agents: shared }),
    ],
    'self',
    NOW,
  )
  expect(peers.map(a => `${a.name}@${a.project}/${a.account}`)).toEqual(['Build core@acme-api/acc2', 'Review@acme-api/acc2'])
})

test('heartbeats and questions are read leniently', () => {
  expect(parseHeartbeat('not json')).toBeNull()
  expect(parseHeartbeat(JSON.stringify({ sessionId: 'x' }))).toBeNull()
  expect(parseHeartbeat(JSON.stringify({ sessionId: 'x', project: 'p', updatedAt: 5, status: 'weird' }))?.status).toBe('idle')
  expect(questionOf({ questions: [{ question: 'Public or private?' }] })).toBe('Public or private?')
  expect(questionOf({})).toBe('đang hỏi bạn')
})
