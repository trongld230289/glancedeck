// The queue's head while it counts down: the row itself is the progress bar. Its lit part shrinks
// each second on the surface's own clock, so the pane need not redraw.
import type { ClientModule } from 'claude-code'

type Props = { left: string; endsAt: number; now: number; total: number; width: number; fg: string; lit: string; dark: string }
type State = { lastNow: number; ticks: number }

const Ticket: ClientModule<Props, State> = (props, surface) => {
  const { Box, Text } = surface.elements
  const ref = surface.state ?? { lastNow: -1, ticks: 0 }
  if (props.now !== ref.lastNow) {
    ref.lastNow = props.now
    ref.ticks = 0
  }
  if (surface.state === undefined) {
    surface.setState(ref)
    surface.every(1000, () => {
      ref.ticks += 1
      surface.setState(ref)
    })
  }
  const leftMs = Math.max(0, props.endsAt - (props.now + ref.ticks * 1000))
  const seconds = Math.ceil(leftMs / 1000)
  const right = ` gửi sau ${seconds}s `
  const room = Math.max(4, props.width - right.length)
  const label = props.left.length > room ? `${props.left.slice(0, room - 1)}…` : props.left.padEnd(room)
  const line = label + right
  const litCells = Math.round((leftMs / props.total) * line.length)

  return (
    <Box>
      <Text color={props.fg} backgroundColor={props.lit} bold>
        {line.slice(0, litCells)}
      </Text>
      <Text color={props.fg} backgroundColor={props.dark} bold>
        {line.slice(litCells)}
      </Text>
    </Box>
  )
}

export default Ticket
