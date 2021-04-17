import { IGlobPoints } from "lib/types"
import * as svg from "lib/svg"
import * as vec from "lib/vec"
import { modulate } from "utils"
import { useEffect, useState, useRef } from "react"

export default function Combs({ points }: { points: IGlobPoints }) {
  // Show normal points along line
  const [skeletonPts, setSkeletonPts] = useState<number[][][]>([])
  const rLeftPath = useRef<SVGPathElement>(null)
  const rRightPath = useRef<SVGPathElement>(null)

  useEffect(() => {
    const left = rLeftPath.current
    const right = rRightPath.current

    if (!(left && right) && skeletonPts.length) {
      setSkeletonPts([])
      return
    }

    const lenL = left.getTotalLength()
    const lenR = right.getTotalLength()

    const pts: number[][][] = []
    const steps = 20, // Math.max(lenL, lenR) / 32,
      step = 1 / steps

    for (let t = 0; t <= 1; t += step) {
      const ptL = left.getPointAtLength(t * lenL)
      const ptR = right.getPointAtLength(t * lenR)
      const pt0 = [ptL.x, ptL.y],
        pt1 = [ptR.x, ptR.y]

      pts.push([pt0, vec.med(pt0, pt1), pt1])
    }

    // Generate path?
    // const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
    // const d = [
    //   svg.moveTo(pts[0][2]),
    //   ...pts.slice(1).map((pt) => svg.lineTo(pt[2])),
    // ].join(" ")
    // path.setAttribute("d", d)
    // state.send("MOUNTED_CENTER_PATH", { id, path })

    setSkeletonPts(pts)
  }, [points])

  const { E0, F0, F1, E1, E0p, F0p, F1p, E1p } = points

  return (
    <g pointerEvents="none">
      <path
        ref={rLeftPath}
        d={[svg.moveTo(E0), svg.bezierTo(F0, F1, E1)].join()}
        opacity="0"
      />
      <path
        ref={rRightPath}
        d={[svg.moveTo(E0p), svg.bezierTo(F0p, F1p, E1p)].join()}
        opacity="0"
      />
      {skeletonPts.map(([p0, m, p1], i) => (
        <line
          key={i}
          x1={p0[0]}
          y1={p0[1]}
          x2={p1[0]}
          y2={p1[1]}
          className="strokewidth-s"
          stroke={getNormalColor(m)}
        />
      ))}
      <polyline
        points={skeletonPts.map((p) => p[1]).join(" ")}
        opacity={0.5}
        className="strokewidth-s"
        stroke="red"
        fill="transparent"
      />
    </g>
  )
}

export function getNormalColor(A: number[]) {
  const n = vec.normalize(A)

  return `rgb(${modulate(n[0], [-1, 1], [0, 255])}, ${modulate(
    n[1],
    [-1, 1],
    [0, 255]
  )}, 255)`
}
