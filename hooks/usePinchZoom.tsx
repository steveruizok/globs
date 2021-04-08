import { useCallback, useRef, TouchEvent, RefObject } from "react"
import usePreventZoom from "./usePreventZoom"
import state from "lib/state"
import * as Vec from "lib/vec"

export default function usePinchZoom(ref: RefObject<HTMLDivElement>) {
  usePreventZoom(ref)

  const rTouchDist = useRef(0)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      const { clientX: x0, clientY: y0 } = e.touches[0]
      const { clientX: x1, clientY: y1 } = e.touches[1]

      rTouchDist.current = Vec.dist([x0, y0], [x1, y1])
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      const { clientX: x0, clientY: y0 } = e.touches[0]
      const { clientX: x1, clientY: y1 } = e.touches[1]

      const dist = Vec.dist([x0, y0], [x1, y1])
      // state.send("WHEELED", { delta: [0, dist - rTouchDist.current] })
      rTouchDist.current = dist
    }
  }, [])

  return { onTouchStart: handleTouchStart, onTouchMove: handleTouchMove }
}
