import React, { useRef, useMemo, useCallback, useEffect } from "react"
import * as svg from "lib/svg"
import * as Vec from "lib/vec"
import {
  getCircleTangentToPoint,
  getSweep,
  projectPoint,
  getArcDashOffset,
  getGlob,
  getClosestPointOnCircle,
  radiansToDegrees,
  getEllipseDashOffset,
  arrsIntersect,
} from "utils"
import Dot from "./dot"
import Handle from "./handle"
import { IGlobPath } from "types"
import state, { useSelector } from "lib/state"

interface Props {
  id: string
}

export default function Glob({ id }: Props) {
  const zoom = useSelector((s) => s.data.camera.zoom)
  const glob = useSelector((s) => s.data.globs[id])
  const nodes = useSelector((s) => glob?.nodes.map((id) => s.data.nodes[id]))
  const fill = useSelector((s) => s.data.fill)

  const rOutline = useRef<SVGPathElement>(null)

  useEffect(() => {
    state.send("MOUNTED_ELEMENT", { id: glob.id, elm: rOutline.current })
  }, [])

  const rPrevPts = useRef<IGlobPath>()

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

  if (!glob) return null

  const { D, Dp, a, b, ap, bp } = glob.options

  const [start, end] = nodes
  const { point: C0, radius: r0 } = start
  const { point: C1, radius: r1 } = end

  let safe = !!glob.points
  let globPts = glob.points || rPrevPts.current

  rPrevPts.current = globPts

  const { E0, E0p, E1, E1p, F0, F1, F0p, F1p, N0, N0p, N1, N1p } = globPts

  // const cp0 = Vec.med(F0, F0p)
  // const cp1 = Vec.med(F1, F1p)

  const D1 = projectPoint(D, Vec.angle(D, E0), Vec.dist(D, E0) * 2)
  const Dp1 = projectPoint(Dp, Vec.angle(Dp, E0p), Vec.dist(Dp, E0p) * 2)
  const D2 = projectPoint(D, Vec.angle(D, E1), Vec.dist(D, E1) * 2)
  const Dp2 = projectPoint(Dp, Vec.angle(Dp, E1p), Vec.dist(Dp, E1p) * 2)

  // Outer Caps

  // const startCapOuter = useMemo(() => {
  //   const shape = new Three.Shape()
  //   shape.absarc(C0.x, C0.y, r0, angleTo(C0, E0p), angleTo(C0, E0), false)
  //   return shape
  // }, [C0, r0, E0, E0p])

  // const endCapOuter = useMemo(() => {
  //   const shape = new Three.Shape()
  //   shape.absarc(C1.x, C1.y, r1, angleTo(C1, E1), angleTo(C1, E1p), false)
  //   return shape
  // }, [C1, r1, E1, E1p])

  // Inner Caps

  // const startCapInner = useMemo(() => {
  //   const shape = new Three.Shape()
  //   shape.absarc(C0.x, C0.y, r0, angleTo(C0, E0p), angleTo(C0, E0), true)
  //   return shape
  // }, [C0, r0, E0, E0p])

  // const endCapInner = useMemo(() => {
  //   const shape = new Three.Shape()
  //   shape.absarc(C1.x, C1.y, r1, angleTo(C1, E1), angleTo(C1, E1p), true)
  //   return shape
  // }, [C1, r1, E1, E1p])

  // const handleChange = useCallback(
  //   (delta: Partial<IGlobParams>) => {
  //     if (onChange) {
  //       let next = { ...glob.options, ...delta }

  //       for (let handle of [next.D, next.Dp]) {
  //         if (Vec.dist(handle, next.C0) < next.r0) {
  //           handle = getClosestPointOnCircle(next.C0, next.r0, handle)
  //         }

  //         if (Vec.dist(handle, next.C1) < next.r1) {
  //           handle = getClosestPointOnCircle(next.C1, next.r1, handle)
  //         }
  //       }

  //       state.send("CHANGED_GLOB_OPTIONS", next)
  //     }
  //   },
  //   [glob, onChange]
  // )

  const z = zoom < 1 ? 1 : 1 / zoom
  const stroke = 2 // * z
  const dash = `${1 / zoom} ${4 / zoom}` //zoom > 1 ? 2 / zoom : 2

  return (
    <g strokeWidth={zoom > 1 ? stroke / zoom : stroke} strokeLinecap="round">
      {safe ? (
        <path
          ref={rOutline}
          d={getGlobOutline(globPts, start.cap, end.cap)}
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
      {!fill && (
        <g>
          {safe && (
            <g fill="none" strokeWidth={z * 1.5} pointerEvents="none">
              {isDraggingD ? (
                <path
                  d={[
                    svg.moveTo(projectPoint(D, Vec.angle(D, E0), 10000)),
                    svg.lineTo(projectPoint(D, Vec.angle(D, E0), -10000)),
                    svg.moveTo(projectPoint(D, Vec.angle(D, E1), 10000)),
                    svg.lineTo(projectPoint(D, Vec.angle(D, E1), -10000)),
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
                    svg.moveTo(projectPoint(Dp, Vec.angle(Dp, E0p), 10000)),
                    svg.lineTo(projectPoint(Dp, Vec.angle(Dp, E0p), -10000)),
                    svg.moveTo(projectPoint(Dp, Vec.angle(Dp, E1p), 10000)),
                    svg.lineTo(projectPoint(Dp, Vec.angle(Dp, E1p), -10000)),
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
            <Dot position={E0} radius={z * 3} color="dodgerblue" />
            <Dot position={F0} radius={z * 3} color="dodgerblue" />
            <Dot position={F1} radius={z * 3} color="dodgerblue" />
            <Dot position={E1} radius={z * 3} color="dodgerblue" />
            <Dot position={D1} radius={z * 3} color="dodgerblue" />
            <Dot position={D2} radius={z * 3} color="dodgerblue" />
            <Dot position={E0p} radius={z * 3} color="orange" />
            <Dot position={E1p} radius={z * 3} color="orange" />
            <Dot position={F0p} radius={z * 3} color="orange" />
            <Dot position={F1p} radius={z * 3} color="orange" />
            <Dot position={Dp1} radius={z * 3} color="orange" />
            <Dot position={Dp2} radius={z * 3} color="orange" />
            {glob.p0 && <Dot position={glob.p0} radius={z * 3} color="blue" />}
          </g>
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
  { C0, r0, C1, r1, E0, E1, F0, F1, E0p, E1p, F0p, F1p }: IGlobPath,
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
