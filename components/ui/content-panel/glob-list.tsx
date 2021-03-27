import { useSelector } from "lib/state"
import GlobListItem from "./glob-list-item"

export default function GlobList() {
  const globIds = useSelector((s) => s.data.globIds)

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
