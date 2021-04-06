import { styled } from "stitches.config"
import state, { useSelector } from "lib/state"
import * as vec from "lib/vec"

export default function ZoomPanel() {
  const camera = useSelector((s) => s.data.camera)
  const viewport = useSelector((s) => s.data.viewport)

  const [x, y] = vec.add(camera.point, vec.div(viewport.size, 2))

  return (
    <Container onDoubleClick={() => state.send("ZOOMED_TO_FIT")}>
      x{((x < 0 ? "-" : "") + Math.abs(x).toFixed(0)).padStart(4, "0")} y
      {((y < 0 ? "-" : "") + Math.abs(y).toFixed(0)).padStart(4, "0")}{" "}
      {Math.round(camera.zoom * 100)}%
    </Container>
  )
}

const Container = styled('div', {
  position: 'absolute',
  bottom: '0px',
  left: '0px',
  borderRadius: '4px',
  pointerEvents: 'all',
  userSelect: 'none',
  padding: '4px 8px',
  font: '$mono',
  color: '$muted',
  backgroundColor: '$panel',
  border: '1px solid $border',

  '&:hover': {
    color: '$text',
  }
})
