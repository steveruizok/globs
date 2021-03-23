import React, { useRef, useMemo, useCallback, useEffect, useState } from "react"
import * as svg from "lib/svg"
import * as vec from "lib/vec"
import { deepCompare, deepCompareArrays } from "utils"
import Dot from "./dot"
import Handle from "./glob-elements/handle"
import { IGlobPoints } from "types"
import state, { useSelector } from "lib/state"
import Anchor from "./glob-elements/anchor"
import Handles from "./glob-elements/handles"

interface Props {
  id: string
  fill: boolean
}

export default function Glob({ id, fill }: Props) {
  const glob = useSelector((s) => s.data.globs[id], deepCompare)
  const nodes = useSelector(
    (s) => glob?.nodes.map((id) => s.data.nodes[id]),
    deepCompareArrays
  )

  const rOutline = useRef<SVGPathElement>(null)

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

  useEffect(() => {
    state.send("MOUNTED_ELEMENT", { id: glob.id, elm: rOutline.current })
    return () => void state.send("UNMOUNTED_ELEMENT", { id: glob.id })
  }, [])

  const rPrevPts = useRef<IGlobPoints>()

  if (!glob) return null

  let safe = !!glob.points
  let globPts = glob.points || rPrevPts.current

  rPrevPts.current = globPts

  const { D, Dp } = glob.options

  const [start, end] = nodes
  const { point: C0 } = start
  const { point: C1 } = end

  const {
    E0,
    E0p,
    E1,
    E1p,
    F0,
    F1,
    F0p,
    F1p,
    D1,
    Dp1,
    D2,
    Dp2,
    N0,
    N0p,
    N1,
    N1p,
  } = globPts

  const outline = getGlobOutline(globPts, start.cap, end.cap)

  return (
    <>
      {safe ? (
        <path
          ref={rOutline}
          d={outline}
          className="stroke-m"
          stroke={isSelected ? "red" : "black"}
          onPointerLeave={() => state.send("UNHOVERED_GLOB", { id: glob.id })}
          onPointerEnter={() => state.send("HOVERED_GLOB", { id: glob.id })}
          onPointerDown={() => state.send("SELECTED_GLOB", { id: glob.id })}
          fill={fill ? "black" : "rgba(255, 255, 255, .72)"}
        />
      ) : (
        <line
          x1={C0[0]}
          y1={C0[1]}
          x2={C1[0]}
          y2={C1[1]}
          stroke="red"
          className="stroke-m"
        />
      )}
      {!fill && safe && (
        <>
          <path
            stroke={isSelected ? "red" : "black"}
            fill="transparent"
            pointerEvents="none"
            className="stroke-m"
          />
          <g opacity=".5">
            <Dot position={D1} color="dodgerblue" />
            <Dot position={D2} color="dodgerblue" />
            <Dot position={Dp1} color="orange" />
            <Dot position={Dp2} color="orange" />
          </g>
          <Anchor
            position={F0}
            isSelected={isSelected}
            color="dodgerblue"
            onSelect={() =>
              state.send("SELECTED_ANCHOR", { id: glob.id, anchor: "a" })
            }
          />
          <Anchor
            position={F1}
            isSelected={isSelected}
            color="dodgerblue"
            onSelect={() =>
              state.send("SELECTED_ANCHOR", { id: glob.id, anchor: "b" })
            }
          />
          <Anchor
            position={F0p}
            isSelected={isSelected}
            color="orange"
            onSelect={() =>
              state.send("SELECTED_ANCHOR", { id: glob.id, anchor: "ap" })
            }
          />
          <Anchor
            position={F1p}
            isSelected={isSelected}
            color="orange"
            onSelect={() =>
              state.send("SELECTED_ANCHOR", { id: glob.id, anchor: "bp" })
            }
          />
          <Handles
            position={D}
            start={E0}
            end={E1}
            color="dodgerblue"
            isSelected={isSelected}
            isDragging={isDraggingD}
            onSelect={() =>
              state.send("POINTED_HANDLE", {
                id: glob.id,
                handle: "D",
              })
            }
          />
          <Handles
            position={Dp}
            start={E0p}
            end={E1p}
            color="orange"
            isSelected={isSelected}
            isDragging={isDraggingDp}
            onSelect={() =>
              state.send("POINTED_HANDLE", {
                id: glob.id,
                handle: "Dp",
              })
            }
          />
        </>
      )}
    </>
  )
}

export function getGlobOutline(
  { C0, r0, C1, r1, E0, E1, F0, F1, E0p, E1p, F0p, F1p }: IGlobPoints,
  startCap: "round" | "flat" = "round",
  endCap: "round" | "flat" = "round"
) {
  return [
    svg.moveTo(E0),
    startCap === "round" ? svg.arcTo(C0, r0, E0, E0p) : svg.lineTo(E0p),
    svg.bezierTo(F0p, F1p, E1p),
    endCap === "round" ? svg.arcTo(C1, r1, E1p, E1) : svg.lineTo(E1),
    svg.bezierTo(F1, F0, E0),
  ].join(" ")
}
