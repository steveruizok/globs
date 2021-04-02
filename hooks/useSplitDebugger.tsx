import * as vec from "lib/vec"
import * as svg from "lib/svg"
import { useTransform } from "framer-motion"
import { mvPointer } from "lib/state"
import { IGlob, IGlobPoints } from "lib/types"
import { getGlob, getGlobOutline, getLineLineIntersection } from "lib/utils"
import { getNormalOnCurve, getClosestPointOnCurve } from "lib/bez"

export default function useSplitDebugger(glob: IGlob) {
  // Find the neartest point on the middle path
  return useTransform(mvPointer.world, (point) => {
    if (!point) return ""

    const {
      C0,
      C1,
      r0,
      r1,
      D,
      Dp,
      E0,
      E0p,
      E1,
      E1p,
      F0,
      F1,
      F0p,
      F1p,
    } = glob.points

    // Points on curve
    const closestP = getClosestPointOnCurve(point, E0, F0, F1, E1)
    const closestPp = getClosestPointOnCurve(point, E0p, F0p, F1p, E1p)

    const P = closestP.point
    const Pp = closestPp.point

    // Normals
    const N = getNormalOnCurve(E0, F0, F1, E1, closestP.t)
    const Np = getNormalOnCurve(E0p, F0p, F1p, E1p, closestPp.t)
    const center = vec.med(N, Np)

    // Find the circle
    let C: number[], r: number

    // Find intersection between normals
    const intA = getLineLineIntersection(
      vec.sub(P, vec.mul(N, 1000000)),
      vec.add(P, vec.mul(N, 1000000)),
      vec.sub(Pp, vec.mul(Np, 1000000)),
      vec.add(Pp, vec.mul(Np, 1000000))
    )

    if (!intA) {
      C = vec.med(P, Pp)
      r = vec.dist(P, Pp) / 2
    } else {
      const L0 = vec.sub(P, vec.mul(vec.per(N), 10000000))
      const L1 = vec.add(P, vec.mul(vec.per(N), 10000000))

      // Center intersection
      const intB = getLineLineIntersection(
        L0,
        L1,
        vec.sub(intA, vec.mul(center, 10000000)),
        vec.add(intA, vec.mul(center, 10000000))
      )

      if (!intB) {
        // If the lines are parallel, we won't have an intersection.
        // In this case, create a circle between the two points.
        C = vec.med(P, Pp)
        r = vec.dist(P, Pp) / 2
      } else {
        // Create a circle at the point of intersection. The distance
        // will be the same to either point.
        C = intB
        r = vec.dist(P, C)
      }

      if (vec.dist(point, C) > 32) {
        // Something has gone terribly wrong
        return ""
      }
    }

    // Find an intersection between E0->D and L0->inverted D
    const PL = [
      vec.sub(P, vec.mul(N, 10000000)),
      vec.add(P, vec.mul(N, 10000000)),
    ]

    const PLp = [
      vec.sub(Pp, vec.mul(Np, 10000000)),
      vec.add(Pp, vec.mul(Np, 10000000)),
    ]

    const D0 = getLineLineIntersection(PL[0], PL[1], E0, D)
    const D1 = getLineLineIntersection(PL[0], PL[1], E1, D)
    const D0p = getLineLineIntersection(PLp[0], PLp[1], E0p, Dp)
    const D1p = getLineLineIntersection(PLp[0], PLp[1], E1p, Dp)

    if (!(D0 && D1 && D0p && D1p)) return ""

    // The radio of distances between old and new handles
    const d0 = vec.dist(E0, D0) / vec.dist(E0, D)
    const d0p = vec.dist(E0p, D0p) / vec.dist(E0p, Dp)
    const d1 = vec.dist(E1, D1) / vec.dist(E1, D)
    const d1p = vec.dist(E1p, D1p) / vec.dist(E1p, Dp)

    // Not sure why this part works
    const t0 = 0.75 - d0 * 0.25
    const t0p = 0.75 - d0p * 0.25
    const t1 = 0.75 - d1 * 0.25
    const t1p = 0.75 - d1p * 0.25

    const a0 = t0,
      b0 = t0,
      a0p = t0p,
      b0p = t0p,
      a1 = t1,
      b1 = t1,
      a1p = t1p,
      b1p = t1p

    // Create the new globs

    let newGlobA: IGlobPoints,
      newOutlineA = "",
      newGlobB: IGlobPoints,
      newOutlineB = ""

    try {
      newGlobA = getGlob(C0, r0, C, r, D0, D0p, a0, b0, a0p, b0p)
      newGlobB = getGlob(C, r, C1, r1, D1, D1p, a1, b1, a1p, b1p)
      newOutlineA = getGlobOutline(newGlobA)
      newOutlineB = getGlobOutline(newGlobB)
    } catch (e) {
      return ""
    }

    return [
      svg.ellipse(C, r),
      D0 && svg.ellipse(D0, 2),
      D0p && svg.ellipse(D0p, 2),
      D1 && svg.ellipse(D1, 2),
      D1p && svg.ellipse(D1p, 2),
      svg.ellipse(vec.lrp(E0, D0, a0), 1),
      svg.ellipse(vec.lrp(E0p, D0p, a0p), 1),
      svg.ellipse(vec.lrp(P, D0, b0), 1),
      svg.ellipse(vec.lrp(Pp, D0p, b0p), 1),
      svg.ellipse(vec.lrp(E1, D1, a0), 1),
      svg.ellipse(vec.lrp(E1p, D1p, a0p), 1),
      svg.ellipse(vec.lrp(newGlobB.E0, D1, b1), 1),
      svg.ellipse(vec.lrp(newGlobB.E0p, D1p, b1p), 1),
      D0 && svg.line(E0, D0, newGlobA.E1),
      D0p && svg.line(E0p, D0p, newGlobA.E1p),
      D0 && svg.line(E1, D1, newGlobB.E0),
      D0p && svg.line(E1p, D1p, newGlobB.E0p),
      newOutlineA,
      newOutlineB,
    ]
  })
}
