import { createCss } from '@stitches/react'

export const { styled, global, theme, getCssString } = createCss({
  theme: {
    colors: {
      left: 'rgba(29, 144, 255, 1)',
      right: 'rgba(255, 141, 30, 1)',
      selected: 'rgba(255, 0, 0, 1)',
      hovered: 'rgba(255, 0, 0, 0.1)',
      bounds: 'rgb(0, 106, 255)',
      bounds_bg: 'rgba(0, 106, 255, 0.05)',
      canvas: 'rgba(239, 239, 239, 1)',
      panel: 'rgba(255, 255, 255, 1)',
      section: 'rgba(251, 250, 250, 1)',
      border: 'rgba(231, 231, 231, 1)',
      text: 'rgba(37, 37, 37, 1)',
      soft: 'rgba(255, 255, 255, 0.62)',
      hint: 'rgba(0, 0, 0, 0.38)',
      muted: 'rgba(0, 0, 0, 0.16)',
      outline: 'rgba(0, 0, 0, 1)',
      fill: 'rgba(0, 0, 0, 1)',
    }
  }
})

export const dark = theme('dark', {
  colors: {
    canvas: 'rgba(29, 29, 28, 1)',
    panel: 'rgba(19, 19, 18, 1)',
    section: 'rgba(21, 21, 21, 1)',
    border: 'rgba(0, 0, 0, 1)',
    text: 'rgba(239, 239, 239, 1)',
    soft: 'rgba(52, 52, 52, 0.72)',
    hint: 'rgba(255, 255, 255, 0.38)',
    muted: 'rgba(255, 255, 255, 0.62)',
    outline: 'rgba(184, 185, 187, 1)',
    fill: 'rgba(255, 255, 255, 1)',
  }
})
