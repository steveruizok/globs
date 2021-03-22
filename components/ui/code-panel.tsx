import styled from "styled-components"
import { X } from "react-feather"
import { motion } from "framer-motion"
import { useRef } from "react"

export default function CodePanel() {
  const rDragWrapper = useRef(null)

  return (
    <DragWrapper ref={rDragWrapper}>
      <CodePanelContainer dragConstraints={rDragWrapper} dragElastic={0.015}>
        <button>
          <X />
        </button>
      </CodePanelContainer>
    </DragWrapper>
  )
}

const DragWrapper = styled.div`
  grid-area: main;
`

const CodePanelContainer = styled(motion.div)`
  width: 400px;
  max-height: 80%;
`
