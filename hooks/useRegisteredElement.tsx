import { useEffect, useRef } from "react"
import state from "lib/state"

export default function useRegisteredElement<T>(id: string) {
  const ref = useRef<T>(null)

  useEffect(() => {
    state.send("MOUNTED_ELEMENT", { id, elm: ref.current })
    return () => void state.send("UNMOUNTED_ELEMENT", { id })
  }, [id])

  return ref
}
