import { useSelector } from "lib/state"
import NodeListItem from "./node-list-item"

export default function NodeList() {
  const nodeIds = useSelector((s) => s.data.nodeIds)

  const selectedNodeIds = useSelector((s) => s.data.selectedNodes)

  return (
    <>
      <section>
        <h2>Nodes</h2>
      </section>
      <ol>
        {nodeIds.map((id) => (
          <NodeListItem
            key={id}
            id={id}
            selected={selectedNodeIds.includes(id)}
          />
        ))}
      </ol>
    </>
  )
}
