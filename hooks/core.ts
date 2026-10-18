// Pure helpers: no `$`, so the tests can call them directly.
import type { AgentCard, LogLine } from '../types'

export const LOG_MAX = 200
export const AGENTS_MAX = 24

const LOGGED_TOOLS = new Set(['Read', 'Edit', 'Write', 'NotebookEdit', 'Bash', 'PowerShell', 'Grep', 'Glob', 'WebFetch', 'WebSearch'])
export const EDIT_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit'])

export const isLogged = (tool: string) => LOGGED_TOOLS.has(tool)

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null

// Credentials never reach state: a token in a command or URL is masked before it is stored.
const SECRETS: [RegExp, string][] = [
  [/\b(sk-ant-[\w-]{6})[\w-]+/g, '$1•••'],
  [/\b(gh[pousr]_)[A-Za-z0-9]{8,}/g, '$1•••'],
  [/((?:api[_-]?key|token|password|secret)\s*[=:]\s*)\S+/gi, '$1•••'],
  [/(\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:)[^\s@]+@/gi, '$1•••@'],
]
export const redact = (s: string) => SECRETS.reduce((t, [re, to]) => t.replace(re, to), s)

export const shorten = (s: string, max: number) => {
  const one = s.replace(/\s+/g, ' ').trim()
  return one.length > max ? `${one.slice(0, max - 1)}…` : one
}

/** The file a call is about, as given (absolute or relative), or undefined. */
export const pathOf = (input: unknown): string | undefined => {
  const i = isObject(input) ? input : {}
  const p = i.file_path ?? i.notebook_path
  return typeof p === 'string' ? p : undefined
}

/** One line saying what a call was about: `Edit → glanceline/install.py`, `Bash → npm test`. */
export const describeCall = (tool: string, input: unknown) => {
  const i = isObject(input) ? input : {}
  const path = pathOf(input)?.split(/[\\/]/).slice(-2).join('/') ?? ''
  const what =
    typeof i.command === 'string'
      ? i.command
      : path || (typeof i.pattern === 'string' ? i.pattern : typeof i.url === 'string' ? i.url : typeof i.query === 'string' ? i.query : '')
  return redact(what ? `${tool} → ${shorten(what, 60)}` : tool)
}

/** Context is the latest request's whole input; output adds up over the agent's requests. */
export const applyStep = (
  c: AgentCard,
  u:
    | { input_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number; output_tokens?: number }
    | null
    | undefined,
): AgentCard => {
  const x = u ?? {}
  const ctx = (x.input_tokens ?? 0) + (x.cache_read_input_tokens ?? 0) + (x.cache_creation_input_tokens ?? 0)
  return { ...c, ctx: ctx > 0 ? ctx : c.ctx, out: c.out + (x.output_tokens ?? 0) }
}

export const noteTool = (c: AgentCard, text: string): AgentCard => ({ ...c, tools: [...c.tools, text].slice(-3) })

export const pushLog = (log: readonly LogLine[], line: LogLine): LogLine[] => [...log, line].slice(-LOG_MAX)

/** A prompt's first line for the log; a turn the engine opened with a tagged message is not the person's. */
export const promptText = (text: string): string | null => {
  if (/^\s*<[a-z][\w-]*/i.test(text)) return null
  return shorten(text, 80)
}

export const kTokens = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(n)

export const fmtElapsed = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  return m < 60 ? `${m}:${String(s % 60).padStart(2, '0')}` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`
}

/** Time left, coarse: `46m`, `2h05`. */
export const fmtUntil = (ms: number) => {
  const m = Math.max(1, Math.ceil(ms / 60_000))
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`
}

export const fmtClock = (at: number) => {
  const d = new Date(at)
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2, '0')).join(':')
}

export const basename = (path: string) =>
  path
    .replace(/[\\/]+$/, '')
    .split(/[\\/]/)
    .pop() || path

/** `claude-opus-5-5` → `Opus 5.5`; an id it does not know, shortened. */
export const prettyModel = (id: string) => {
  if (!id) return 'Claude'
  const m = /claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?(?![\d])/i.exec(id)
  if (m?.[1] && m[2]) return `${m[1].charAt(0).toUpperCase()}${m[1].slice(1).toLowerCase()} ${m[2]}${m[3] ? `.${m[3]}` : ''}`
  return shorten(id, 18)
}
