import React, { useRef, useMemo, useCallback, useEffect, useState } from "react"
import * as svg from "lib/svg"
import * as vec from "lib/vec"
import { projectPoint } from "utils"
import Dot from "./dot"
import Handle from "./handle"
import { IGlobPoints } from "types"
import state, { useSelector } from "lib/state"
import Anchor from "./anchor"

interface Props {
  id: string
}

export default function Glob({ id }: Props) {
  const zoom = useSelector((s) => s.data.camera.zoom)
  const glob = useSelector((s) => s.data.globs[id])
  const nodes = useSelector((s) => glob?.nodes.map((id) => s.data.nodes[id]))
  const fill = useSelector((s) => s.data.fill)

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
  const { point: C0, radius: r0 } = start
  const { point: C1, radius: r1 } = end

  const { E0, E0p, E1, E1p, F0, F1, F0p, F1p, N0, N0p, N1, N1p } = globPts

  const D1 = projectPoint(D, vec.angle(D, E0), vec.dist(D, E0) * 2)
  const Dp1 = projectPoint(Dp, vec.angle(Dp, E0p), vec.dist(Dp, E0p) * 2)
  const D2 = projectPoint(D, vec.angle(D, E1), vec.dist(D, E1) * 2)
  const Dp2 = projectPoint(Dp, vec.angle(Dp, E1p), vec.dist(Dp, E1p) * 2)

  const outline = getGlobOutline(globPts, start.cap, end.cap)

  const z = zoom < 1 ? 1 : 1 / zoom
  const stroke = 2 // * z

  return (
    <g strokeWidth={zoom > 1 ? stroke / zoom : stroke} strokeLinecap="round">
      {safe ? (
        <path
          ref={rOutline}
          d={outline}
          stroke={isSelected ? "red" : "black"}
          onPointerLeave={() => state.send("UNHOVERED_GLOB", { id: glob.id })}
          onPointerEnter={() => state.send("HOVERED_GLOB", { id: glob.id })}
          onPointerDown={() => state.send("SELECTED_GLOB", { id: glob.id })}
        />
      ) : (
        <line
          x1={C0[0]}
          y1={C0[1]}
          x2={C1[0]}
          y2={C1[1]}
          stroke="red"
          strokeWidth={2 / zoom}
        />
      )}
      {/* Skeleton + Outline */}
      {!fill && safe && (
        <g pointerEvents="none">
          <path
            ref={rOutline}
            d={outline}
            stroke={isSelected ? "red" : "black"}
            fill="transparent"
            pointerEvents="none"
          />
        </g>
      )}
      {!fill && (
        <g>
          {safe && (
            <g fill="none" strokeWidth={z * 1.5} pointerEvents="none">
              {isDraggingD ? (
                <path
                  d={[
                    svg.moveTo(projectPoint(D, vec.angle(D, E0), 10000)),
                    svg.lineTo(projectPoint(D, vec.angle(D, E0), -10000)),
                    svg.moveTo(projectPoint(D, vec.angle(D, E1), 10000)),
                    svg.lineTo(projectPoint(D, vec.angle(D, E1), -10000)),
                  ].join(" ")}
                  stroke="red"
                  opacity={0.5}
                />
              ) : (
                <path
                  d={[svg.moveTo(E0), svg.lineTo(D), svg.lineTo(E1)].join(" ")}
                  stroke={isSelected ? "red" : "dodgerblue"}
                  strokeDasharray={`${z * 1} ${z * 3}`}
                />
              )}
              {isDraggingDp ? (
                <path
                  d={[
                    svg.moveTo(projectPoint(Dp, vec.angle(Dp, E0p), 10000)),
                    svg.lineTo(projectPoint(Dp, vec.angle(Dp, E0p), -10000)),
                    svg.moveTo(projectPoint(Dp, vec.angle(Dp, E1p), 10000)),
                    svg.lineTo(projectPoint(Dp, vec.angle(Dp, E1p), -10000)),
                  ].join(" ")}
                  stroke="red"
                  opacity={0.5}
                />
              ) : (
                <path
                  d={[svg.moveTo(E0p), svg.lineTo(Dp), svg.lineTo(E1p)].join(
                    " "
                  )}
                  stroke={isSelected ? "red" : "orange"}
                  strokeDasharray={`${z * 1} ${z * 3}`}
                />
              )}
            </g>
          )}
          {/* Dots */}
          <g opacity=".5">
            {/* <Dot position={E0} radius={z * 3} color="dodgerblue" />
            <Dot position={E1} radius={z * 3} color="dodgerblue" /> 
            <Dot position={E0p} radius={z * 3} color="orange" />
            <Dot position={E1p} radius={z * 3} color="orange" /> */}
            <Dot position={D1} radius={z * 3} color="dodgerblue" />
            <Dot position={D2} radius={z * 3} color="dodgerblue" />
            <Dot position={Dp1} radius={z * 3} color="orange" />
            <Dot position={Dp2} radius={z * 3} color="orange" />
            {/* {glob.p0 && <Dot position={glob.p0} radius={z * 3} color="blue" />} */}
          </g>
          {/* Anchors */}
          <Anchor
            position={F0}
            radius={z * 8}
            color="dodgerblue"
            onSelect={() =>
              state.send("SELECTED_ANCHOR", { id: glob.id, anchor: "a" })
            }
          />
          <Anchor
            position={F1}
            radius={z * 8}
            color="dodgerblue"
            onSelect={() =>
              state.send("SELECTED_ANCHOR", { id: glob.id, anchor: "b" })
            }
          />
          <Anchor
            position={F0p}
            radius={z * 8}
            color="orange"
            onSelect={() =>
              state.send("SELECTED_ANCHOR", { id: glob.id, anchor: "ap" })
            }
          />
          <Anchor
            position={F1p}
            radius={z * 8}
            color="orange"
            onSelect={() =>
              state.send("SELECTED_ANCHOR", { id: glob.id, anchor: "bp" })
            }
          />
          {/* Left Handles */}
          <Handle
            color="dodgerblue"
            position={D}
            radius={z * 12}
            onSelect={() =>
              state.send("POINTED_HANDLE", { id: glob.id, handle: "D" })
            }
          />
          {/* Right Handles */}
          <Handle
            color="orange"
            position={Dp}
            radius={z * 12}
            onSelect={() =>
              state.send("POINTED_HANDLE", { id: glob.id, handle: "Dp" })
            }
          />
        </g>
      )}
    </g>
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
