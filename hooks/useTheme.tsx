import React from "react"
import { dark } from "stitches.config"

let theme: "dark" | "light" = "dark"

if (typeof window !== "undefined") {
  const saved = localStorage.getItem("globs_editor_theme")
  if (saved !== null) {
    theme = JSON.parse(saved).theme
    document.body.classList.remove(theme === "dark" ? "light" : "dark")
    document.body.classList.add(theme === "dark" ? "dark" : "light")
  }
}

export default function useTheme() {
  // Set dark theme by default
  React.useEffect(() => {
    theme === "dark" && document.body.classList.add(dark)
  }, [])

  function toggle() {
    theme = theme === "dark" ? "light" : "dark"

    if (typeof window !== "undefined") {
      document.body.classList.remove(theme === "dark" ? "light" : dark)
      document.body.classList.add(theme === "dark" ? dark : "light")

      localStorage.setItem("globs_editor_theme", JSON.stringify({ theme }))
    }
  }

  return { theme, toggle }
}
