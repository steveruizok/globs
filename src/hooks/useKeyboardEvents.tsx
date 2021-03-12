import { state } from "../state"

export default function useKeyboardEffects() {
  function handleKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case "Backspace":
      case "Delete":
        state.send("DELETED_GLOB")
        break
    }
  }

  document.body.addEventListener("keydown", handleKeyDown)
  return () => {
    document.body.removeEventListener("keydown", handleKeyDown)
  }
}
