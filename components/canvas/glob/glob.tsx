import React, { useRef, useCallback } from "react"
import { deepCompare } from "utils"
import { IGlobPoints } from "types"
import state, { useSelector } from "lib/state"
import Handles from "./handles"
import BrokenGlob from "./broken-glob"
import BaseGlob from "./base-glob"
import BaseNode from "../node/base-node"
import GlobNodeHints from "./glob-node-hints"
import useRegisteredElement from "hooks/useRegisteredElement"

interface Props {
  id: string
  fill: boolean
  isSelected: boolean
}

export default function Glob({ id, fill, isSelected }: Props) {
  const glob = useSelector((s) => s.data.globs[id], deepCompare)
  const start = useSelector((s) => s.data.nodes[glob?.nodes[0]])
  const end = useSelector((s) => s.data.nodes[glob?.nodes[1]])

  const ref = useRegisteredElement<SVGPathElement>(id)

  const isDraggingD = useSelector(
    ({ data: { selectedHandle } }) =>
      selectedHandle?.id === id && selectedHandle.handle === "D"
  )

  const isDraggingDp = useSelector(
    ({ data: { selectedHandle } }) =>
      selectedHandle?.id === id && selectedHandle.handle === "Dp"
  )

  const rPrevPts = useRef<IGlobPoints>()

  const handleUnhoverGlob = useCallback((e) => {
    state.send("UNHOVERED_GLOB", {
      id,
      shiftKey: e.shiftKey,
      optionKey: e.altKey,
      metaKey: e.metaKey || e.ctrlKey,
      ctrlKey: e.ctrlKey,
    })
  }, [])

  const handleHoverGlob = useCallback((e) => {
    state.send("HOVERED_GLOB", {
      id,
      shiftKey: e.shiftKey,
      optionKey: e.altKey,
      metaKey: e.metaKey || e.ctrlKey,
      ctrlKey: e.ctrlKey,
    })
  }, [])

  if (!glob) {
    console.warn(`No glob with id ${id}`)
    return null
  }

  if (!start) {
    console.warn(`No node with id ${glob.nodes[0]} in glob ${id}`)
    return null
  }

  if (!end) {
    console.warn(`No glob with id  ${glob.nodes[1]} in glob ${id}`)
    return null
  }

  const safe = !!glob.points
  const globPts = glob.points || rPrevPts.current

  if (!globPts) return null

  rPrevPts.current = globPts

  return (
    <g>
      <g onPointerLeave={handleUnhoverGlob} onPointerEnter={handleHoverGlob}>
        {safe ? (
          <BaseGlob
            ref={ref}
            id={glob.id}
            points={globPts}
            startCap={start.cap}
            endCap={end.cap}
            isFilled={fill}
            isSelected={isSelected}
          />
        ) : (
          <BrokenGlob start={start} end={end} />
        )}
      </g>
      {!fill && (
        <>
          <BaseNode
            id={start.id}
            cx={start.point[0]}
            cy={start.point[1]}
            r={start.radius}
            isGlobbed={true}
            isFilled={fill}
            isSelected={false}
            isLocked={start.locked}
          />
          <BaseNode
            id={end.id}
            cx={end.point[0]}
            cy={end.point[1]}
            r={end.radius}
            isGlobbed={true}
            isFilled={fill}
            isSelected={false}
            isLocked={end.locked}
          />
          <GlobNodeHints glob={glob} />
          {safe && (
            <>
              <Handles
                glob={glob}
                isPrime={false}
                isSelected={isSelected}
                isDragging={isDraggingD}
              />
              <Handles
                glob={glob}
                isPrime={true}
                isSelected={isSelected}
                isDragging={isDraggingDp}
              />
              {/* <Combs id={glob.id} points={glob.points} /> */}
            </>
          )}
        </>
      )}
    </g>
  )
}
