import classNames from "classnames"
import { IGlob } from "lib/types"
import * as svg from "lib/svg"

export default function GlobNodeHints({ glob }: { glob: IGlob }) {
  if (!glob.points) return null

  const { C0, r0, E0, E0p, C1, r1, E1, E1p } = glob.points

  return (
    <g
      pointerEvents="none"
      fill="none"
      className={classNames(["strokewidth-m", "dash-array-s", "stroke-hint"])}
    >
      <circle cx={C0[0]} cy={C0[1]} r={r0} />
      <circle cx={C1[0]} cy={C1[1]} r={r1} />
      {/* <path
        d={[svg.arcTo(C0, r0, E0, E0p), svg.arcTo(C0, r0, E0p, E0)].join(" ")}
      />
      <path
        d={[svg.arcTo(C1, r1, E1, E1p), svg.arcTo(C1, r1, E1p, E1)].join(" ")}
      /> */}
    </g>
  )
}
