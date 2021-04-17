import { useSelector } from "lib/state"
import Glob from "./glob/glob"
import Node from "./node/node"
import GhostGlob from "./glob/ghost-glob"
import GhostNode from "./node/ghost-node"

export default function HoveringNodes() {
  const globIds = useSelector((s) =>
    s.data.globIds.filter((id) => !s.data.selectedGlobs.includes(id))
  )

  const looseNodeIds = useSelector((s) => {
    const globs = Object.values(s.data.globs)
    return s.data.nodeIds
      .filter((id) => !globs.find((g) => g.nodes.includes(id)))
      .filter((id) => !s.data.selectedNodes.includes(id))
  })

  const fill = useSelector((s) => s.data.fill)
  const selectedNodeIds = useSelector((s) => s.data.selectedNodes)
  const selectedGlobIds = useSelector((s) => s.data.selectedGlobs)
  const isGlobbing = useSelector((s) => s.isIn("globbingNodes"))
  const isCreating = useSelector((s) => s.isIn("creatingNodes"))

  return (
    <>
      {globIds.map((id) => (
        <Glob key={id} id={id} fill={fill} isSelected={false} />
      ))}
      {looseNodeIds.map((id) => (
        <Node key={id} id={id} fill={fill} isSelected={false} />
      ))}
      {selectedGlobIds.map((id) => (
        <Glob key={id} id={id} fill={fill} isSelected={true} />
      ))}
      {(fill
        ? selectedNodeIds.filter((nodeId) => looseNodeIds.includes(nodeId))
        : selectedNodeIds
      ).map((id) => (
        <Node key={id} id={id} fill={fill} isSelected={true} />
      ))}
      {isGlobbing && <GhostGlob />}
      {isCreating && <GhostNode />}
    </>
  )
}
