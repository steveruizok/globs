import { createState, useStateDesigner } from "@state-designer/react"
import React, { useState } from "react"
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

const state = createState({
  data: { theme },
  on: {
    TOGGLED_THEME: "toggleTheme",
  },
  actions: {
    toggleTheme(data) {
      data.theme = data.theme === "dark" ? "light" : "dark"
    },
  },
})

export default function useTheme() {
  const local = useStateDesigner(state)
  const { theme } = local.data

  // Set dark theme by default
  React.useEffect(() => {
    document.body.classList.remove(theme === "dark" ? "light" : dark)
    document.body.classList.add(theme === "dark" ? dark : "light")
    localStorage.setItem("globs_editor_theme", JSON.stringify({ theme }))
  }, [theme])

  function toggle() {
    state.send("TOGGLED_THEME")
  }

  return { theme, toggle }
}
