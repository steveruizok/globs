import { styled } from "stitches.config"
import { useMotionValue, useTransform } from "framer-motion"
import GlobList from "./glob-list"
import NodeList from "./node-list"
import {
  PanelInnerContainer as _PanelInnerContainer,
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

export default function ContentPanel() {
  const mvOffsetX = useMotionValue(0)

  const mvWidth = useTransform(mvOffsetX, (v) => MIN + v)

  return (
    <PanelContainer data-bp-desktop style={{ width: mvWidth }}>
      <PanelInnerContainer>
        <NodeList />
        <GlobList />
      </PanelInnerContainer>
      <ResizeHandle
        drag="x"
        dragMomentum={false}
        dragConstraints={{ left: 0, right: MAX - MIN }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x: mvOffsetX }}
        dragElastic={0.07}
      />
    </PanelContainer>
  )
}

const PanelContainer = styled(_PanelContainer, {
  gridArea: "content",
  borderRight: "1px solid $border",
})

const ResizeHandle = styled(_ResizeHandle, {
  left: `${MIN - 5}px`,
})

const PanelInnerContainer = styled(_PanelInnerContainer, {
  display: "grid",
  gridTemplateRows: "1fr 1fr",
})
