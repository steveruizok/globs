import { IGlob } from "lib/types"
import * as vec from "lib/vec"
import * as svg from "lib/svg"
import { getCurvePoints, getCircleInGlob } from "lib/utils"
import { bez2d } from "lib/bez"
import state, { useSelector, mvPointer } from "lib/state"
import { useMemo, useRef } from "react"
import { motion, useTransform } from "framer-motion"
import classNames from "classnames"

interface Props {
  glob: IGlob
}

export default function CenterLine({ glob }: Props) {
  const rMiddlePath = useRef<SVGPathElement>(null)

  const isSplitting = useSelector((state) => state.isIn("splittingGlob"))

  const { E0, E0p, E1, E1p, F0, F1, F0p, F1p, C1 } = glob.points

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

    path.push(svg.lineTo(C1))

    return path.join(" ")
  }, [glob])

  // Find the neartest point on the middle path
  const mvSplitCircle = useTransform(mvPointer.world, (point) => {
    if (!point) return ""
    const circle = getCircleInGlob(point, glob)
    if (!circle) return ""
    return svg.ellipse(circle.point, circle.radius)
  })

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
        pointerEvents="none"
      />
      {isSplitting && (
        <motion.path
          d={mvSplitCircle}
          stroke="blue"
          fill="none"
          className="strokewidth-m stroke-outline"
          onPointerDown={() => state.send("SPLIT_GLOB", { id: glob.id })}
        />
      )}
    </>
  )
}
