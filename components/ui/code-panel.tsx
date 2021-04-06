import { styled } from "stitches.config"
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

const DragWrapper = styled('div', {
  gridArea: 'main',
})

const CodePanelContainer = styled(motion.div, {
  width: '400px',
  maxHeight: '80%',
  backgroundColor: 'var(--colors-panel)',
})
