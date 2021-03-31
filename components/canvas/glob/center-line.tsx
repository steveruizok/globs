import { IGlob } from "lib/types"
import * as vec from "lib/vec"
import * as svg from "lib/svg"
import {
  getBezierLineSegmentIntersections,
  getClosestPointOnPath,
  getCurvePoints,
} from "lib/utils"
import { bez2d } from "lib/bez"
import state, { mvPointer } from "lib/state"
import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useMotionValue, useTransform } from "framer-motion"
import classNames from "classnames"

interface Props {
  glob: IGlob
}

export default function CenterLine({ glob }: Props) {
  const rLeftPath = useRef<SVGPathElement>(null)
  const rRightPath = useRef<SVGPathElement>(null)
  const rMiddlePath = useRef<SVGPathElement>(null)

  const {
    C0,
    C1,
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
  } = glob.points

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

  const mvNearestPointOnMiddlePath = useTransform(mvPointer.world, (point) => {
    const path = rMiddlePath.current
    if (!path) return null

    const result = getClosestPointOnPath(path, point)

    return result
  })

  // const tempPath = useTransform(mvNearestPointOnMiddlePath, (point) => {
  //   // @ts-ignore
  //   const { zoom } = state.data.camera
  //   // if (point === null || point.distance > 16) return ""
  //   if (point === null) return ""
  //   const middlePath = rMiddlePath.current
  //   if (!middlePath) return ""

  //   const { x, y } = middlePath.getPointAtLength(
  //     middlePath.getTotalLength() * point.t + 0.01
  //   )
  //   const n = vec.uni(vec.vec([x, y], point.point))
  //   const lp = vec.add(point.point, vec.mul(vec.per(n), 10000))
  //   const rp = vec.sub(point.point, vec.mul(vec.per(n), 10000))

  //   const lIntersection = getBezierLineSegmentIntersections(
  //     E0,
  //     F0,
  //     F1,
  //     E1,
  //     point.point,
  //     rp
  //   )

  //   const rIntersection = getBezierLineSegmentIntersections(
  //     E0p,
  //     F0p,
  //     F1p,
  //     E1p,
  //     point.point,
  //     lp
  //   )

  //   let l: number[], r: number[], mp: number[], radius: number

  //   if (lIntersection?.points?.[0]) {
  //     const { x, y } = lIntersection?.points?.[0]
  //     l = [x, y]
  //   }

  //   if (rIntersection?.points?.[0]) {
  //     const { x, y } = rIntersection?.points?.[0]
  //     r = [x, y]
  //   }

  //   if (l && r) {
  //     mp = vec.med(l, r)
  //     radius = vec.dist(l, r) / 2
  //   }

  //   return [
  //     svg.ellipse(l, zoom < 1 ? 4 : 4 / zoom),
  //     svg.ellipse(r, zoom < 1 ? 4 : 4 / zoom),
  //     //  l ? svg.ellipse(l, zoom < 1 ? 4 : 4 / zoom) : "",
  //     // svg.moveTo(lp),
  //     // svg.lineTo(rp),
  //     svg.ellipse(point.point, zoom < 1 ? 4 : 4 / zoom),
  //     //  l && r ? svg.ellipse(mp, radius) : "",
  //   ].join(" ")

  //   // const path: string[] = []

  //   // const pts: number[][] = []

  //   // for (let i = 0; i < 21; i++) {
  //   //   const l = bez2d(E0, F0, F1, E1, i / 20) // left
  //   //   const lp = bez2d(E0p, F0p, F1p, E1p, i / 20) // right
  //   //   pts.push(vec.med(l, lp))
  //   //   path.push(svg.moveTo(l), svg.lineTo(lp), svg.ellipse(vec.med(l, lp), 3))
  //   // }

  //   // for (let i = 0; i < 21; i++) {
  //   //   const l = bez2d(E0, F0, F1, E1, i / 20) // left
  //   //   const lp = bez2d(E0p, F0p, F1p, E1p, i / 20) // right
  //   //   pts.push(vec.med(l, lp))
  //   // }

  //   // const curve = getCurvePoints(pts)

  //   // return path.join(" ")
  // })

  const mvSplitControl = useTransform(
    // @ts-ignore
    mvNearestPointOnMiddlePath,
    (point) => {
      const { zoom } = state.data.camera
      // if (point === null || point.distance > 16) return ""
      if (point === null) return ""
      const middlePath = rMiddlePath.current
      if (!middlePath) return ""

      const { x, y } = middlePath.getPointAtLength(
        middlePath.getTotalLength() * point.t + 0.005
      )
      const n = vec.uni(vec.vec([x, y], point.point))
      const lp = vec.add(point.point, vec.mul(vec.per(n), 10000))
      const rp = vec.sub(point.point, vec.mul(vec.per(n), 10000))

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
        ref={rLeftPath}
        d={[svg.moveTo(E0), svg.bezierTo(F0, F1, E1)].join()}
        opacity="0"
        fill="none"
        pointerEvents="none"
      />
      <path
        ref={rRightPath}
        d={[svg.moveTo(E0p), svg.bezierTo(F0p, F1p, E1p)].join()}
        opacity="0"
        fill="none"
        pointerEvents="none"
      />
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
        d={mvSplitControl}
        className={classNames(["stroke-outline", "strokewidth-s"])}
        fill="none"
        cursor="pointer"
      />
    </>
  )
}
