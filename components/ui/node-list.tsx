import state, { useSelector } from "lib/state"
import { deepCompare } from "lib/utils"

export default function NodeList() {
  const nodeIds = useSelector((s) => s.data.nodeIds, deepCompare)
  const selected = useSelector((s) => s.data.selected, deepCompare)

  return (
    <>
      <section>
        <h2>Nodes</h2>
      </section>
      <ol>
        {nodeIds.map((id) => (
          <li key={id}>
            <button
              data-selected={selected.includes(id)}
              onPointerLeave={() => state.send("UNHIGHLIT_NODE", { id })}
              onPointerEnter={() => state.send("HIGHLIT_NODE", { id })}
              onClick={() => state.send("SELECTED_NODE", { id })}
            >
              {state.data.nodes[id].name}
            </button>
          </li>
        ))}
      </ol>
    </>
  )
}
