import useBoundingBox from "hooks/useBoundingBox"
import state, { useSelector } from "lib/state"

export default function BoundsBg() {
  const bounds = useBoundingBox()
  // const showBounds = useSelector((state) =>
  //   state.isInAny("brushSelecting", "notPointing")
  // )

  if (!bounds) {
    return null
  }

  const { x, maxX, y, maxY } = bounds,
    width = Math.abs(maxX - x),
    height = Math.abs(maxY - y)

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      onPointerDown={() => state.send("POINTED_BOUNDS")}
      fill="transparent"
      stroke="blue"
      className="stroke-s"
    />
  )
}
