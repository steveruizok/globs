import { global } from "stitches.config"

export const globalStyles = global({
  "*": {
    boxSizing: "border-box",
  },

  "html, body": {
    padding: "0",
    margin: "0",
    fontFamily: '"Inter", -apple-system, sans-serif',
    overflow: "hidden",
    overscrollBehavior: "none",
    boxSizing: "border-box",
    color: "$text",
  },

  ":root": {
    "--zoomed": "2px",
    "--zoom": "2px",
  },

  a: {
    color: "inherit",
    textDecoration: "none",
  },

  "svg text": {
    WebkitUserSelect: "none",
    MozUserSelect: "none",
    MsUserSelect: "none",
    userSelect: "none",
  },

  // Strokes
  ".anchor-handle": {
    strokeWidth: "calc(var(--zoomed) * 4px)",
  },

  ".strokewidth-brush": {
    strokeWidth: "calc(var(--zoom) * 1px)",
  },

  ".strokewidth-ui": {
    strokeWidth: "calc(var(--zoom) * 2px)",
  },

  ".strokewidth-hover": {
    strokeWidth: "calc(var(--zoomed) * 6px)",
  },

  ".strokewidth-l": {
    strokeWidth: "calc(var(--zoomed) * 3px)",
  },

  ".strokewidth-m": {
    strokeWidth: "calc(var(--zoomed) * 2px)",
  },

  ".strokewidth-s": {
    strokeWidth: "calc(var(--zoomed) * 1px)",
  },

  // Stroke Colors
  ".stroke-left": {
    stroke: "$left",
  },

  ".stroke-right": {
    stroke: "$right",
  },

  ".stroke-selected": {
    stroke: "$selected",
  },

  ".stroke-outline": {
    stroke: "$outline",
  },

  ".stroke-guide": {
    stroke: "$guide",
  },

  ".stroke-hint": {
    stroke: "$hint",
  },

  ".stroke-bounds": {
    stroke: "$bounds",
  },

  // Dash Array
  ".dash-array-s": {
    strokeDasharray: "calc(var(--zoomed) * 1px) calc(var(--zoomed) * 5px)",
  },

  ".dash-array-m": {
    strokeDasharray: "calc(var(--zoomed) * 1px) calc(var(--zoomed) * 3px)",
  },

  // Nodes
  ".fill-left": {
    fill: "$left",
  },

  ".fill-right": {
    fill: "$right",
  },

  ".fill-flat": {
    fill: "$fill",
  },

  ".fill-soft": {
    fill: "$soft",
  },

  ".fill-bounds-bg": {
    fill: "$bounds_bg",
  },

  ".fill-corner": {
    fill: "$panel",
  },

  ".fill-none": {
    fill: "none",
  },

  // Handles
  ".opacity-full": {
    opacity: "1",
  },

  ".opacity-m": {
    opacity: "0.5",
  },

  ".opacity-s": {
    opacity: "0.2",
  },

  // Globs
  ".fill-hover": {
    fill: "$hovered",
  },

  // Events
  ".ignore-events": {
    pointerEvents: "none",
  },
})
