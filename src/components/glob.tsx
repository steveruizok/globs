import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { useStableDashOffset } from "../hooks/useStableDashOffset"
import { useStateDesigner } from "@state-designer/react"

import * as Vec from "../lib/vector"
import * as svg from "../lib/svg"
import { getGlob } from "../lib/getGlob"
import {
  angleDelta,
  getClosestPointOnCircle,
  getArcLength,
  radiansToDegrees
} from "../lib/utils"

import Handle from "./handle"

// Each of these globs maintains its own state using a state machine
// and saves its own data to local storage. It will display its handles
// when selected or when not filled, both of which come from props.
// It only talks to the global state (via the `onSelect` callback)
// when clicked.

function getArcDashOffset(A: number[], B: number[], C: number[], step: number) {
  const del0 = angleDelta(Vec.angle(C, A), Vec.angle(C, B))
  const len0 = getArcLength(A, B, C)
  const off0 = del0 < 0 ? len0 : 2 * Math.PI * C[2] - len0
  return -off0 / 2 + step
}

function getEllipseDashOffset(A: number[], step: number) {
  const c = 2 * Math.PI * A[2]
  return -c / 2 + -step
}

// For snapping. Hey, I just don't want to put this in state, ok?

function setSnapPoints(id: string | number, C0: number[], C1: number[]) {
  const saved = localStorage.getItem("globs_snap_points")

  localStorage.setItem(
    "globs_snap_points",
    JSON.stringify(
      saved ? { ...JSON.parse(saved), [id]: [C0, C1] } : { [id]: [C0, C1] }
    )
  )
}

function getSnapPoints(id: string | number) {
  const saved = localStorage.getItem("globs_snap_points")
  if (saved === null) return []
  const data = JSON.parse(saved)
  delete data[id]
  return Object.values(data).flat() as number[][]
}

// For deltas on multi-touch

let prevCenter = [0, 0]
let prevDist = 0

// Initial data, offset and rotated by props
const raw = {
  C0: [197, 124, 71],
  C1: [89, 318, 33],
  D: [17, 223, 0],
  DP: [50, 220, 0],
  a: 0.5,
  ap: 0.5,
  b: 0.5,
  bp: 0.5,
  c: 0.5,
  cp: 0.5,
  startCap: "round",
  endCap: "round"
}

function getInitialData(x = 0, y = 0, rot = 0) {
  let C0 = Vec.add(raw.C0, [x, y]),
    C1 = Vec.add(raw.C1, [x, y]),
    mp = Vec.med(C0, C1)

  return {
    ...raw,
    C0: Vec.rotWith(C0, mp, rot),
    C1: Vec.rotWith(C1, mp, rot),
    D: Vec.rotWith(Vec.add(raw.D, [x, y]), mp, rot),
    DP: Vec.rotWith(Vec.add(raw.DP, [x, y]), mp, rot)
  }
}

interface GlobProps {
  x?: number
  y?: number
  rotate: number
  id?: string | number
  fill?: boolean
  reset?: number
  isSelected?: boolean
  onSelect?: (id: string | number) => void
}

export default function Glob({
  x = 0,
  y = 0,
  rotate = 0,
  id = "glob",
  fill = false,
  isSelected = false,
  reset = 0,
  onSelect = () => {}
}: GlobProps) {
  const initialData = useMemo(() => getInitialData(x, y, rotate), [
    x,
    y,
    rotate
  ])

  const local = useStateDesigner({
    data: initialData,
    on: {
      RESET: "reset",
      LOADED: "loadData"
    },
    initial: isSelected ? "selected" : "notSelected",
    states: {
      notSelected: {
        on: {
          SELECTED: { to: "selected" }
        }
      },
      selected: {
        on: {
          DESELECTED: {
            do: "saveSnapPoints",
            to: "notSelected"
          }
        },
        initial: "normal",
        states: {
          normal: {
            on: {
              TOUCH_DRAGGED: {
                to: "multiTouchDragging"
              },
              DRAGGED: { if: "hasShift", do: "moveAll" },
              DRAGGED_HANDLE: {
                if: "hasShift",
                do: "dragBothHandles",
                else: "dragHandle"
              },
              DRAGGED_ANCHOR: {
                if: "hasShift",
                do: "moveAll",
                else: "dragAnchor"
              },
              DRAGGED_RADIUS: {
                if: "hasShift",
                do: "moveAll",
                else: "dragRadius"
              },
              DRAGGED_CENTER: {
                if: "hasShift",
                do: "moveAll",
                else: "dragCenter"
              },
              TOGGLED_CAP: {
                do: "toggleCap"
              }
            }
          },
          multiTouchDragging: {
            onEnter: "startMultiTouchDrag",
            on: {
              TOUCH_DRAGGED: "multiTouchDrag",
              STOPPED_TOUCHING: { to: "normal" }
            }
          }
        }
      }
    },
    conditions: {
      hasShift(d, p) {
        return !!p.shift
      }
    },
    actions: {
      reset(d) {
        Object.assign(d, initialData)
      },
      loadData(d, p: Partial<typeof d>) {
        Object.assign(d, p)
      },
      saveSnapPoints(d) {
        setSnapPoints(id, [...d.C0], [...d.C1])
      },
      moveAll(d, p: { delta: number[] }) {
        for (let pt of [d.C0, d.C1, d.D, d.DP]) {
          pt[0] += p.delta[0]
          pt[1] += p.delta[1]
        }
      },
      startMultiTouchDrag(d, p: number[][]) {
        const [p0, p1] = p
        const center = Vec.med(p0, p1)
        prevCenter = center
        prevDist = Vec.dist(p0, p1)
      },
      multiTouchDrag(d, p: number[][]) {
        const [p0, p1] = p
        const mp = Vec.med(p0, p1)

        // Scale delta
        const dist = Vec.dist(p0, p1)
        const scaleDelta = dist / prevDist

        // Position delta
        const center = Vec.med(p0, p1)
        const posDelta = Vec.sub(center, prevCenter)

        // Scale and offset all main points
        for (let pt of [d.C0, d.C1, d.D, d.DP]) {
          const next = Vec.lrp(mp, Vec.add(pt, posDelta), scaleDelta)
          pt[0] = next[0]
          pt[1] = next[1]
        }

        prevCenter = center
        prevDist = dist
      },
      dragBothHandles(d, p: { delta: number[] }) {
        const targs = [d.D, d.DP]
        for (let targ of targs) {
          let next = Vec.add(targ, p.delta)

          const d0 = Vec.dist(next, d.C0)
          const d1 = Vec.dist(next, d.C1)

          if (d0 < d.C0[2]) {
            next = getClosestPointOnCircle(d.C0, next, 1)
          } else if (d1 < d.C1[2]) {
            next = getClosestPointOnCircle(d.C1, next, 1)
          }

          targ[0] = next[0]
          targ[1] = next[1]
        }
      },
      dragHandle(d, p: { target: "D" | "DP"; delta: number[] }) {
        const targ = d[p.target]
        let next = Vec.add(targ, p.delta)

        const d0 = Vec.dist(next, d.C0)
        const d1 = Vec.dist(next, d.C1)

        if (d0 < d.C0[2]) {
          next = getClosestPointOnCircle(d.C0, next, 1)
        } else if (d1 < d.C1[2]) {
          next = getClosestPointOnCircle(d.C1, next, 1)
        }

        targ[0] = next[0]
        targ[1] = next[1]
      },
      dragAnchor(
        d,
        p: {
          target: string
          pt: number[]
          min: number[]
          max: number[]
          delta: number[]
        }
      ) {
        const next = Vec.add(p.pt, p.delta)
        const distA = Vec.dist(p.min, p.max)
        const distB = Vec.dist(next, p.min)
        d[p.target] = Math.min(1, Math.max(0, distB / distA))
      },
      dragRadius(
        d,
        p: {
          target: string
          pt: number[]
          delta: number[]
        }
      ) {
        const targ = d[p.target]
        const next = Vec.add(p.pt, p.delta)
        const newr = Vec.dist(next, targ)
        const maxr = Vec.dist(d.C0, d.C1)

        if (p.target === "C0") {
          if (d.C1[2] + newr > maxr) {
            return
          }
        } else {
          if (d.C0[2] + newr > maxr) {
            return
          }
        }

        targ[2] = Vec.dist(next, targ)
      },
      dragCenter(
        d,
        p: {
          target: string
          delta: number[]
        }
      ) {
        const targ = d[p.target]
        let next = Vec.add(targ, p.delta)

        const r = d.C0[2] + d.C1[2]

        const snapPoints = getSnapPoints(id)

        for (let snapPoint of snapPoints) {
          if (!Vec.isEqual(targ, snapPoint) && Vec.dist(next, snapPoint) < 4) {
            next = [...snapPoint]
          }
        }

        if (Vec.dist(next, d.D) <= targ[2]) {
          d.D = getClosestPointOnCircle(next, d.D, 1)
        }

        if (Vec.dist(next, d.DP) <= targ[2]) {
          d.DP = getClosestPointOnCircle(next, d.DP, 1)
        }

        if (p.target === "C0" && Vec.dist(next, d.C1) < r) {
          return
        } else if (p.target === "C1" && Vec.dist(next, d.C0) < r) {
          return
        }

        targ[0] = next[0]
        targ[1] = next[1]
      },
      toggleCap(d, p) {
        if (p.target === "C0") {
          d.startCap = d.startCap === "round" ? "flat" : "round"
        } else {
          d.endCap = d.endCap === "round" ? "flat" : "round"
        }
      }
    },
    values: {
      glob(data) {
        const { C0, C1, D, DP, a, ap, b, bp } = data
        try {
          return getGlob(C0, C1, D, DP, a, ap, b, bp)
        } catch (e) {
          return ""
        }
      }
    }
  })

  const { send } = local

  // Select or deselect when isSelected prop changes
  useEffect(() => {
    if (isSelected) {
      send("SELECTED")
    } else {
      send("DESELECTED")
    }
  }, [send, isSelected])

  // Reset when reset prop changes
  useEffect(() => {
    send("RESET")
    setSnapPoints(id, local.data.C0, local.data.C1)
  }, [send, reset])

  // Load / save local storage
  useEffect(() => {
    const data = localStorage.getItem(`glob_data_${id}`)
    if (data !== null) {
      send("LOADED", JSON.parse(data))
      setSnapPoints(id, local.data.C0, local.data.C1)
    }

    return local.onUpdate((d) => {
      localStorage.setItem(`glob_data_${id}`, JSON.stringify(d.data))
    })
  }, [])

  const { C0, C1, D, DP, startCap, endCap } = local.data
  const { glob } = local.values

  const showTools = local.isIn("selected") || !fill

  // Middle path dash offset (no easy way here)
  const rMiddlePath = useStableDashOffset()

  // For now, if you lose your glob this will reset it.
  if (!glob) {
    console.log("Resetting glob ", id)
    send("RESET")
    return null
  }

  const G0 = Vec.sub(C0, Vec.mul(glob.n0, C0[2]))
  const G1 = Vec.sub(C1, Vec.mul(glob.n1, C1[2]))
  const cp0 = Vec.med(glob.F0, glob.F0p)
  const cp1 = Vec.med(glob.F1, glob.F1p)

  return (
    <motion.g
      stroke="#000"
      strokeWidth={2}
      fill="transparent"
      onPointerDown={() => onSelect(id)}
      onTouchMove={(e) => {
        if (e.touches.length > 1) {
          const p0 = [e.touches[0].pageX, e.touches[0].pageY],
            p1 = [e.touches[1].pageX, e.touches[1].pageY]

          const mp = Vec.med(p0, p1)

          if (Vec.isEqual(mp, prevCenter)) return

          local.send("TOUCH_DRAGGED", [p0, p1])
        }
      }}
      onTouchEnd={() => local.send("STOPPED_TOUCHING")}
    >
      {/* A mask for the middle path / two circles */}
      <defs>
        <mask id={`mask${id}`}>
          <use href="#mask_flat" fill="Black" />
          <circle cx={C0[0]} cy={C0[1]} r={C0[2]} fill="black" />
          <circle cx={C1[0]} cy={C1[1]} r={C1[2]} fill="black" />
        </mask>
      </defs>
      {/* Glob outline */}
      <motion.path
        onPan={(e, { delta: { x, y } }) => {
          send("DRAGGED", { delta: [x, y], shift: e.shiftKey })
        }}
        d={[
          startCap === "round"
            ? svg.arcTo(C0, glob.E0p, glob.E0)
            : [svg.moveTo(glob.E0p), svg.lineTo(glob.E0)],
          svg.bezierTo(glob.F0, glob.F1, glob.E1),
          endCap === "round"
            ? svg.arcTo(C1, glob.E1, glob.E1p)
            : svg.lineTo(glob.E1p),
          svg.bezierTo(glob.F1p, glob.F0p, glob.E0p)
        ].join(" ")}
        fill={fill ? "black" : "rgba(255, 255, 255, .9)"}
      />
      {showTools && (
        <g>
          {isSelected && (
            <g strokeDasharray="5, 5">
              {/* Middle Path */}
              <path
                ref={rMiddlePath}
                mask={`url(#mask${id})`}
                strokeDashoffset={0}
                d={[svg.moveTo(C0), svg.bezierTo(cp0, cp1, C1)].join(" ")}
              />
              {/* Inner Arcs */}
              {startCap === "round" ? (
                <path
                  d={[svg.arcTo(C0, glob.E0, glob.E0p)].join(" ")}
                  strokeDashoffset={getArcDashOffset(glob.E0, glob.E0p, C0, 5)}
                />
              ) : (
                <path
                  d={[svg.ellipse(C0)].join(" ")}
                  transform={`rotate(${radiansToDegrees(Vec.angle(G0, C0))}, ${
                    C0[0]
                  }, ${C0[1]})`}
                  strokeDashoffset={getEllipseDashOffset(C0, 5)}
                />
              )}
              {endCap === "round" ? (
                <path
                  d={[svg.arcTo(C1, glob.E1p, glob.E1)].join(" ")}
                  strokeDashoffset={getArcDashOffset(glob.E1p, glob.E1, C1, 5)}
                />
              ) : (
                <path
                  d={[svg.ellipse(C1)].join(" ")}
                  transform={`rotate(${radiansToDegrees(Vec.angle(G1, C1))}, ${
                    C1[0]
                  }, ${C1[1]})`}
                  strokeDashoffset={getEllipseDashOffset(C1, 5)}
                />
              )}
            </g>
          )}
          <path
            stroke="dodgerBlue"
            opacity=".5"
            strokeDasharray="5, 5"
            d={[svg.moveTo(glob.E0), svg.lineTo(D), svg.lineTo(glob.E1)].join(
              " "
            )}
          />
          <path
            stroke="orange"
            opacity=".5"
            strokeDasharray="5, 5"
            d={[
              svg.moveTo(glob.E0p),
              svg.lineTo(DP),
              svg.lineTo(glob.E1p)
            ].join(" ")}
          />
          {/* Secondary Handles */}
          <Handle
            x={glob.F0[0]}
            y={glob.F0[1]}
            color="dodgerblue"
            onDrag={(delta) =>
              send("DRAGGED_ANCHOR", {
                target: "a",
                pt: glob.F0,
                min: glob.E0,
                max: D,
                delta
              })
            }
          />
          <Handle
            x={glob.F1[0]}
            y={glob.F1[1]}
            color="dodgerblue"
            onDrag={(delta) =>
              send("DRAGGED_ANCHOR", {
                target: "b",
                pt: glob.F1,
                min: glob.E1,
                max: D,
                delta
              })
            }
          />
          <Handle
            x={glob.F0p[0]}
            y={glob.F0p[1]}
            color="orange"
            onDrag={(delta) => {
              send("DRAGGED_ANCHOR", {
                target: "ap",
                pt: glob.F0p,
                min: glob.E0p,
                max: DP,
                delta
              })
            }}
          />
          <Handle
            x={glob.F1p[0]}
            y={glob.F1p[1]}
            color="orange"
            onDrag={(delta) =>
              send("DRAGGED_ANCHOR", {
                target: "bp",
                pt: glob.F1p,
                min: glob.E1p,
                max: DP,
                delta
              })
            }
          />
          {/* Circles */}
          <motion.circle
            cursor="grab"
            cx={C0[0]}
            cy={C0[1]}
            r={C0[2]}
            stroke="transparent"
            onDoubleClick={() => send("TOGGLED_CAP", { target: "C0" })}
            onPan={(e, { delta: { x, y } }) =>
              send("DRAGGED_CENTER", {
                target: "C0",
                delta: [x, y],
                shift: e.shiftKey
              })
            }
          />
          <motion.circle
            cursor="grab"
            cx={C1[0]}
            cy={C1[1]}
            r={C1[2]}
            stroke="transparent"
            onDoubleClick={() => send("TOGGLED_CAP", { target: "C1" })}
            onPan={(e, { delta: { x, y } }) =>
              send("DRAGGED_CENTER", {
                target: "C1",
                delta: [x, y],
                shift: e.shiftKey
              })
            }
          />
          {/* Primary Handles */}
          <Handle
            x={D[0]}
            y={D[1]}
            fill="dodgerblue"
            onDrag={(delta, shift) =>
              send("DRAGGED_HANDLE", { target: "D", delta, shift })
            }
          />
          <Handle
            x={DP[0]}
            y={DP[1]}
            fill="orange"
            onDrag={(delta, shift) =>
              send("DRAGGED_HANDLE", { target: "DP", delta, shift })
            }
          />
          {/* Radius */}
          <Handle
            x={G0[0]}
            y={G0[1]}
            fill="white"
            cursor="grab"
            onDrag={(delta, shift) =>
              send("DRAGGED_RADIUS", {
                target: "C0",
                pt: G0,
                delta,
                shift
              })
            }
          />
          <Handle
            x={G1[0]}
            y={G1[1]}
            fill="white"
            cursor="grab"
            onDrag={(delta, shift) =>
              send("DRAGGED_RADIUS", {
                target: "C1",
                pt: G1,
                delta,
                shift
              })
            }
          />
        </g>
      )}
    </motion.g>
  )
}
