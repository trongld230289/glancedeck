// A running agent's clock, ticking on the surface's own frame clock so the pane need not redraw.
import type { ClientModule } from 'claude-code'

import { fmtElapsed } from './core'

type Props = { since: number; now: number; color: string }
type State = { base: number; ticks: number; lastNow: number }

const Elapsed: ClientModule<Props, State> = (props, surface) => {
  const { Text } = surface.elements
  const ref = surface.state ?? { base: 0, ticks: 0, lastNow: -1 }
  if (props.now !== ref.lastNow) {
    // A fresh reading from the hooks module: restart the local count from it.
    ref.lastNow = props.now
    ref.base = props.now - props.since
    ref.ticks = 0
  }
  if (surface.state === undefined) {
    surface.setState(ref)
    surface.every(1000, () => {
      ref.ticks += 1
      surface.setState(ref)
    })
  }

  return <Text color={props.color}>{`● ${fmtElapsed(ref.base + ref.ticks * 1000)}`}</Text>
}

export default Elapsed
