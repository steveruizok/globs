import state from "lib/state"
import { useStateDesigner } from "@state-designer/react"
import styled from "styled-components"
import { useRef } from "react"

export default function StatusBar() {
  const local = useStateDesigner(state)
  const { count, time } = useRenderCount()

  const active = local.active.slice(1).map((s) => s.split("root.")[1])
  const log = local.log[0]

  return (
    <StatusBarContainer>
      <Section>
        {active.join(" | ")} | {log}
      </Section>
      <Section title="Renders | Time">
        {count} | {time.toString().padStart(3, "0")}
      </Section>
    </StatusBarContainer>
  )
}

const Section = styled.div``

const StatusBarContainer = styled.div`
  user-select: none;
  border-top: 1px solid var(--colors-border);
  grid-area: status;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--colors-panel);
  font: var(--fonts-mono);
  padding: 0 16px;
`

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
