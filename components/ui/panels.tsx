import styled from "styled-components"
import { motion } from "framer-motion"

export const PanelContainer = styled(motion.div)`
  position: relative;
  overflow: hidden;
  user-select: none;
  background-color: var(--colors-panel);
`

export const ResizeHandle = styled(motion.div)`
  position: absolute;
  top: 0px;
  width: 5px;
  height: 100%;
  cursor: col-resize;
  transition: background-color 0.1s;
  z-index: 200;

  &::after {
    content: "";
    display: block;
    position: absolute;
    right: 0;
    top: 0;
    width: 1px;
    height: 100%;
    background-color: var(--colors-section);
    transition: background-color 0.1s;
  }

  &:hover,
  :active {
    background-color: var(--colors-section);
  }

  &:hover::after,
  :active::after {
    background-color: var(--colors-selected);
  }
`

export const PanelInnerContainer = styled.div`
  width: 100%;
  height: 100%;
  min-width: 200px;
  overflow: hidden;
  max-height: 100%;
  font: var(--fonts-ui);

  & > section {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    overflow-y: scroll;
    position: relative;

    &:nth-of-type(2) {
      border-top: 1px solid var(--colors-border);
    }

    & h2 {
      font: var(--fonts-section);
      font-weight: 600px;
      display: flex;
      align-items: center;
      width: 100%;
      height: 28px;
      background-color: var(--colors-section);
      border-bottom: 1px solid var(--colors-border);
      padding: 0 16px;
      margin: 0;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    &:hover > ol {
      opacity: 1;
    }

    & > ol {
      position: relative;
      list-style-type: none;
      padding: 0;
      margin: 0;
      opacity: 0.5;

      & > li {
        margin: 0;
        padding: 0;
        padding-left: 16px;
        width: 100%;
        height: 28px;
        display: grid;
        grid-template-columns: 1fr 28px;
        align-items: center;
        gap: 0;

        &[data-isDragging="true"] {
          background: var(--colors-hovered);
        }

        &:hover {
          color: var(--colors-hovered);
          background: var(--colors-hovered);
        }

        &:hover *[data-hidey="true"] {
          visibility: visible;
        }

        & *[data-hidey="true"] {
          visibility: hidden;
        }

        & > button {
          display: flex;
          align-items: center;
          width: 100%;
          height: 100%;
          border: none;
          background: none;
          background-color: none;
          padding: 0 0px;
          font-weight: 400;
          cursor: pointer;
          outline: none;
          font: var(--fonts-ui);
          color: var(--colors-text);

          &[data-selected="true"] {
            color: var(--colors-selected);
          }

          &:hover > svg {
            opacity: 1;
          }
        }
      }
    }
  }
`
