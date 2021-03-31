import { IGlob } from "lib/types"
import * as vec from "lib/vec"
import * as svg from "lib/svg"
import {
  getBezierLineSegmentIntersections,
  getClosestPointOnPath,
  getCurvePoints,
} from "lib/utils"
import { bez2d } from "lib/bez"
import { mvPointer } from "lib/state"
import { useMemo, useRef } from "react"
import { motion, useTransform } from "framer-motion"
import classNames from "classnames"

interface Props {
  glob: IGlob
}

export default function CenterLine({ glob }: Props) {
  const rMiddlePath = useRef<SVGPathElement>(null)

  const { E0, E0p, E1, E1p, F0, F1, F0p, F1p } = glob.points

  // Calculate SVG path data for the glob's middle line
  const middlePath = useMemo(() => {
    const pts: number[][] = []

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

    return path.join(" ")
  }, [glob])

  // Find the neartest point on the middle path
  const mvNearestPointOnMiddlePath = useTransform(mvPointer.world, (point) => {
    const path = rMiddlePath.current
    if (!path) return null

    const result = getClosestPointOnPath(path, point)

    return result
  })

  // Find a circle that touches the glob's two curves
  const mvCircleOnMiddlePath = useTransform(
    mvNearestPointOnMiddlePath,
    (point) => {
      const middlePath = rMiddlePath.current
      if (!middlePath) return ""
      if (point === null) return ""

      const { x, y } = middlePath.getPointAtLength(
        middlePath.getTotalLength() * point.t - 0.005
      )

      const normal = vec.uni(vec.vec([x, y], point.point))

      // Left and right points of test line
      const lp = vec.sub(point.point, vec.mul(vec.per(normal), 10000))
      const rp = vec.add(point.point, vec.mul(vec.per(normal), 10000))

      const lIntersection = getBezierLineSegmentIntersections(
        E0,
        F0,
        F1,
        E1,
        lp,
        rp
      )

      const rIntersection = getBezierLineSegmentIntersections(
        E0p,
        F0p,
        F1p,
        E1p,
        lp,
        rp
      )

      // Left and right intersections, midpoint and radius of circle
      let l: number[], r: number[], mp: number[], radius: number

      if (lIntersection?.points?.[0]) {
        const { x, y } = lIntersection?.points?.[0]
        l = [x, y]
      }

      if (rIntersection?.points?.[0]) {
        const { x, y } = rIntersection?.points?.[0]
        r = [x, y]
      }

      if (l && r) {
        mp = vec.med(l, r)
        radius = vec.dist(l, r) / 2
      }

      return [l && r ? svg.ellipse(mp, radius) : ""].join(" ")
    }
  )

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
        d={mvCircleOnMiddlePath}
        className={classNames(["stroke-outline", "strokewidth-s"])}
        fill="none"
        cursor="pointer"
      />
    </>
  )
}
