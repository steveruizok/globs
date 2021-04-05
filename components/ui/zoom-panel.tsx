import styled from "styled-components"
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

const Container = styled.div`
  position: absolute;
  bottom: 0px;
  left: 0px;
  border-radius: 4px;
  pointer-events: all;
  user-select: none;
  padding: 4px 8px;
  font: var(--fonts-mono);
  color: var(--colors-muted);
  background-color: var(--colors-panel);
  border: 1px solid var(--border);

  &:hover {
    color: var(--colors-text);
  }
`
