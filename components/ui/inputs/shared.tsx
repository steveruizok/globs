import { styled } from "stitches.config"
import { motion } from "framer-motion"

export const PropContainer = styled(motion.div, {
  display: 'flex',
  flexWrap: 'nowrap',
  justifyContent: 'flex-start',
  alignItems: 'center',
  overflow: 'hidden',
  padding: '4px 8px',
  fontSize: '12px',
  lineHeight: '18px',
  WebkitFontSmoothing: 'antialiased',
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
    color: '$text',
    backgroundColor: '$canvas',
    borderRadius: '2px',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums'
  },
  'select': {
    background: '$canvas',
    backgroundImage: 'url("data:image/svg+xml;utf8,<svg width=\'16\' height=\'16\' viewBox=\'0 0 16 16\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M11 6L8 3L5 6\' stroke=\'white\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/><path d=\'M11 10L8 13L5 10\' stroke=\'white\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/></svg>")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right center',
    WebkitAppearance: 'none',
  },
  '& input[type="number"]': {
    WebkitAppearance: 'textfield',
  },
  '& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button': {
    WebkitAppearance: 'none',
    marginRight: 2,
  },
  '& input[type="number"]:focus, & select:focus': {
    outline: 'none',
    boxShadow: '0 0 0 1px red'
  },
  '& input[type="checkbox"]': {
    width: 'auto',
  },
  '& section > h2': {
    fontSize: '13px',
    fontWeight: '600px',
  }
})
