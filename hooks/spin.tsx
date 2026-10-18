// A spinner, and optionally a clock since `since`, ticking on the surface's own frame clock.
import type { ClientModule } from 'claude-code'

import { fmtElapsed } from './core'

type Props = { color: string; label?: string; since?: number; now: number; bold?: boolean }
type State = { lastNow: number; ticks: number }

const STEP_MS = 100
const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

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
  const frame = FRAMES[ref.ticks % FRAMES.length]
  const clock = props.since !== undefined ? ` ${fmtElapsed(props.now + ref.ticks * STEP_MS - props.since)}` : ''

  return <Text color={props.color} bold={props.bold}>{`${frame}${props.label ? ` ${props.label}` : ''}${clock}`}</Text>
}

export default Spin
