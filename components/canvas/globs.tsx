import { useSelector } from "lib/state"
import { deepCompareArrays } from "lib/utils"
import Glob from "./glob"

export default function HoveringNodes() {
  const globIds = useSelector((s) => s.data.globIds, deepCompareArrays)
  const fill = useSelector((s) => s.data.fill)

  return (
    <g fill={fill ? "#000" : "rgba(255, 255, 255, .72"}>
      {globIds.map((id) => (
        <Glob key={id} id={id} />
      ))}
    </g>
  )
}
