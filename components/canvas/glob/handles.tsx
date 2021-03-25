import * as svg from "lib/svg"
import * as vec from "lib/vec"
import Handle from "./handle"

interface HandlesProps {
  start: number[]
  end: number[]
  position: number[]
  isDragging: boolean
  isSelected: boolean
  color: string
  onSelect: () => void
}

export default function Handles({
  onSelect,
  start,
  end,
  position,
  isDragging,
  isSelected,
  color,
}: HandlesProps) {
  return (
    <>
      {isDragging ? (
        <ExtendedLines start={start} end={end} position={position} />
      ) : (
        <path
          d={[
            svg.moveTo(start),
            svg.lineTo(position),
            svg.lineTo(end),
          ].toString()}
          fill="none"
          stroke={color}
          className="stroke-s dash-array-normal"
          pointerEvents="none"
          opacity={isSelected ? 1 : 0.5}
        />
      )}
      <Handle color={color} position={position} onSelect={onSelect} />
    </>
  )
}

interface ExtendedLinesProps {
  start: number[]
  end: number[]
  position: number[]
}

function ExtendedLines({ start, end, position }: ExtendedLinesProps) {
  const [n0, n1] = [
    vec.uni(vec.sub(position, start)),
    vec.uni(vec.sub(position, end)),
  ]
  return (
    <path
      d={[
        svg.moveTo(vec.add(position, vec.mul(n0, 10000))),
        svg.lineTo(vec.add(position, vec.mul(n0, -10000))),
        svg.moveTo(vec.add(position, vec.mul(n1, 10000))),
        svg.lineTo(vec.add(position, vec.mul(n1, -10000))),
      ].join(" ")}
      fill="none"
      stroke="red"
      opacity={0.5}
      pointerEvents="none"
      className="stroke-s"
    />
  )
}
