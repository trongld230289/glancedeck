import { expect, test } from 'claude-code/testing'

import { applyStep, describeCall, fmtElapsed, kTokens, promptText, pushLog, LOG_MAX } from '../hooks/core'
import type { AgentCard } from '../types'

const card: AgentCard = { id: 'a', name: 'x', ctx: 0, out: 0, spawnedAt: 0, endedAt: null, status: 'running', tools: [], answer: '' }

test('describeCall names the file, command or pattern, with secrets masked', () => {
  expect(describeCall('Edit', { file_path: 'D:\\Project\\glanceline\\install.py' })).toBe('Edit → glanceline/install.py')
  expect(describeCall('Bash', { command: 'curl -H "token: ghp_abcdefghijk1234"' })).toContain('•••')
  expect(describeCall('Grep', { pattern: 'retry' })).toBe('Grep → retry')
})

test('applyStep keeps the latest context and adds up output', () => {
  const one = applyStep(card, { input_tokens: 100, cache_read_input_tokens: 900, output_tokens: 50 })
  const two = applyStep(one, { input_tokens: 10, cache_read_input_tokens: 1990, output_tokens: 25 })
  expect(two.ctx).toBe(2000)
  expect(two.out).toBe(75)
  expect(applyStep(two, null).ctx).toBe(2000)
})

test('a tagged engine message is not logged as the person', () => {
  expect(promptText('<task-notification>done</task-notification>')).toBeNull()
  expect(promptText('  viết test\n cho install.py ')).toBe('viết test cho install.py')
})

test('the log keeps its newest rows', () => {
  let log = pushLog([], { at: 0, who: 'main', label: 'main', text: '0' })
  for (let i = 1; i <= LOG_MAX + 5; i += 1) log = pushLog(log, { at: i, who: 'main', label: 'main', text: String(i) })
  expect(log.length).toBe(LOG_MAX)
  expect(log.at(-1)?.text).toBe(String(LOG_MAX + 5))
})

test('numbers read short', () => {
  expect(kTokens(123_456)).toBe('123k')
  expect(kTokens(1_500_000)).toBe('1.5M')
  expect(fmtElapsed(158_000)).toBe('2:38')
  expect(fmtElapsed(3_900_000)).toBe('1h05')
})
