import { useSelector } from "lib/state"
import Glob from "./glob/glob"
import GhostGlob from "./glob/ghost-glob"

export default function HoveringNodes() {
  const globIds = useSelector((s) => s.data.globIds)
  const fill = useSelector((s) => s.data.fill)
  const isLinking = useSelector((s) => s.isIn("linkingNodes"))

  return (
    <>
      {globIds.map((id) => (
        <Glob key={id} id={id} fill={fill} />
      ))}
      {isLinking && <GhostGlob />}
    </>
  )
}
