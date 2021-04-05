import React, { useRef, useCallback } from "react"
import { deepCompare } from "utils"
import { IGlobPoints } from "types"
import state, { useSelector } from "lib/state"
import Handles from "./handles"
import BrokenGlob from "./broken-glob"
import BaseGlob from "./base-glob"
import BaseNode from "../node/base-node"

interface Props {
  id: string
  fill: boolean
  isSelected: boolean
}

export default function Glob({ id, fill, isSelected }: Props) {
  const glob = useSelector((s) => s.data.globs[id], deepCompare)
  const start = useSelector((s) => s.data.nodes[glob?.nodes[0]])
  const end = useSelector((s) => s.data.nodes[glob?.nodes[1]])

  const isDraggingD = useSelector(
    ({ data: { selectedHandle } }) =>
      selectedHandle?.id === id && selectedHandle.handle === "D"
  )

  const isDraggingDp = useSelector(
    ({ data: { selectedHandle } }) =>
      selectedHandle?.id === id && selectedHandle.handle === "Dp"
  )

  const rPrevPts = useRef<IGlobPoints>()

  const handleUnhoverGlob = useCallback(() => {
    state.send("UNHOVERED_GLOB", { id })
  }, [])

  const handleHoverGlob = useCallback(() => {
    state.send("HOVERED_GLOB", { id })
  }, [])

  if (!glob) return null

  let safe = !!glob.points
  let globPts = glob.points || rPrevPts.current

  if (!globPts) return null

  rPrevPts.current = globPts

  return (
    <g onPointerLeave={handleUnhoverGlob} onPointerEnter={handleHoverGlob}>
      {safe ? (
        <BaseGlob
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
      {!fill && safe && (
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
      {!fill && (
        <>
          <BaseNode
            id={start.id}
            cx={start.point[0]}
            cy={start.point[1]}
            r={start.radius}
            isFilled={fill}
            isSelected={isSelected}
            isLocked={start.locked}
          />
          <BaseNode
            id={end.id}
            cx={end.point[0]}
            cy={end.point[1]}
            r={end.radius}
            isFilled={fill}
            isSelected={isSelected}
            isLocked={end.locked}
          />
        </>
      )}
    </g>
  )
}
