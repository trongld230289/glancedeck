// A lit window that sweeps across a label, then rests a beat off the end before it comes round again.

export const GLOW_WIDTH = 3
const REST = 10

/** The label in three parts, the middle one lit, for sweep step `tick`. */
export function glowParts(text: string, tick: number): [string, string, string] {
  const at = (tick % (text.length + REST)) - GLOW_WIDTH + 1
  const from = Math.max(0, at)
  const to = Math.max(0, Math.min(text.length, at + GLOW_WIDTH))
  return [text.slice(0, from), text.slice(from, to), text.slice(to)]
}
