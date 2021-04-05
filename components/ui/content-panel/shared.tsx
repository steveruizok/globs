import { ReactNode } from "react"
import { motion } from "framer-motion"
import styled from "styled-components"

const ITEM_HEIGHT = 28

export const Handle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  & svg {
    height: 20px;
    width: 10px;
  }
`

export function Draggable({
  isDragging,
  onDragStart,
  onDragEnd,
  onDrag,
  children,
}: {
  isDragging: boolean
  onDragStart: (point: number[]) => void
  onDragEnd: () => void
  onDrag: (point: number[]) => void
  children: ReactNode
}) {
  return (
    <motion.li
      layout
      data-isDragging={isDragging}
      onPanStart={(_, info) => onDragStart([info.point.x, info.point.y])}
      onPanEnd={onDragEnd}
      onPan={(_, info) => isDragging && onDrag([info.point.x, info.point.y])}
      transition={{
        type: "spring",
        stiffness: 900,
        mass: 0.2,
        damping: 30,
      }}
    >
      {children}
    </motion.li>
  )
}

export function PositionIndicator({
  nextIndex,
  direction,
  depth,
}: {
  nextIndex: number
  direction: "up" | "down"
  depth: number
}) {
  return (
    <motion.div
      style={{
        position: "absolute",
        top: (nextIndex + 1) * ITEM_HEIGHT,
        left: depth * 12,
        width: `calc(100% - ${depth * 12}px)`,
        height: ITEM_HEIGHT,
        pointerEvents: "none",
      }}
      animate={direction}
      transition={{ duration: 0 }}
      variants={{
        up: {
          borderTop: "2px solid rgba(255, 0, 0, 1)",
        },
        down: {
          borderBottom: "2px solid rgba(255, 0, 0, 1)",
        },
      }}
    />
  )
}
