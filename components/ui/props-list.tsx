import state, { useSelector } from "lib/state"
import { deepCompare } from "lib/utils"
import styled from "styled-components"

export default function Inspect() {
  const selectedNodeIds = useSelector((s) => s.data.selected, deepCompare)

  const selectedNodes = useSelector(
    (s) => s.data.selected.map((id) => s.data.nodes[id]).filter(Boolean),
    deepCompare
  )

  // const selectedGlobs = useSelector(
  //   (s) => s.data.selectedGlobs.map((id) => s.data.globs[id]),
  //   deepCompare
  // )

  // const selectedHandle = useSelector(
  //   ({ data: { globs, selectedHandle } }) =>
  //     selectedHandle && globs[selectedHandle.id].options[selectedHandle.handle]
  // )

  if (selectedNodes.length === 0) return null

  const x = selectedNodes.reduce(
    (a, c) => (c.point[0] === a ? a : "mixed"),
    selectedNodes[0].point[0]
  )

  const y = selectedNodes.reduce(
    (a, c) => (c.point[1] === a ? a : "mixed"),
    selectedNodes[0].point[1]
  )

  const radius = selectedNodes.reduce(
    (a, c) => (c.radius === a ? a : "mixed"),
    selectedNodes[0].radius
  )

  return (
    <>
      <section>Position</section>
      <PropsTable tabIndex={-1}>
        <NumberProp
          value={x}
          unit="x"
          onChange={(value) => state.send("SET_NODES_X", { value })}
        />
        <NumberProp
          value={y}
          unit="y"
          onChange={(value) => state.send("SET_NODES_Y", { value })}
        />
        <NumberProp
          value={radius}
          unit="radius"
          onChange={(value) => state.send("SET_NODES_RADIUS", { value })}
        />
      </PropsTable>
    </>
  )
}

interface NumberPropProps {
  value: number | "mixed"
  unit: string
  onChange: (value: number) => void
}

function NumberProp({ value, unit, onChange }: NumberPropProps) {
  return (
    <PropContainer>
      <label>{unit}</label>
      <input
        type="number"
        value={typeof value === "number" ? value : 0}
        onKeyDown={(e) => e.stopPropagation()}
        onChange={({ currentTarget: { value } }) => onChange(Number(value))}
      />
    </PropContainer>
  )
}

const PropContainer = styled.div`
  display: flex;
  justify-content: space-between;
  overflow: hidden;
  padding: 4px 8px;

  & label {
    width: 80px;
  }

  & input {
    width: 100%;
    font-size: 12px;
    padding: 4px 8px;
    border: none;
    background-color: #f3f3f3;
    border-radius: 2px;
    text-align: right;
  }
`

const PropsTable = styled.div`
  padding: 8px;
`

const PropRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`
