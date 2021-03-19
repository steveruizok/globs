import { useSelector } from "lib/state"
import Dot from "./dot"

const R = 8

interface Props {
  position?: number[]
  color?: string
  onSelect?: () => void
}

export default function Handle({
  position = [0, 0],
  color = "#000",
  onSelect,
}: Props) {
  const zoom = useSelector((s) => s.data.camera.zoom)
  return (
    <g
      transform={`translate(${position[0] - R} ${position[1] - R})`}
      onPointerDown={onSelect}
    >
      <circle cx={R} cy={R} r={R / zoom} fill={color} opacity={0.2} />
      <Dot position={[R, R]} radius={(R * 0.38) / zoom} color={color} />
    </g>
  )
}
