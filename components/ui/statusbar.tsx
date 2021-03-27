import state from "lib/state"
import { useStateDesigner } from "@state-designer/react"
import styled from "styled-components"

export default function StatusBar() {
  const local = useStateDesigner(state)

  const active = local.active.slice(1).map((s) => s.split("root.")[1])
  const log = local.log[0]

  return (
    <StatusBarContainer>
      <Section>
        {active.join(" | ")} | {log}
      </Section>
      <Section></Section>
    </StatusBarContainer>
  )
}

const Section = styled.div``

const StatusBarContainer = styled.div`
  user-select: none;
  border-top: 1px solid rgba(0, 0, 0, 0.2);
  grid-area: status;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  font-size: 11px;
  padding: 0 16px;
`
