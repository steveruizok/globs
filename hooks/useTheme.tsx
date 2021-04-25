import state, { useSelector } from "lib/state"

export default function useTheme() {
  const theme = useSelector((state) => state.data.theme)

  function toggle() {
    state.send("TOGGLED_THEME")
  }

  return { theme, toggle }
}
