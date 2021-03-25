import { useSelector } from "lib/state"
import { deepCompare } from "lib/utils"

interface Props {
  id: string
}

export default function HoverNode({ id }: Props) {
  const node = useSelector((s) => s.data.nodes[id], deepCompare)

  if (!node) return null

  return (
    <circle
      cx={node.point[0]}
      cy={node.point[1]}
      r={Math.max(8, node.radius)}
      fill="rgba(255, 0, 0, .12)"
      pointerEvents="none"
    />
  )
}
