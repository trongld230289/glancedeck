// A chip that beats between two backgrounds so a waiting session catches the eye, then settles so it never nags.
import type { ClientModule } from 'claude-code'

type Props = { text: string; fg: string; a: string; b: string; bold?: boolean; stopAfterMs: number }
type State = { ticks: number }

const STEP_MS = 600

const Pulse: ClientModule<Props, State> = (props, surface) => {
  const { Text } = surface.elements
  const ref = surface.state ?? { ticks: 0 }
  if (surface.state === undefined) {
    surface.setState(ref)
    const stop = surface.every(STEP_MS, () => {
      ref.ticks += 1
      if (ref.ticks * STEP_MS >= props.stopAfterMs) {
        ref.ticks = 0
        stop()
      }
      surface.setState(ref)
    })
  }

  return (
    <Text color={props.fg} backgroundColor={ref.ticks % 2 === 1 ? props.b : props.a} bold={props.bold}>
      {props.text}
    </Text>
  )
}

export default Pulse
