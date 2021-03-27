import useRegisteredElement from "hooks/useRegisteredElement"
import state, { useSelector } from "lib/state"
import { deepCompareArrays, deepCompare } from "lib/utils"
import { useEffect, useRef } from "react"
import Dot from "./dot"

interface Props {
  id: string
  fill: boolean
}

export default function Node({ id, fill }: Props) {
  const node = useSelector((s) => s.data.nodes[id], deepCompare)

  const hasGlobs = useSelector((s) =>
    Object.values(s.data.globs).find((glob) => glob.nodes.includes(id))
  )

  const isSelected = useSelector((s) => s.data.selectedNodes.includes(id))

  const rOutline = useRegisteredElement<SVGCircleElement>(id)

  useEffect(() => {
    if (node) {
      state.send("MOUNTED_ELEMENT", { id: node.id, elm: rOutline.current })
    }

    return () => {
      state.send("UNMOUNTED_ELEMENT", { id: node?.id })
    }
  }, [])

  if (!node) {
    // This component's hook updated before its parent's!
    return null
  }

  // if (hasGlobs) return null

  return (
    <>
      <circle
        ref={rOutline}
        cx={node.point[0]}
        cy={node.point[1]}
        r={node.radius}
        fill={
          hasGlobs ? "transparent" : fill ? "black" : "rgba(255, 255, 255, .72)"
        }
        stroke={fill ? "transparent" : isSelected ? "red" : "black"}
        className="stroke-m"
        pointerEvents="none"
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
      {!fill &&
        (node.locked ? (
          <use
            href="#anchor"
            x={node.point[0]}
            y={node.point[1]}
            className="stroke-m dash-array-normal"
            pointerEvents="none"
          />
        ) : (
          <Dot position={node.point} />
        ))}
    </>
  )
}
