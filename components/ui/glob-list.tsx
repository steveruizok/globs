import state, { useSelector } from "lib/state"
import { deepCompare } from "lib/utils"

export default function GlobList() {
  const globIds = useSelector((s) => s.data.globIds, deepCompare)
  const selected = useSelector((s) => s.data.selectedGlobs)

  return (
    <>
      <section>
        <h2>Globs</h2>
      </section>
      <ol>
        {globIds.map((id) => (
          <li key={id}>
            <button
              data-selected={selected.includes(id)}
              onPointerLeave={() => state.send("UNHIGHLIT_GLOB", { id })}
              onPointerEnter={() => state.send("HIGHLIT_GLOB", { id })}
              onClick={() => state.send("SELECTED_GLOB", { id })}
            >
              {state.data.globs[id].name}
            </button>
          </li>
        ))}
      </ol>
    </>
  )
}
