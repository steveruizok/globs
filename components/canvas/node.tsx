import state, { useSelector } from "lib/state"
import { deepCompare } from "lib/utils"
import { useEffect, useRef } from "react"

interface Props {
  id: string
}

export default function Node({ id }: Props) {
  const zoom = useSelector((s) => s.data.camera.zoom)
  const node = useSelector((s) => s.data.nodes[id], deepCompare)
  const globs = useSelector((s) =>
    Object.values(s.data.globs).filter((glob) => glob.nodes.includes(id))
  )

  const isSelected = useSelector((s) => s.data.selected.includes(id))

  const hasGlobs = globs.length > 0

  const rOutline = useRef<SVGCircleElement>(null)
  useEffect(() => {
    state.send("MOUNTED_ELEMENT", { id: node.id, elm: rOutline.current })
  }, [])

  if (!node) {
    // This component's hook updated before its parent's!
    return null
  }

  return (
    <g>
      <circle
        ref={rOutline}
        cx={node.point[0]}
        cy={node.point[1]}
        r={node.radius}
        fill={hasGlobs ? "transparent" : "rgba(255, 255, 255, .8)"}
        stroke={isSelected ? "red" : "black"}
        strokeWidth={zoom < 1 ? 2 : 2 / zoom}
        onPointerDown={() => state.send("SELECTED_NODE", { id })}
        onDoubleClick={() => state.send("TOGGLED_CAP", { id })}
        onPointerOver={() => state.send("HOVERED_NODE", { id })}
        onPointerOut={() => state.send("UNHOVERED_NODE", { id })}
      />
      <circle
        pointerEvents="none"
        cx={node.point[0]}
        cy={node.point[1]}
        r={zoom < 1 ? 2 : 2 / zoom}
        fill={"black"}
      />
    </g>
  )
}
