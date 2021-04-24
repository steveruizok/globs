import { useEffect } from "react"
import { dark } from "stitches.config"
import state, { useSelector } from "lib/state"

export default function useTheme() {
  const theme = useSelector((state) => state.data.theme)

  useEffect(() => {
    document.body.classList.remove(theme === "dark" ? "light" : dark)
    document.body.classList.add(theme === "dark" ? dark : "light")
    localStorage.setItem("globs_editor_theme", JSON.stringify({ theme }))
  }, [theme])

  function toggle() {
    state.send("TOGGLED_THEME")
  }

  return { theme, toggle }
}
