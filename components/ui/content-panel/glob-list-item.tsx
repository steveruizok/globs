import state, { useSelector } from "lib/state"
import { useCallback } from "react"

export default function GlobListItem({
  id,
  selected,
}: {
  id: string
  selected: boolean
}) {
  const glob = useSelector((s) => s.data.globs[id])

  const handlePointerLeave = useCallback(
    () => state.send("UNHIGHLIT_GLOB", { id }),
    [id]
  )

  const handlePointerEnter = useCallback(
    () => state.send("HIGHLIT_GLOB", { id }),
    [id]
  )

  const handleSelect = useCallback(() => state.send("SELECTED_GLOB", { id }), [
    id,
  ])

  if (!glob) return null

  return (
    <li
      key={id}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={handlePointerEnter}
    >
      <button data-selected={selected} onClick={handleSelect}>
        {glob.name}
      </button>
    </li>
  )
}
