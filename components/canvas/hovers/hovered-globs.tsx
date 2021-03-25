import { useSelector } from "lib/state"
import { deepCompareArrays } from "lib/utils"
import HoverGlob from "./hover-glob"

export default function HoveringNodes() {
  const highlitGlobs = useSelector(
    ({ data: { highlightGlobs, hoveredGlobs } }) =>
      Array.from(new Set([...highlightGlobs, ...hoveredGlobs]).values()),
    deepCompareArrays
  )

  return (
    <>
      {highlitGlobs.map((id) => (
        <HoverGlob key={id} id={id} />
      ))}
    </>
  )
}
