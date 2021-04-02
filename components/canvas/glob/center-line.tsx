import { IGlob } from "lib/types"
import * as vec from "lib/vec"
import * as svg from "lib/svg"
import {
  angleDelta,
  getBezierLineSegmentIntersections,
  getClosestPointOnPath,
  getCurvePoints,
  getLineLineIntersection,
  projectPoint,
} from "lib/utils"
import {
  bez2d,
  getDistanceFromCurve,
  getCubicBezLength,
  getClosestPointOnCurve,
  getNormalOnCurve,
} from "lib/bez"
import state, { mvPointer } from "lib/state"
import { useMemo, useRef } from "react"
import { motion, useTransform } from "framer-motion"
import classNames from "classnames"

interface Props {
  glob: IGlob
}

export default function CenterLine({ glob }: Props) {
  const rMiddlePath = useRef<SVGPathElement>(null)

  const {
    E0,
    E0p,
    E1,
    E1p,
    F0,
    F1,
    F0p,
    F1p,
    N0,
    C0,
    r0,
    C1,
    r1,
    N1,
    D,
    Dp,
  } = glob.points

  // Calculate SVG path data for the glob's middle line
  const middlePath = useMemo(() => {
    const pts: number[][] = []

    // console.log(lenL, lenR)

    for (let i = 0; i < 21; i++) {
      const l = bez2d(E0, F0, F1, E1, i / 20) // left
      const lp = bez2d(E0p, F0p, F1p, E1p, i / 20) // right
      pts.push(vec.med(l, lp))
    }

    const curve = getCurvePoints(pts)

    const path: string[] = []

    path.push(svg.moveTo(curve[0]))

    for (let i = 1; i < curve.length - 3; i += 3) {
      path.push(svg.bezierTo(curve[i], curve[i + 1], curve[i + 2]))
    }

    path.push(svg.lineTo(C1))

    return path.join(" ")
  }, [glob])

  // Find the neartest point on the middle path
  const mvSplitCircle = useTransform(mvPointer.world, (point) => {
    if (!point) return ""

    const circle = getCircleInGlob(point, glob)

    if (!circle) {
      return ""
    }

    return svg.ellipse(circle.point, circle.radius)
  })

  // // Find the neartest point on the middle path
  // const mvSplitCircle = useTransform(mvPointer.world, (point) => {
  //   if (!point) return ""
  //   const { E0, E0p, E1, E1p, F0, F1, F0p, F1p } = glob.points

  //   // Points on curve
  //   const closestP = getClosestPointOnCurve(point, E0, F0, F1, E1)
  //   const closestPp = getClosestPointOnCurve(point, E0p, F0p, F1p, E1p)

  //   const P = closestP.point
  //   const Pp = closestPp.point

  //   // Normals
  //   const N = getNormalOnCurve(E0, F0, F1, E1, closestP.t)
  //   const Np = getNormalOnCurve(E0p, F0p, F1p, E1p, closestPp.t)
  //   const center = vec.med(N, Np)

  //   // Find the circle
  //   let C: number[], r: number

  //   // Find intersection between normals
  //   const intA = getLineLineIntersection(
  //     vec.sub(P, vec.mul(N, 1000000)),
  //     vec.add(P, vec.mul(N, 1000000)),
  //     vec.sub(Pp, vec.mul(Np, 1000000)),
  //     vec.add(Pp, vec.mul(Np, 1000000))
  //   )

  //   if (!intA) {
  //     C = vec.med(P, Pp)
  //     r = vec.dist(P, Pp) / 2
  //   } else {
  //     const L0 = vec.sub(P, vec.mul(vec.per(N), 10000000))
  //     const L1 = vec.add(P, vec.mul(vec.per(N), 10000000))

  //     // const L0p = vec.sub(Pp, vec.mul(vec.per(N), 10000000))
  //     // const L1p = vec.add(Pp, vec.mul(vec.per(N), 10000000))

  //     // Center intersection
  //     const intB = getLineLineIntersection(
  //       L0,
  //       L1,
  //       vec.sub(intA, vec.mul(center, 10000000)),
  //       vec.add(intA, vec.mul(center, 10000000))
  //     )

  //     if (!intB) {
  //       // If the lines are parallel, we won't have an intersection.
  //       // In this case, create a circle between the two points.
  //       C = vec.med(P, Pp)
  //       r = vec.dist(P, Pp) / 2
  //     } else {
  //       // Create a circle at the point of intersection. The distance
  //       // will be the same to either point.
  //       C = intB
  //       r = vec.dist(P, C)
  //     }

  //     if (vec.dist(point, C) > 32) {
  //       // Something has gone terribly wrong
  //       return ""
  //     }
  //   }

  //   // Find an intersection between E0->D and L0->inverted D
  //   const PL = [
  //     vec.sub(P, vec.mul(N, 10000000)),
  //     vec.add(P, vec.mul(N, 10000000)),
  //   ]

  //   const PLp = [
  //     vec.sub(Pp, vec.mul(Np, 10000000)),
  //     vec.add(Pp, vec.mul(Np, 10000000)),
  //   ]

  //   const D0 = getLineLineIntersection(PL[0], PL[1], E0, D)
  //   const D1 = getLineLineIntersection(PL[0], PL[1], E1, D)
  //   const D0p = getLineLineIntersection(PLp[0], PLp[1], E0p, Dp)
  //   const D1p = getLineLineIntersection(PLp[0], PLp[1], E1p, Dp)

  //   return [
  //     svg.ellipse(C, r),
  //     D0 && svg.ellipse(D0, 2),
  //     D1 && svg.ellipse(D1, 2),
  //     D0p && svg.ellipse(D0p, 2),
  //     D1p && svg.ellipse(D1p, 2),
  //     D0 && D1 && svg.line(E0, D0, P, D1, E1),
  //     D0p && D1p && svg.line(E0p, D0p, Pp, D1p, E1p),
  //   ]
  // })

  return (
    <>
      <path
        ref={rMiddlePath}
        d={middlePath}
        className={classNames([
          "dash-array-m",
          "strokewidth-s",
          "stroke-outline",
        ])}
        fill="none"
        cursor="pointer"
      />
      <motion.path
        d={mvSplitCircle}
        stroke="blue"
        fill="none"
        className="strokewidth-m"
        onPointerDown={() => state.send("SPLIT_GLOB", { id: glob.id })}
      />
    </>
  )
}

/**
 * Get a split point circle for a glob nearest to a given point.
 * @param point
 * @param glob
 * @returns
 */
function getCircleInGlob(point: number[], glob: IGlob) {
  const { E0, E0p, E1, E1p, F0, F1, F0p, F1p } = glob.points

  // Points on curve
  const P = getClosestPointOnCurve(point, E0, F0, F1, E1)
  const Pp = getClosestPointOnCurve(point, E0p, F0p, F1p, E1p)

  // Normals
  const N = getNormalOnCurve(E0, F0, F1, E1, P.t)
  const Np = getNormalOnCurve(E0p, F0p, F1p, E1p, Pp.t)
  const center = vec.med(N, Np)

  // Find intersection between normals
  const intA = getLineLineIntersection(
    vec.sub(P.point, vec.mul(N, 1000000)),
    vec.add(P.point, vec.mul(N, 1000000)),
    vec.sub(Pp.point, vec.mul(Np, 1000000)),
    vec.add(Pp.point, vec.mul(Np, 1000000))
  )

  let C: number[], r: number

  if (!intA) {
    C = vec.med(P.point, Pp.point)
    r = vec.dist(P.point, Pp.point) / 2
  } else {
    // Center intersection
    C = getLineLineIntersection(
      vec.sub(P.point, vec.mul(vec.per(N), 10000000)),
      vec.add(P.point, vec.mul(vec.per(N), 10000000)),
      vec.sub(intA, vec.mul(center, 10000000)),
      vec.add(intA, vec.mul(center, 10000000))
    )

    r = vec.dist(P.point, C)
  }

  if (vec.dist(point, C) > 16) {
    // Something has gone terribly wrong
    return false
  }

  return { point: C, radius: r }
}
