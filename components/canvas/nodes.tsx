import { useSelector } from "lib/state"
import { deepCompare } from "lib/utils"
import Node from "./node"

export default function HoveringNodes() {
  const nodeIds = useSelector((s) => s.data.nodeIds, deepCompare)

  return (
    <g>
      {nodeIds.map((id) => (
        <Node key={id} id={id} />
      ))}
    </g>
  )
}
