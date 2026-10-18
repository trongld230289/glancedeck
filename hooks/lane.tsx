// One agent's swimlane on the shared time axis. While the axis is live (t1 null) it grows on the
// surface's own clock, and a running agent's bar grows with it, its head pulsing.
import type { ClientModule } from 'claude-code'

import { laneText } from './core'

type Props = { t0: number; t1: number | null; start: number; end: number | null; now: number; width: number; color: string; dim: string }
type State = { lastNow: number; ticks: number; isLive: boolean }

const STEP_MS = 250
const HEADS = ['▶', '▷']

const Lane: ClientModule<Props, State> = (props, surface) => {
  const { Box, Text } = surface.elements
  const ref = surface.state ?? { lastNow: -1, ticks: 0, isLive: true }
  ref.isLive = props.t1 === null
  if (props.now !== ref.lastNow) {
    ref.lastNow = props.now
    ref.ticks = 0
  }
  if (surface.state === undefined) {
    surface.setState(ref)
    surface.every(STEP_MS, () => {
      if (ref.isLive) {
        ref.ticks += 1
        surface.setState(ref)
      }
    })
  }
  const now = props.now + ref.ticks * STEP_MS
  const t1 = props.t1 ?? now
  const isRunning = props.end === null
  const { before, bar, after } = laneText(props.t0, t1, props.start, props.end ?? now, props.width)

  return (
    <Box>
      <Text color={props.dim}>{before}</Text>
      <Text color={props.color}>{isRunning ? bar.slice(1) : bar}</Text>
      {isRunning ? <Text color={props.color} bold>{HEADS[Math.floor(ref.ticks / 2) % HEADS.length]}</Text> : null}
      <Text color={props.dim}>{after}</Text>
    </Box>
  )
}

export default Lane
