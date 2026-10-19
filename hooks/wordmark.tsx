// The wordmark: while anything works, the diamond breathes and a cyan ramp rolls through "deck".
import type { ClientModule } from 'claude-code'

type Props = { isBusy: boolean; text: string; ramp: string[] }
type State = { ticks: number }

const STEP_MS = 400
// All in Consolas: one cell each, nothing borrowed from a fallback font.
const BREATH = ['♦', '◊', '·', '◊']

const Wordmark: ClientModule<Props, State> = (props, surface) => {
  const { Text } = surface.elements
  const ref = surface.state ?? { ticks: 0 }
  if (surface.state === undefined) {
    surface.setState(ref)
    surface.every(STEP_MS, () => {
      ref.ticks += 1
      surface.setState(ref)
    })
  }
  const lead = props.ramp[0] ?? props.text
  const tick = props.isBusy ? ref.ticks : 0
  const n = Math.max(1, props.ramp.length)
  const hue = (i: number) => (props.isBusy ? (props.ramp[(((i - tick) % n) + n) % n] ?? lead) : lead)

  return (
    <Text wrap="truncate">
      <Text color={lead}>{`${props.isBusy ? BREATH[tick % BREATH.length] : '♦'} `}</Text>
      <Text bold color={props.text}>
        glance
      </Text>
      <Text bold color={hue(0)}>d</Text>
      <Text bold color={hue(1)}>e</Text>
      <Text bold color={hue(2)}>c</Text>
      <Text bold color={hue(3)}>k</Text>
    </Text>
  )
}

export default Wordmark
