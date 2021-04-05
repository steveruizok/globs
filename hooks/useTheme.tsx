// This is a very simple theme. It is not yet reactive.

let theme: "dark" | "light" = "dark"

if (typeof window !== "undefined") {
  const saved = localStorage.getItem("globs_editor_theme")
  if (saved !== null) {
    theme = JSON.parse(saved).theme
    document.body.classList.add(theme)
  }
}

export default function useTheme() {
  function toggle() {
    theme = theme === "dark" ? "light" : "dark"

    if (typeof window !== "undefined") {
      document.body.classList.remove(theme === "dark" ? "light" : "dark")
      document.body.classList.add(theme === "dark" ? "dark" : "light")

      localStorage.setItem("globs_editor_theme", JSON.stringify({ theme }))
    }
  }

  return { theme, toggle }
}
