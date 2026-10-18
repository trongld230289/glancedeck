// A spinner, or with `bar` a lit segment bouncing along a track, and optionally a clock since `since`,
// ticking on the surface's own frame clock.
import type { ClientModule } from 'claude-code'

import { fmtElapsed } from './core'

type Props = { color: string; label?: string; since?: number; now: number; bold?: boolean; bar?: number; track?: string }
type State = { lastNow: number; ticks: number }

const STEP_MS = 100
const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const LIT = 3

/** The track split around the lit segment, which runs to one end and back. */
function barParts(width: number, tick: number): [string, string, string] {
  const span = Math.max(1, width - LIT)
  const at = tick % (span * 2)
  const pos = at < span ? at : span * 2 - at
  return ['─'.repeat(pos), '━'.repeat(LIT), '─'.repeat(Math.max(0, width - LIT - pos))]
}

const Spin: ClientModule<Props, State> = (props, surface) => {
  const { Text } = surface.elements
  const ref = surface.state ?? { lastNow: -1, ticks: 0 }
  if (props.now !== ref.lastNow) {
    ref.lastNow = props.now
    ref.ticks = 0
  }
  if (surface.state === undefined) {
    surface.setState(ref)
    surface.every(STEP_MS, () => {
      ref.ticks += 1
      surface.setState(ref)
    })
  }
  const clock = props.since !== undefined ? ` ${fmtElapsed(props.now + ref.ticks * STEP_MS - props.since)}` : ''
  if (props.bar) {
    // Continue from the wall clock so a redraw from the host does not send the segment back to the start.
    const [before, lit, after] = barParts(props.bar, Math.floor(props.now / STEP_MS) + ref.ticks)
    return (
      <Text>
        <Text color={props.track ?? props.color}>{before}</Text>
        <Text color={props.color} bold>
          {lit}
        </Text>
        <Text color={props.track ?? props.color}>{after}</Text>
        <Text color={props.color} bold={props.bold}>
          {clock}
        </Text>
      </Text>
    )
  }
  const frame = FRAMES[ref.ticks % FRAMES.length]

  return <Text color={props.color} bold={props.bold}>{`${frame}${props.label ? ` ${props.label}` : ''}${clock}`}</Text>
}

export default Spin
