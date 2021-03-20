import { useSelector } from "lib/state"
import { deepCompare } from "lib/utils"
import Glob from "./glob"

export default function HoveringNodes() {
  const globIds = useSelector((s) => s.data.globIds, deepCompare)

  return (
    <g>
      {globIds.map((id) => (
        <Glob key={id} id={id} />
      ))}
    </g>
  )
}
