import { useEffect, useRef } from "react"
import state from "lib/state"

export default function Canvas() {
  const rCanvas = useRef<HTMLDivElement>(null)

  useEffect(() => {
    state.send("MOUNTED", rCanvas.current)
    return () => {
      state.send("UNMOUNTED", rCanvas.current)
    }
  }, [])

  return <div ref={rCanvas} />
}
