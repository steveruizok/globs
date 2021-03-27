import React, { useRef, useMemo, useCallback, useEffect, useState } from "react"

import * as svg from "lib/svg"
import * as vec from "lib/vec"
import {
  closestPointOnPath,
  deepCompare,
  deepCompareArrays,
  circleFromThreePoints,
  getNearestPointOnCurve,
} from "utils"
import Dot from "../dot"
import Combs from "./combs"
import { IGlobPoints } from "types"
import state, { useSelector, mvPointer } from "lib/state"
import Anchor from "./anchor"
import Handles from "./handles"
import { motion, useTransform } from "framer-motion"
import useRegisteredElement from "hooks/useRegisteredElement"

interface Props {
  id: string
  fill: boolean
}

export default function Glob({ id, fill }: Props) {
  const glob = useSelector((s) => s.data.globs[id], deepCompare)
  const start = useSelector((s) => s.data.nodes[glob?.nodes[0]])
  const end = useSelector((s) => s.data.nodes[glob?.nodes[1]])

  const rOutline = useRegisteredElement<SVGPathElement>(id)

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
  // const rLeftPath = useRef<SVGPathElement>(null)
  // const rRightPath = useRef<SVGPathElement>(null)
  // const rMiddlePath = useRef<SVGPathElement>(null)

  // const MP = useTransform(mvPointer.world, (point) => {
  //   const path = rMiddlePath.current
  //   const left = rLeftPath.current
  //   const right = rRightPath.current

  //   if (!isSelected || !(path && left && right)) return null
  //   const { C0, r0, C1, r1, N0, N1, F0, F1, F0p, F1p } = glob.points
  //   // const PL = svg.getPointAtLength(left, t * left.getTotalLength())
  //   // const PR = svg.getPointAtLength(right, t * right.getTotalLength())
  //   // const N = vec.lrp(N0, vec.neg(N1), t)

  //   const { point: P } = closestPointOnPath(path, point)
  //   return P
  // })

  // const MP0 = useTransform(MP, (P) => {
  //   const { zoom } = state.data.camera
  //   if (!P) return ""
  //   return [svg.ellipse(P, zoom < 1 ? 3 : 3 / zoom)].join()
  // })

  if (!glob) return null

  let safe = !!glob.points
  let globPts = glob.points || rPrevPts.current

  rPrevPts.current = globPts

  const { D, Dp } = glob.options

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
    <g>
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
          <g opacity="0">
            {/* Middle Point / Path */}
            {/* <path
              ref={rMiddlePath}
              d={[
                svg.moveTo(C0),
                svg.bezierTo(vec.med(F0, F0p), vec.med(F1, F1p), C1),
              ].join()}
              stroke="black"
              fill="none"
              className="stroke-s hover-hidey"
              pointerEvents="none"
            />
            <path
              ref={rLeftPath}
              d={[svg.moveTo(E0), svg.bezierTo(F0, F1, E1)].join()}
              opacity="0"
              pointerEvents="none"
            />
            <path
              ref={rRightPath}
              d={[svg.moveTo(E0p), svg.bezierTo(F0p, F1p, E1p)].join()}
              opacity="0"
              pointerEvents="none"
            />
            <motion.path
              d={MP0}
              stroke="black"
              className="stroke-s hover-hidey"
              fill="black"
              cursor="pointer"
              onPointerDown={() =>
                state.send("SPLIT_GLOB", { id: glob.id, point: MP.get() })
              }
            /> */}
          </g>
          {/* <Combs id={glob.id} points={glob.points} /> */}
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
            {/* {glob.p0 && (
              <circle cx={glob.p0[0]} cy={glob.p0[1]} r={4} color="red" />
            )} */}
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
