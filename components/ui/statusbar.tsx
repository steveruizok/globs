import state, { useSelector } from "lib/state"
import { deepCompare, deepCompareArrays } from "lib/utils"
import {
  RotateCcw,
  RotateCw,
  Disc,
  ArrowRight,
  Copy,
  Sun,
  ArrowUp,
} from "react-feather"
import styled from "styled-components"

export default function StatusBar() {
  const selectedNodes = useSelector(
    (s) => s.data.selectedNodes,
    deepCompareArrays
  )
  const active = useSelector((s) =>
    s.active.slice(1).map((s) => s.split("root.")[1])
  )
  const log = useSelector((s) => s.log[0])

  return (
    <StatusBarContainer>
      <Section>
        {active.join(" | ")} | {log}
      </Section>
      <Section>{selectedNodes.join(", ")}</Section>
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
