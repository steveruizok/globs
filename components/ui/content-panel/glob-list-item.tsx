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

  const handleSelect = useCallback(
    (e) => {
      if (e.buttons !== 1) return
      state.send("POINTED_GLOB", { id })
    },
    [id]
  )

  if (!glob) return null

  return (
    <button
      data-selected={selected}
      onPointerDown={handleSelect}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={handlePointerEnter}
    >
      {glob.name}
    </button>
  )
}
