import styled from "styled-components"
import { motion, useMotionValue, useTransform } from "framer-motion"
import GlobList from "./glob-list"
import NodeList from "./node-list"

const MIN = 200,
  MAX = 320

export default function ContentPanel() {
  const mvOffsetX = useMotionValue(0)
  const mvWidth = useTransform(mvOffsetX, (v) => MIN + v)

  function handleDragStart() {
    document.body.style.cursor = "col-resize"
  }

  function handleDragEnd() {
    document.body.style.cursor = "default"
  }

  return (
    <PanelContainer style={{ width: mvWidth }} data-bp-desktop>
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

const PanelContainer = styled(motion.div)`
  position: relative;
  grid-area: content;
  overflow: hidden;
  user-select: none;
`
const PanelInnerContainer = styled.div`
  width: 100%;
  height: 100%;
  min-width: 200px;
  overflow: hidden;
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
  left: ${MIN - 5}px;
  width: 5px;
  height: 100%;
  cursor: col-resize;
  transition: background-color 0.1s;

  &::after {
    content: "";
    display: block;
    position: absolute;
    right: 0;
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
