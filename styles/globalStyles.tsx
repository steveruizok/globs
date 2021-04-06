import { global } from 'stitches.config'

export const globalStyles = global({
	'html, body': {
		padding: '0',
		margin: '0',
		fontFamily: '"Inter", -apple-system, sans-serif',
		overflow: 'hidden',
		overscrollBehavior: 'none',
		boxSizing: 'border-box',
		color: '$text',
	},

	'a': {
		color: 'inherit',
		textDecoration: 'none',
	},

	'*': {
		boxSizing: 'border-box',
	},

	'svg text': {
		WebkitUserSelect: 'none',
		MozUserSelect: 'none',
		MsUserSelect: 'none',
		userSelect: 'none',
	},

	':root': {
		'--zoomed': '2px',
		'--zoom': '2px',
		'--fonts-ui': '500 12px/14px "Inter", -apple-system, sans-serif',
		'--fonts-section': '600 12px/14px "Inter", monospace',
		'--fonts-mono': '500 12px/14px "IBM Plex Mono", monospace',
	},

	// Strokes
	'.anchor-handle': {
		strokeWidth: 'calc(var(--zoomed) * 4px)',
	},

	'.strokewidth-ui': {
		strokeWidth: 'calc(var(--zoom) * 2px)',
	},

	'.strokewidth-hover': {
		strokeWidth: 'calc(var(--zoomed) * 6px)',
	},

	'.strokewidth-l': {
		strokeWidth: 'calc(var(--zoomed) * 3px)',
	},

	'.strokewidth-m': {
		strokeWidth: 'calc(var(--zoomed) * 2px)',
	},

	'.strokewidth-s': {
		strokeWidth: 'calc(var(--zoomed) * 1px)',
	},

	// Stroke Colors
	'.stroke-left': {
		stroke: 'var(--colors-left)',
	},

	'.stroke-right': {
		stroke: 'var(--colors-right)',
	},

	'.stroke-selected': {
		stroke: 'var(--colors-selected)',
	},

	'.stroke-outline': {
		stroke: 'var(--colors-outline)',
	},

	'.stroke-guide': {
		stroke: 'var(--colors-guide)',
	},

	'.stroke-hint': {
		stroke: 'var(--colors-hint)',
	},

	'.stroke-bounds': {
		stroke: 'var(--colors-bounds)',
	},

	// Dash Array
	'.dash-array-s': {
		strokeDasharray: 'calc(var(--zoomed) * 1px) calc(var(--zoomed) * 5px)',
	},

	'.dash-array-m': {
		strokeDasharray: 'calc(var(--zoomed) * 1px) calc(var(--zoomed) * 3px)',
	},

	// Nodes
	'.fill-left': {
		fill: 'var(--colors-left)',
	},

	'.fill-right': {
		fill: 'var(--colors-right)',
	},

	'.fill-flat': {
		fill: 'var(--colors-fill)',
	},

	'.fill-soft': {
		fill: 'var(--colors-soft)',
	},

	'.fill-bounds-bg': {
		fill: 'var(--colors-bounds-bg)',
	},

	'.fill-corner': {
		fill: 'var(--colors-panel)',
	},

	'.fill-none': {
		fill: 'none',
	},

	// Handles
	'.opacity-full': {
		opacity: '1',
	},

	'.opacity-m': {
		opacity: '0.5',
	},

	'.opacity-s': {
		opacity: '0.2',
	},

	// Globs
	'.fill-hover': {
		fill: 'var(--colors-hovered)',
	},

	// Events
	'.ignore-events': {
		pointerEvents: 'none',
	},

})
