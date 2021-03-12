import { useRef, useEffect } from "react"

export function useStableDashOffset() {
  const rPath = useRef<SVGPathElement>(null)
  const rPrevLength = useRef(0)

  useEffect(() => {
    const path = rPath.current

    if (!path) return

    const length = path.getTotalLength()

    if (length !== rPrevLength.current) {
      rPrevLength.current = length
      path.setAttribute("stroke-dashoffset", String(-length / 2))
    }
  })

  return rPath
}
