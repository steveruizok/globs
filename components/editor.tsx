import React, { useCallback, useEffect, useRef } from "react"

import Brush from "components/brush"
import Glob from "components/glob"
import styled from "styled-components"
import state, { useSelector } from "lib/state"
import { deepCompare } from "lib/utils"
import usePinchZoom from "hooks/usePinchZoom"

export default function Editor() {
  const globIds = useSelector((s) => s.data.globIds, deepCompare)
  const rContainer = useRef<HTMLDivElement>(null)
  const rSvg = useRef<SVGSVGElement>(null)

  // When we zoom or pan, manually update the svg's viewbox
  // This is expensive, so we want to set this property
  // only when we really need to.
  useEffect(() => {
    const svg = rSvg.current!
    let prev = ``

    return state.onUpdate((s) => {
      const { document } = s.data
      const next = [
        document.point[0],
        document.point[1],
        document.size[0],
        document.size[1],
      ].join(" ")

      if (next !== prev) {
        svg.setAttribute("viewBox", next)
        prev = next
      }
    })
  }, [])

  // Update the viewport on first mount
  useEffect(() => {
    const svg = rSvg.current!
    const rect = svg.getBoundingClientRect()
    state.send("MOUNTED", { size: [rect.width, rect.height] })
    return () => void state.send("UNMOUNTED")
  }, [])

  // Prevent browser zoom and use our own instead
  const { handleTouchStart, handleTouchMove } = usePinchZoom(rContainer)

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    state.send("WHEELED", {
      ctrlKey: e.ctrlKey,
      delta: [e.deltaX, e.deltaY],
    })
  }, [])

  return (
    <EditorContainer
      ref={rContainer}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchMove}
      onWheel={handleWheel}
    >
      <svg ref={rSvg} width="100%" height="100%">
        <rect
          x={-2000}
          y={-2000}
          width={4000}
          height={4000}
          fill="#efefef"
          onPointerDown={() => state.send("POINTED_CANVAS")}
        />
        {Object.values(globIds).map((id) => (
          <Glob key={id} id={id} />
        ))}
        <Brush />
      </svg>
    </EditorContainer>
  )
}

const EditorContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`
