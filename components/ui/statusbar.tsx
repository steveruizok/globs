import state from "lib/state"
import { useStateDesigner } from "@state-designer/react"
import { styled } from "stitches.config"
import { useRef } from "react"

export default function StatusBar() {
  const local = useStateDesigner(state)
  const { count, time } = useRenderCount()

  const active = local.active.slice(1).map((s) => s.split("root.")[1])
  const log = local.log[0]

  return (
    <StatusBarContainer>
      <States>{active.join(" | ")} | </States> <Section>{log}</Section>
      <Section title="Renders | Time">
        {count} | {time.toString().padStart(3, "0")}
      </Section>
    </StatusBarContainer>
  )
}

const Section = styled("div", {
  whiteSpace: "nowrap",
  overflow: "hidden",
})

const States = styled("div", {
  "@media (max-width: 768px)": {
    display: "none",
  },
})

const StatusBarContainer = styled("div", {
  userSelect: "none",
  borderTop: "1px solid $border",
  gridArea: "status",
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems: "center",
  backgroundColor: "$panel",
  font: "$debug",
  gridGap: 8,
  padding: "0 16px",

  "@media (max-width: 768px)": {
    gridTemplateColumns: "1fr auto",
  },
})

function useRenderCount() {
  const rTime = useRef(Date.now())
  const rCounter = useRef(0)

  rCounter.current++
  const now = Date.now()
  let time = now - rTime.current
  if (time > 100) {
    time = 0
  }
  rTime.current = now

  return { count: rCounter.current, time }
}
