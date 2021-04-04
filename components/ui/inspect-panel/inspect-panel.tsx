import styled from "styled-components"
import { motion, useMotionValue, useTransform } from "framer-motion"
import PropsList from "./props-list"

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
    <PanelContainer
      // data-bp-desktop
      style={{ width: mvWidth }}
      data-bp-any
    >
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

const PanelContainer = styled(motion.div)`
  position: relative;
  grid-area: inspect;
  overflow: hidden;
  user-select: none;
  pointer-events: all;
  z-index: 2;
`
const PanelInnerContainer = styled.div`
  width: 100%;
  height: 100%;
  min-width: 120px;
  overflow-y: scroll;
  background-color: #ffffff;
  font-size: 13px;

  & section {
    display: flex;
    align-items: center;
    width: 100%;
    height: 28px;
    background-color: rgba(0, 0, 0, 0.05);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    padding: 0 8px;
    font-weight: 400;

    & > h2 {
      font-size: 13px;
      font-weight: 600px;
    }
  }

  & > ol {
    list-style-type: none;
    padding: 0;
    margin: 0;

    li > button {
      display: flex;
      align-items: center;
      width: 100%;
      height: 28px;
      border: none;
      background: transparent;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      padding: 0 8px;
      font-weight: 400;
      cursor: pointer;
      outline: none;

      &:hover {
        background-color: rgba(0, 0, 0, 0.03);
      }

      &[data-selected="true"] {
        color: red;
      }
    }
  }
`

const ResizeHandle = styled(motion.div)`
  position: absolute;
  top: 0px;
  right: ${MIN - 5}px;
  width: 5px;
  height: 100%;
  cursor: col-resize;
  transition: background-color 0.1s;

  &::after {
    content: "";
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 1px;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.2);
    transition: background-color 0.1s;
  }

  &:hover,
  :active {
    background-color: rgba(0, 0, 0, 0.07);
  }

  &:hover::after,
  :active::after {
    background-color: rgba(0, 0, 0, 1);
  }
`
