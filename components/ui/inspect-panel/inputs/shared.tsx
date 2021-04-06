import { styled } from "stitches.config"
import { motion } from "framer-motion"

export const PropContainer = styled(motion.div, {
	display: 'flex',
  justifyContent: 'space-between',
  overflow: 'hidden',
  padding: '4px 8px',
  fontSize: '12px',

  '& label': {
    width: '80px',
  },

  '& .dragWrapper': {
    width: '100%',
  },

  '& input, & select': {
    width: '100%',
    fontSize: '12px',
    padding: '4px 8px',
    border: 'none',
    color: 'var(--colors-text)',
    backgroundColor: 'var(--colors-canvas)',
    borderRadius: '2px',
    textAlign: 'right',
  },

  '& input[type="checkbox"]': {
    width: 'auto',
  },

  '& section > h2': {
    fontSize: '13px',
    fontWeight: '600px',
  }
})
