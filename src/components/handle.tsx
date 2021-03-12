import { motion } from "framer-motion"

export default function Handle({
  x = 0,
  y = 0,
  color = "black",
  fill = "rgba(255, 255, 255, .2",
  onDrag = (_: number[], __: boolean) => {},
  cursor = "grab"
}) {
  return (
    <g>
      <motion.circle cx={x} cy={y} r={5} stroke={color} fill={fill} />
      <motion.circle
        cx={x}
        cy={y}
        r={window.innerWidth < 600 ? 20 : 16}
        cursor={cursor}
        stroke="transparent"
        fill="transparent"
        onPan={(e, { delta: { x, y } }) => onDrag([x, y], e.shiftKey)}
        whileHover={{
          fill: color,
          opacity: 0.1
        }}
        whileTap={{
          fill: color,
          opacity: 0.1
        }}
      />
    </g>
  )
}
