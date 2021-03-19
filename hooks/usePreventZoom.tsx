import * as React from "react"

export default function usePreventZoom(
  rContainer: React.MutableRefObject<HTMLDivElement>
) {
  // Disable pinch-to-zoom on an element.
  React.useEffect(() => {
    const container = rContainer.current
    if (!container) return

    function preventTouchZooming(e: WheelEvent) {
      if (e.ctrlKey) {
        e.preventDefault()
      }
    }

    container.addEventListener("wheel", preventTouchZooming, {
      passive: false,
    })
    container.addEventListener("touchmove", preventTouchZooming, {
      passive: false,
    })
    return () => {
      container.removeEventListener("wheel", preventTouchZooming)
      container.removeEventListener("touchmove", preventTouchZooming)
    }
  }, [])

  return rContainer
}
