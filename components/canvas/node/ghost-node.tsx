import { useTransform } from "framer-motion"
import classNames from "classnames"
import state, { useSelector, mvPointer } from "lib/state"
import * as svg from "lib/svg"
import * as vec from "lib/vec"
import { motion } from "framer-motion"
import { useMemo } from "react"
import inputs from "lib/inputs"

export default function GhostNode() {
  const fill = useSelector((s) => s.data.fill)

  // const selectedNodes = useSelector((s) => s.data.selectedNodes)
  // const isGlobbing = useSelector((s) => s.isIn("globbingNodes"))

  // const snaplines = useMemo(() => {
  //   if (!isGlobbing) return []

  //   let snaps: number[][][] = []

  //   for (const nodeId in selectedNodes) {
  //     const node = state.data.nodes[nodeId]

  //     snaps.push(
  //       [vec.add(node.point, [-100000, 0]), vec.add(node.point, [100000, 0])],
  //       [vec.add(node.point, [0, -100000]), vec.add(node.point, [0, 100000])]
  //     )
  //   }

  //   return snaps
  // }, [selectedNodes])

  const path = useTransform(mvPointer.world, (point) => {
    return svg.ellipse(point, 25)
  })

  return (
    <motion.path
      d={path}
      data-bp-desktop={true}
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
