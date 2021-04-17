import { useSelector } from "lib/state"
import { deepCompareArrays } from "lib/utils"
import HoverGlob from "./hover-glob"

export default function HoveringNodes() {
  const highlitGlobs = useSelector(
    ({ data: { highlightGlobs, hoveredGlobs } }) =>
      Array.from(new Set([...highlightGlobs, ...hoveredGlobs]).values()),
    deepCompareArrays
  )

  const selectedGlobIds = useSelector((s) => s.data.selectedGlobs)

  const isBrushing = useSelector((state) => state.isIn("brushSelecting"))

  if (isBrushing) return null

  return (
    <>
      {highlitGlobs.map((id) => (
        <HoverGlob key={id} id={id} isSelected={selectedGlobIds.includes(id)} />
      ))}
    </>
  )
}
