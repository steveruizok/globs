import state, { useSelector } from "lib/state"
import { useCallback } from "react"
import { Lock, Unlock } from "react-feather"

export default function NodeListItem({
  id,
  selected,
}: {
  id: string
  selected: boolean
}) {
  const node = useSelector((s) => s.data.nodes[id])

  const handlePointerLeave = useCallback(
    () => state.send("UNHIGHLIT_NODE", { id }),
    [id]
  )

  const handlePointerEnter = useCallback(
    () => state.send("HIGHLIT_NODE", { id }),
    [id]
  )

  const handleSelect = useCallback(() => state.send("POINTED_NODE", { id }), [
    id,
  ])

  const handleLock = useCallback(
    () => state.send("TOGGLED_NODE_LOCKED", { id }),
    [id]
  )

  if (!node) return null

  return (
    <>
      <button
        data-selected={selected}
        onClick={handleSelect}
        onPointerLeave={handlePointerLeave}
        onPointerEnter={handlePointerEnter}
      >
        {node.name}
      </button>
      <button data-hidey={!node.locked} onClick={handleLock}>
        {node.locked ? (
          <Lock size={12} strokeWidth={3} opacity={1} />
        ) : (
          <Unlock size={12} strokeWidth={3} opacity={0.4} />
        )}
      </button>
    </>
  )
}
