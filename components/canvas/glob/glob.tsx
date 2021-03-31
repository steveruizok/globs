import React, { useRef, useCallback } from "react"
import classNames from "classnames"
import { deepCompare, getGlobOutline } from "utils"
import { IGlobPoints } from "types"
import state, { useSelector, mvPointer } from "lib/state"
import Handles from "./handles"
import BrokenGlob from "./broken-glob"
import useRegisteredElement from "hooks/useRegisteredElement"
import CenterLine from "./center-line"
import Dot from "../dot"
import Combs from "./combs"

interface Props {
  id: string
  fill: boolean
}

export default function Glob({ id, fill }: Props) {
  const glob = useSelector((s) => s.data.globs[id], deepCompare)
  const start = useSelector((s) => s.data.nodes[glob?.nodes[0]])
  const end = useSelector((s) => s.data.nodes[glob?.nodes[1]])

  const rOutline = useRegisteredElement<SVGPathElement>(id)

  const isHovered = useSelector((s) => s.data.hoveredGlobs.includes(id))

  const isSelected = useSelector(({ data: { selectedGlobs } }) =>
    selectedGlobs.includes(id)
  )

  const isDraggingD = useSelector(
    ({ data: { selectedHandle } }) =>
      selectedHandle?.id === id && selectedHandle.handle === "D"
  )

  const isDraggingDp = useSelector(
    ({ data: { selectedHandle } }) =>
      selectedHandle?.id === id && selectedHandle.handle === "Dp"
  )

  const rPrevPts = useRef<IGlobPoints>()

  function handleUnhoverGlob() {
    state.send("UNHOVERED_GLOB", { id })
  }

  function handleHoverGlob() {
    state.send("HOVERED_GLOB", { id })
  }

  function handleSelectGlob() {
    state.send("SELECTED_GLOB", { id })
  }

  if (!glob) return null

  let safe = !!glob.points
  let globPts = glob.points || rPrevPts.current

  if (!globPts) return null

  rPrevPts.current = globPts

  const outline = getGlobOutline(globPts, start.cap, end.cap)

  return (
    <g onPointerLeave={handleUnhoverGlob} onPointerEnter={handleHoverGlob}>
      {safe ? (
        <path
          ref={rOutline}
          d={outline}
          onPointerDown={handleSelectGlob}
          className={classNames([
            "strokewidth-m",
            {
              "stroke-selected": !fill && isSelected,
              "stroke-outline": !fill && !isSelected,
              "fill-flat": fill,
              "fill-soft": !fill,
            },
          ])}
        />
      ) : (
        <BrokenGlob start={start} end={end} />
      )}
      {!fill && safe && (
        <>
          {/* {isSelected && isHovered && <CenterLine glob={glob} />} */}
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
    </g>
  )
}
