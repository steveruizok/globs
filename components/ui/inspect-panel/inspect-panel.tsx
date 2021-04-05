import styled from "styled-components"
import { motion, useMotionValue, useTransform } from "framer-motion"
import PropsList from "./props-list"
import {
  PanelInnerContainer,
  PanelContainer as _PanelContainer,
  ResizeHandle as _ResizeHandle,
} from "../panels"

const MIN = 200,
  MAX = 320

function handleDragStart() {
  document.body.style.cursor = "col-resize"
}

function handleDragEnd() {
  document.body.style.cursor = "default"
}

export default function InspectPanel() {
  const mvOffsetX = useMotionValue(0)
  const mvWidth = useTransform(mvOffsetX, (v) => MIN + -v)

  return (
    <PanelContainer data-bp-desktop style={{ width: mvWidth }} data-bp-any>
      <PanelInnerContainer>
        <PropsList />
      </PanelInnerContainer>
      <ResizeHandle
        drag="x"
        dragMomentum={false}
        dragConstraints={{ left: -(MAX - MIN), right: 0 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x: mvOffsetX }}
        dragElastic={0.07}
      />
    </PanelContainer>
  )
}

const PanelContainer = styled(_PanelContainer)`
  grid-area: inspect;
  border-left: 1px solid var(--colors-border);
`

const ResizeHandle = styled(_ResizeHandle)`
  right: ${MIN - 5}px;
`
