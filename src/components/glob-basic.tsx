import * as svg from "../lib/svg"
import { lrp } from "../lib/vector"
import { getTangentPoint } from "../lib/utils"

// A basic "glob" shape

interface GlobProps {
  C0: number[]
  C1: number[]
  D: number[]
  DP: number[]
  a: number
  ap: number
  b: number
  bp: number
}

export default function Glob({
  C0 = [197, 124, 71],
  C1 = [89, 318, 33],
  D = [17, 223, 0],
  DP = [50, 220, 0],
  a = 0.5,
  ap = 0.5,
  b = 0.5,
  bp = 0.5
}: GlobProps) {
  const E0 = getTangentPoint(C0, D, 1),
    E1 = getTangentPoint(C1, D, -1),
    E0p = getTangentPoint(C0, DP, -1),
    E1p = getTangentPoint(C1, DP, 1),
    F0 = lrp(E0, D, a),
    F1 = lrp(E1, D, b),
    F0p = lrp(E0p, DP, ap),
    F1p = lrp(E1p, DP, bp)

  return (
    <path
      d={[
        svg.arcTo(C0, E0p, E0),
        svg.bezierTo(F0, F1, E1),
        svg.arcTo(C1, E1, E1p),
        svg.bezierTo(F1p, F0p, E0p)
      ].join(" ")}
    />
  )
}
