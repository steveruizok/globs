import state, { useSelector } from "lib/state"
import Dot from "./dot"

interface Props {
  id: string
  onSelect?: () => void
}

export default function Node({ id, onSelect }: Props) {
  const node = useSelector((s) => s.data.nodes[id])
  const globs = useSelector((s) =>
    Object.values(s.data.globs).filter(
      (glob) => glob.start === id || glob.end === id
    )
  )

  const hasGlobs = globs.length > 0

  return (
    <g
      transform={`translate(${node.point[0] - node.radius} ${
        node.point[1] - node.radius
      })`}
    >
      <circle
        cx={node.radius}
        cy={node.radius}
        r={node.radius}
        fill={hasGlobs ? "transparent" : "rgba(255, 255, 255, .3)"}
        stroke={hasGlobs ? "transparent" : "black"}
        strokeWidth={2}
        onPointerDown={onSelect}
        onDoubleClick={() => state.send("TOGGLED_CAP", { id })}
        onPointerOver={() => state.send("HOVERED_NODE", { id })}
        onPointerOut={() => state.send("UNHOVERED_NODE", { id })}
      />
      <circle
        pointerEvents="none"
        cx={node.radius}
        cy={node.radius}
        r={2}
        fill={"black"}
      />
    </g>
  )
}
