import { styled } from "stitches.config"
import { motion } from "framer-motion"

export const PanelContainer = styled(motion.div, {
	position: 'relative',
  overflow: 'hidden',
  userSelect: 'none',
  backgroundColor: 'var(--colors-panel)',
})

export const ResizeHandle = styled(motion.div, {
	position: 'absolute',
  top: '0px',
  width: '5px',
  height: '100%',
  cursor: 'col-resize',
  transition: 'background-color 0.1s',
  zIndex: '200',

  '&::after': {
    content: '""',
    display: 'block',
    position: 'absolute',
    right: '2px',
    top: '0',
    width: '1px',
    height: '100%',
    backgroundColor: 'var(--colors-section)',
    transition: 'background-color 0.1s',
  },

  '&:hover, &:active': {
    backgroundColor: 'var(--colors-section)',
  },

  '&:hover, &:active::after': {
    backgroundColor: 'var(--colors-selected)',
  }
})

export const PanelInnerContainer = styled('div', {
	width: '100%',
  height: '100%',
  minWidth: '200px',
  overflow: 'hidden',
  maxHeight: '100%',
  font: 'var(--fonts-ui)',

  '& > section': {
    margin: '0',
    padding: '0',
    overflowX: 'hidden',
    overflowY: 'scroll',
    position: 'relative',

    '&:nth-of-type(2)': {
      borderTop: '1px solid var(--colors-border)',
    },

    '& h2': {
      font: 'var(--fonts-section)',
      fontWeight: '600px',
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      height: '28px',
      backgroundColor: 'var(--colors-section)',
      borderBottom: '1px solid var(--colors-border)',
      padding: '0 16px',
      margin: '0',
      position: 'sticky',
      top: '0',
      zIndex: '1',
    },

    '&:hover > ol': {
      opacity: '1',
    },

    '& > ol': {
      position: 'relative',
      listStyleType: 'none',
      padding: '0',
      margin: '0',
      opacity: '0.5',

      '& > li': {
        margin: '0',
        padding: '0',
        paddingLeft: '16px',
        width: '100%',
        height: '28px',
        display: 'grid',
        gridTemplateColumns: '1fr 28px',
        alignItems: 'center',
        gap: '0',

        '&[data-isdragging="true"]': {
          background: 'var(--colors-hovered)',
        },

        '&:hover': {
          color: 'var(--colors-hovered)',
          background: 'var(--colors-hovered)',
        },

        '&:hover *[data-hidey="true"]': {
          visibility: 'visible',
        },

        '& *[data-hidey="true"]': {
          visibility: 'hidden',
        },

        '& > button': {
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          border: 'none',
          background: 'none',
          backgroundColor: 'none',
          padding: '0 0px',
          fontWeight: '400',
          cursor: 'pointer',
          outline: 'none',
          font: 'var(--fonts-ui)',
          color: 'var(--colors-text)',

          '&[data-selected="true"]': {
            color: 'var(--colors-selected)',
          },

          '&:hover > svg': {
            opacity: '1',
          }
        }
      }
    }
  }
})
