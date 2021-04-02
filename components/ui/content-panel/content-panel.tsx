import styled from "styled-components"
import { motion, useMotionValue, useTransform } from "framer-motion"
import GlobList from "./glob-list"
import NodeList from "./node-list"

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
  display: grid;
  grid-template-rows: 1fr 1fr;
  max-height: 100%;

  & > section {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    overflow-y: scroll;
    position: relative;

    &:nth-of-type(2) {
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    & h2 {
      font-size: 13px;
      font-weight: 600px;
      display: flex;
      align-items: center;
      width: 100%;
      height: 28px;
      background-color: rgba(0, 0, 0, 0.05);
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      padding: 0 16px;
      margin: 0;
    }

    & ol {
      position: relative;
      list-style-type: none;
      padding: 0;
      margin: 0;

      & li {
        margin: 0;
        padding: 0;
        padding-left: 16px;
        width: 100%;
        height: 28px;
        display: grid;
        grid-template-columns: 1fr 28px;
        align-items: center;
        gap: 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);

        &:hover {
          background-color: rgba(0, 0, 0, 0.03);
        }

        & *[data-hidey="true"] {
          visibility: hidden;
        }

        &:hover *[data-hidey="true"] {
          visibility: visible;
        }

        & > button {
          display: flex;
          align-items: center;
          width: 100%;
          height: 100%;
          border: none;
          background: transparent;
          padding: 0 0px;
          font-weight: 400;
          cursor: pointer;
          outline: none;

          &[data-selected="true"] {
            color: red;
          }

          &:hover > svg {
            opacity: 1;
          }
        }
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
