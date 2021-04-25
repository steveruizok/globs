import state, { useSelector } from "lib/state"
import { useCallback } from "react"

export default function PageListItem({
  id,
  selected,
}: {
  id: string
  selected: boolean
}) {
  const page = useSelector((s) => s.data.pages[id])

  const handleSelect = useCallback(
    (e) => {
      if (e.buttons !== 1) return
      state.send("POINTED_PAGE", { id })
    },
    [id]
  )

  if (!page) return null

  return (
    <button data-selected={selected} onPointerDown={handleSelect}>
      {page.name}
    </button>
  )
}
