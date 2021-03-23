import state, { useSelector } from "lib/state"
import { deepCompareArrays, deepCompare } from "lib/utils"
import { Lock, Unlock } from "react-feather"

export default function NodeList() {
  const nodeIds = useSelector((s) => s.data.nodeIds, deepCompareArrays)
  const selectedNodeIds = useSelector(
    (s) => s.data.selectedNodes,
    deepCompareArrays
  )

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

function NodeListItem({ id, selected }: { id: string; selected: boolean }) {
  const node = useSelector((s) => s.data.nodes[id], deepCompare)

  if (!node) return null

  return (
    <li
      key={id}
      onPointerLeave={() => state.send("UNHIGHLIT_NODE", { id })}
      onPointerEnter={() => state.send("HIGHLIT_NODE", { id })}
    >
      <button
        data-selected={selected}
        onClick={() => state.send("SELECTED_NODE", { id })}
      >
        {node.name}
      </button>
      <button
        data-hidey={!node.locked}
        onClick={() => state.send("TOGGLED_NODE_LOCKED", { id })}
      >
        {node.locked ? (
          <Lock size={12} strokeWidth={3} opacity={1} />
        ) : (
          <Unlock size={12} strokeWidth={3} opacity={0.4} />
        )}
      </button>
    </li>
  )
}
