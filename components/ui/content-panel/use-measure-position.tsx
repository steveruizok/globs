import { useEffect, useRef } from "react"

export function useMeasurePosition(
  update: (info: { height: number; top: number }) => void
) {
  // We'll use a `ref` to access the DOM element that the `motion.li` produces.
  // This will allow us to measure its height and position, which will be useful to
  // decide when a dragging element should switch places with its siblings.
  const ref = useRef(null)

  // Update the measured position of the item so we can calculate when we should rearrange.
  useEffect(() => {
    update({
      height: ref.current.offsetHeight,
      top: ref.current.offsetTop,
    })
  })

  return ref
}
