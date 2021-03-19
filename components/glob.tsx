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
} from "utils"
import Dot from "./dot"
import Handle from "./handle"
import Node from "./node"
import { IGlobPath } from "types"
import state, { useSelector } from "lib/state"

interface Props {
  id: string
}

export default function Glob({ id }: Props) {
  const zoom = useSelector((s) => s.data.camera.zoom)
  const glob = useSelector((s) => s.data.globs[id])
  const start = useSelector((s) => s.data.nodes[glob?.start])
  const end = useSelector((s) => s.data.nodes[glob?.end])

  const rPrevPts = useRef<ReturnType<typeof getGlob>>()
  const isSelected = useSelector(
    (s) =>
      s.data.selectedGlobs.includes(id) ||
      s.data.selected.includes(glob?.start) ||
      s.data.selected.includes(glob?.end)
  )

  const isDraggingD = useSelector(
    (s) =>
      s.data.selectedHandle?.id === id && s.data.selectedHandle.handle === "D"
  )

  const isDraggingDp = useSelector(
    (s) =>
      s.data.selectedHandle?.id === id && s.data.selectedHandle.handle === "Dp"
  )

  if (!glob) return null

  const { D, Dp, a, b, ap, bp } = glob.options

  const { point: C0, radius: r0 } = start
  const { point: C1, radius: r1 } = end

  let globPts = rPrevPts.current

  try {
    rPrevPts.current = globPts = getGlob(C0, r0, C1, r1, D, Dp, a, b, ap, bp)
  } catch (e) {
    return null
  }

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

  const z = Math.min(2, 1 / zoom)
  const stroke = isSelected ? 3 : 2 // * z
  const dash = `${1 / zoom} ${4 / zoom}` //zoom > 1 ? 2 / zoom : 2

  return (
    <g strokeWidth={zoom > 1 ? stroke / zoom : stroke} strokeLinecap="round">
      <path
        d={getGlobOutline(globPts, start.cap, end.cap)}
        fill="#ffffff"
        stroke="black"
        onPointerDown={() => state.send("POINTED_GLOB", { id: glob.id })}
      />
      <g strokeDasharray={dash} pointerEvents="none" fill="none" stroke="black">
        {/* Middle Path */}
        {/* <path
              ref={rMiddlePath}
              mask={`url(#mask${id})`}
              strokeDashoffset={0}
              d={[svg.moveTo(C0), svg.bezierTo(cp0, cp1, C1)].join(" ")}
            /> */}
        {/* Inner Arcs */}
        {start.cap === "round" ? (
          <path
            d={[svg.arcTo(C0, r0, E0p, E0)].join(" ")}
            // strokeDashoffset={getArcDashOffset(C0, r0, E0, E0p, dash)}
          />
        ) : (
          <path
            d={[svg.ellipse(C0, r0)].join(" ")}
            transform={`rotate(${radiansToDegrees(Vec.angle(N0p, C0))}, ${
              C0[0]
            }, ${C0[1]})`}
            // strokeDashoffset={getEllipseDashOffset(C0, dash)}
          />
        )}
        {end.cap === "round" ? (
          <path
            d={[svg.arcTo(C1, r1, E1p, E1)].join(" ")}
            // strokeDashoffset={getArcDashOffset(C1, r1, E1p, E1, dash)}
          />
        ) : (
          <path
            d={[svg.ellipse(C1, r1)].join(" ")}
            transform={`rotate(${radiansToDegrees(Vec.angle(N1p, C1))}, ${
              C1[0]
            }, ${C1[1]})`}
            // strokeDashoffset={getEllipseDashOffset(C1, dash)}
          />
        )}
      </g>
      <g fill="none" strokeWidth={1 / zoom}>
        {isDraggingD ? (
          <path
            d={[
              svg.moveTo(projectPoint(D, Vec.angle(D, E0), 10000)),
              svg.lineTo(projectPoint(D, Vec.angle(D, E0), -10000)),
              svg.moveTo(projectPoint(D, Vec.angle(D, E1), 10000)),
              svg.lineTo(projectPoint(D, Vec.angle(D, E1), -10000)),
            ].join(" ")}
            stroke="dodgerblue"
            opacity={0.5}
          />
        ) : (
          <path
            d={[svg.moveTo(E0), svg.lineTo(D), svg.lineTo(E1)].join(" ")}
            stroke="dodgerblue"
            strokeDasharray={`${1 / zoom} ${3 / zoom}`}
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
            opacity={0.5}
            stroke="orange"
          />
        ) : (
          <path
            d={[svg.moveTo(E0p), svg.lineTo(Dp), svg.lineTo(E1p)].join(" ")}
            stroke="orange"
            strokeDasharray={dash}
          />
        )}
      </g>
      <Node
        id={glob.start}
        onSelect={() => state.send("POINTED_NODE", { id: glob.start })}
      />
      <Node
        id={glob.end}
        onSelect={() => state.send("POINTED_NODE", { id: glob.end })}
      />
      {/* <Line
          points={startCapOuter
            .getPoints(50)
            .map((p) => new Three.Vector3(p.x, p.y, C0.z))}
          dashOffset={getArcDashOffset(C0, r0, E0, E0p, 4)}
          color={"black"}
          flatShading
        />
        <Line
          points={endCapOuter
            .getPoints(50)
            .map((p) => new Three.Vector3(p.x, p.y, C0.z))}
          dashOffset={getArcDashOffset(C0, r0, E0, E0p, 4)}
          color={"black"}
          flatShading
        /> */}
      {/* <Line
          points={startCapInner
            .getPoints(50)
            .map((p) => new Three.Vector3(p.x, p.y, C0.z))}
          dashed
          dashSize={4}
          lineWidth={2}
          dashOffset={getArcDashOffset(C0, r0, E0, E0p, 4)}
          color={"black"}
          flatShading
        />
        <Line
          points={endCapInner
            .getPoints(50)
            .map((p) => new Three.Vector3(p.x, p.y, C1.z))}
          dashed
          dashSize={4}
          dashOffset={getArcDashOffset(C1, r1, E1, E1p, 4)}
          lineWidth={2}
          color={"black"}
          flatShading
        /> */}
      <g>
        <Dot position={E0} color="dodgerblue" />
        <Dot position={F0} color="dodgerblue" />
        <Dot position={F1} color="dodgerblue" />
        <Dot position={E1} color="dodgerblue" />
        <Dot position={D1} color="dodgerblue" />
        <Dot position={D2} color="dodgerblue" />
        <Dot position={E0p} color="orange" />
        <Dot position={E1p} color="orange" />
        <Dot position={F0p} color="orange" />
        <Dot position={F1p} color="orange" />
        <Dot position={Dp1} color="orange" />
        <Dot position={Dp2} color="orange" />
      </g>
      <g>
        {/* Left Handles */}
        <Handle
          color="dodgerblue"
          position={D}
          onSelect={() =>
            state.send("POINTED_HANDLE", { id: glob.id, handle: "D" })
          }
        />
        {/* Right Handles */}
        <Handle
          color="orange"
          position={Dp}
          onSelect={() =>
            state.send("POINTED_HANDLE", { id: glob.id, handle: "Dp" })
          }
        />
      </g>
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
