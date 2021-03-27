import { useSelector } from "lib/state"
import Glob from "./glob/glob"

export default function HoveringNodes() {
  const globIds = useSelector((s) => s.data.globIds)
  const fill = useSelector((s) => s.data.fill)

  return (
    <>
      {globIds.map((id) => (
        <Glob key={id} id={id} fill={fill} />
      ))}
    </>
  )
}
