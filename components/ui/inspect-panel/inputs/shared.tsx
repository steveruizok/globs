import styled from "styled-components"
import { motion } from "framer-motion"

export const PropContainer = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  overflow: hidden;
  padding: 4px 8px;
  font-size: 12px;

  & label {
    width: 80px;
  }

  .dragWrapper {
    width: 100%;
  }

  & input,
  select {
    width: 100%;
    font-size: 12px;
    padding: 4px 8px;
    border: none;
    color: var(--colors-text);
    background-color: var(--colors-canvas);
    border-radius: 2px;
    text-align: right;
  }

  & input[type="checkbox"] {
    width: auto;
  }

  & section > h2 {
    font-size: 13px;
    font-weight: 600px;
  }
`
