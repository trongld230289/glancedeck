// A spinner, or with `clockOnly` just the clock, optionally ticking since `since` on the surface's own frame clock.
// With `lit`, a brighter window sweeps across the label; with `noFrame`, the label is drawn without the spinner.
import type { ClientModule } from 'claude-code'

import { fmtElapsed } from './core'
import { glowParts } from './glow'

type Props = {
  color: string
  label?: string
  lit?: string
  since?: number
  now: number
  bold?: boolean
  clockOnly?: boolean
  noFrame?: boolean
}
type State = { lastNow: number; ticks: number }

const STEP_MS = 120
// A block walking round a cell; every glyph is in Consolas, so the terminal never borrows a wider fallback.
const FRAMES = ['▀', '▐', '▄', '▌']

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
  const clock = props.since !== undefined ? fmtElapsed(props.now + ref.ticks * STEP_MS - props.since) : ''
  if (props.clockOnly) {
    return (
      <Text color={props.color} bold={props.bold}>
        {clock}
      </Text>
    )
  }
  const frame = props.noFrame ? '' : `${FRAMES[ref.ticks % FRAMES.length]}`
  const label = props.label ?? ''
  const [before, lit, after] = props.lit && label ? glowParts(label, ref.ticks) : [label, '', '']
  const gap = frame && label ? ' ' : ''

  return (
    <Text color={props.color} bold={props.bold} wrap="truncate">
      {`${frame}${gap}${before}`}
      {lit ? <Text color={props.lit}>{lit}</Text> : null}
      {`${after}${clock ? ` ${clock}` : ''}`}
    </Text>
  )
}

export default Spin
