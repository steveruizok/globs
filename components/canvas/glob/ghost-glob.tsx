import { useTransform } from "framer-motion"
import classNames from "classnames"
import state, { useSelector, mvPointer } from "lib/state"
import * as vec from "lib/vec"
import * as svg from "lib/svg"
import { motion } from "framer-motion"
import { getGlob, getGlobOutline, getOuterTangents } from "lib/utils"
import inputs from "lib/inputs"

export default function GhostBranchGlob() {
  const fill = useSelector((s) => s.data.fill)
  const path = useTransform(mvPointer.world, (point) => {
    const { selectedNodes, nodes } = state.data

    if (selectedNodes.length === 0) return null

    const selected = selectedNodes.map((id) => nodes[id])

    const pt = point

    // if (inputs.modifiers.shiftKey) {
    //   let d: number, dd: number

    //   let snaps: number[][] = []

    //   for (const node of selected) {
    //     const py = vec.nearestPointOnLineThroughPoint(node.point, [0, 1], pt)
    //     const px = vec.nearestPointOnLineSegment(node.point, [1, 0], pt)

    //     pt = vec.dist(py, pt) < vec.dist(px, pt) ? py : px
    //   }
    // }

    const avgRadius = selected.reduce(
      (a, c) => (c.radius + a) / 2,
      selected[0].radius
    )

    const ghost = { point: pt, radius: avgRadius }

    const commands: string[] = [svg.ellipse(ghost.point, ghost.radius)]

    for (const id of selectedNodes) {
      const node = nodes[id]

      const { point: C0, radius: r0 } = node
      const { point: C1, radius: r1 } = ghost

      const [E0, E1, E0p, E1p] = getOuterTangents(C0, r0, C1, r1)

      const D = vec.med(E0, E1),
        Dp = vec.med(E0p, E1p),
        a = 0.5,
        b = 0.5,
        ap = 0.5,
        bp = 0.5

      // Don't try to ghost glob between two points
      if (vec.isEqual(C0, C1)) continue

      const glob = getGlob(C0, r0, C1, r1, D, Dp, a, b, ap, bp)
      const outline = getGlobOutline(glob)
      commands.push(outline)
    }

    return commands.join(" ")
  })

  return (
    <motion.path
      data-bp-desktop={true}
      d={path}
      className={classNames([
        "strokewidth-m",
        {
          "fill-flat": fill,
          "fill-soft": !fill,
          "stroke-none": fill,
          "stroke-outline": true,
        },
      ])}
      opacity={0.5}
      pointerEvents="none"
    />
  )
}
