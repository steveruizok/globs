import { useSelector } from "lib/state"
import Node from "./node"

export default function HoveringNodes() {
  const nodeIds = useSelector((s) => s.data.nodeIds)
  const fill = useSelector((s) => s.data.fill)

  return (
    <>
      {nodeIds.map((id) => (
        <Node key={id} id={id} fill={fill} />
      ))}
    </>
  )
}
