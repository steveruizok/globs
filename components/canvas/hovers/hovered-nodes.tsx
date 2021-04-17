import { useSelector } from "lib/state"
import { deepCompareArrays } from "lib/utils"
import HoverNode from "./hover-node"

export default function HoveringNodes() {
  const highlitNodes = useSelector(
    ({ data: { highlightNodes, hoveredNodes } }) =>
      Array.from(new Set([...highlightNodes, ...hoveredNodes]).values()),
    deepCompareArrays
  )

  const isBrushing = useSelector((state) => state.isIn("selecting"))

  if (isBrushing) return null

  return (
    <>
      {highlitNodes.map((id) => (
        <HoverNode key={id} id={id} />
      ))}
    </>
  )
}
