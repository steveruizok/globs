import { useSelector } from "lib/state"
import Node from "./node/node"
import GhostNode from "./node/ghost-node"

export default function HoveringNodes() {
  const nodeIds = useSelector((s) => s.data.nodeIds)
  const fill = useSelector((s) => s.data.fill)
  const isCreating = useSelector((s) => s.isIn("creatingNodes"))

  return (
    <>
      {nodeIds.map((id) => (
        <Node key={id} id={id} fill={fill} />
      ))}
      {isCreating && <GhostNode />}
    </>
  )
}
