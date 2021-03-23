import state, { useSelector } from "lib/state"
import { deepCompareArrays, deepCompare } from "lib/utils"
import { useEffect, useRef } from "react"
import Dot from "./dot"

interface Props {
  id: string
}

export default function Node({ id }: Props) {
  const fill = useSelector((s) => s.data.fill)
  const node = useSelector((s) => s.data.nodes[id], deepCompare)
  const globs = useSelector(
    (s) =>
      Object.values(s.data.globs).filter((glob) => glob.nodes.includes(id)),
    deepCompareArrays
  )

  const isSelected = useSelector((s) => s.data.selectedNodes.includes(id))

  const rOutline = useRef<SVGCircleElement>(null)
  useEffect(() => {
    state.send("MOUNTED_ELEMENT", { id: node.id, elm: rOutline.current })
  }, [])

  if (!node) {
    // This component's hook updated before its parent's!
    return null
  }

  const hasGlobs = globs.length > 0

  return (
    <g>
      <circle
        ref={rOutline}
        cx={node.point[0]}
        cy={node.point[1]}
        r={node.radius}
        fill={hasGlobs ? "transparent" : undefined}
        stroke={isSelected ? "red" : undefined}
        className="stroke-m"
      />
      <circle
        cx={node.point[0]}
        cy={node.point[1]}
        r={Math.max(node.radius, 8)}
        fill="transparent"
        stroke="transparent"
        onPointerDown={() => state.send("SELECTED_NODE", { id })}
        onDoubleClick={() => state.send("TOGGLED_CAP", { id })}
        onPointerOver={() => state.send("HOVERED_NODE", { id })}
        onPointerOut={() => state.send("UNHOVERED_NODE", { id })}
      />
      {!fill && node.locked ? (
        <use
          href="#anchor"
          x={node.point[0]}
          y={node.point[1]}
          className="stroke-m dash-array-normal"
          pointerEvents="none"
        />
      ) : (
        <Dot position={node.point} />
      )}
    </g>
  )
}
