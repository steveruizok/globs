import classNames from "classnames"
import { IGlob } from "lib/types"
import * as svg from "lib/svg"

export default function GlobNodeHints({ glob }: { glob: IGlob }) {
  if (!glob.points) return null

  return (
    <g
      pointerEvents="none"
      fill="none"
      className={classNames(["strokewidth-m", "dash-array-s", "stroke-hint"])}
    >
      <path
        d={[
          svg.arcTo(
            glob.points.C0,
            glob.points.r0,
            glob.points.E0,
            glob.points.E0p
          ),
          svg.arcTo(
            glob.points.C0,
            glob.points.r0,
            glob.points.E0p,
            glob.points.E0
          ),
        ].join(" ")}
      />
      <path
        d={[
          svg.arcTo(
            glob.points.C1,
            glob.points.r1,
            glob.points.E1,
            glob.points.E1p
          ),
          svg.arcTo(
            glob.points.C1,
            glob.points.r1,
            glob.points.E1p,
            glob.points.E1
          ),
        ].join(" ")}
      />
    </g>
  )
}
