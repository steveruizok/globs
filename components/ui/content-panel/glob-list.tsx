import state, { useSelector } from "lib/state"
import { deepCompare, deepCompareArrays } from "lib/utils"

export default function GlobList() {
  const globIds = useSelector((s) => s.data.globIds, deepCompareArrays)
  const selected = useSelector((s) => s.data.selectedGlobs)

  return (
    <>
      <section>
        <h2>Globs</h2>
      </section>
      <ol>
        {globIds.map((id) => (
          <GlobListItem key={id} id={id} selected={selected.includes(id)} />
        ))}
      </ol>
    </>
  )
}

function GlobListItem({ id, selected }: { id: string; selected: boolean }) {
  const glob = useSelector((s) => s.data.globs[id], deepCompare)

  if (!glob) return null

  return (
    <li
      key={id}
      onPointerLeave={() => state.send("UNHIGHLIT_GLOB", { id })}
      onPointerEnter={() => state.send("HIGHLIT_GLOB", { id })}
    >
      <button
        data-selected={selected}
        onClick={() => state.send("SELECTED_GLOB", { id })}
      >
        {glob.name}
      </button>
    </li>
  )
}
