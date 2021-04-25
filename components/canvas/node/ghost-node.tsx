import { useTransform } from "framer-motion"
import classNames from "classnames"
import { useSelector, mvPointer } from "lib/state"
import * as svg from "lib/svg"
import { motion } from "framer-motion"

export default function GhostNode() {
  const fill = useSelector((s) => s.data.fill)

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
