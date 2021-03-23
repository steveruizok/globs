import { getTouchDisplay } from "lib/utils"
import Dot from "./dot"

interface Props {
  position?: number[]
  color?: string
  radius?: number
  onSelect?: () => void
}

export default function Anchor({
  position = [0, 0],
  color = "#000",
  radius: R = 8,
  onSelect,
}: Props) {
  if (getTouchDisplay()) R *= 1.5
  return (
    <g
      transform={`translate(${position[0] - R} ${position[1] - R})`}
      onPointerDown={onSelect}
    >
      <circle cx={R} cy={R} r={R} fill={color} opacity={0} />
      <Dot position={[R, R]} radius={R * 0.38} color={color} />
    </g>
  )
}
