import { useSelector } from "lib/state"
import { deepCompare } from "lib/utils"
import { useRef } from "react"

interface Props {
  id: string
}

export default function HoverNode({ id }: Props) {
  const node = useSelector((s) => s.data.nodes[id], deepCompare)

  if (!node) return null

  return <circle cx={node.point[0]} cy={node.point[1]} r={node.radius} />
}
