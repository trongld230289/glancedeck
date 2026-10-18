// A line packets travel along while the turn runs; only this row redraws, the pane does not.
import type { ClientModule } from 'claude-code'

type Props = { width: number; color: string; dim: string }
type State = { phase: number }

const STEP_MS = 90
const GAP = 18

const Rail: ClientModule<Props, State> = (props, surface) => {
  const { Box, Text } = surface.elements
  const ref = surface.state ?? { phase: 0 }
  if (surface.state === undefined) {
    surface.setState(ref)
    surface.every(STEP_MS, () => {
      ref.phase += 1
      surface.setState(ref)
    })
  }
  const width = Math.max(1, props.width)
  // A bright head with a fading tail, every GAP cells, moving left to right.
  const glyph = (i: number) => {
    const d = (((ref.phase - i) % GAP) + GAP) % GAP
    return d === 0 ? '●' : d === 1 ? '•' : d === 2 ? '·' : null
  }
  const runs: { text: string; isLit: boolean }[] = []
  for (let i = 0; i < width; i++) {
    const g = glyph(i)
    const isLit = g !== null
    const last = runs[runs.length - 1]
    if (last && last.isLit === isLit) last.text += g ?? '─'
    else runs.push({ text: g ?? '─', isLit })
  }

  return (
    <Box>
      {runs.map(r => (
        <Text color={r.isLit ? props.color : props.dim} bold={r.isLit}>
          {r.text}
        </Text>
      ))}
    </Box>
  )
}

export default Rail
