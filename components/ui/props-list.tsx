import state, { useSelector } from "lib/state"
import { deepCompare } from "lib/utils"
import styled from "styled-components"
import React, { useEffect, useState } from "react"
import { ArrowRight, ArrowUp, Disc, X } from "react-feather"
import Docs from "./docs"

export default function PropsList() {
  // const selectedNodeIds = useSelector((s) => s.data.selectedNodes, deepCompare)

  const selectedNodes = useSelector(
    (s) => s.data.selectedNodes.map((id) => s.data.nodes[id]).filter(Boolean),
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

  if (selectedNodes.length === 0)
    return (
      <PropsTable>
        <Docs />
      </PropsTable>
    )

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

  const cap = selectedNodes.reduce(
    (a, c) => (c.cap === a ? a : "mixed"),
    selectedNodes[0].cap
  )

  return (
    <>
      <section>Position</section>
      <PropsTable>
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
        <EnumProp
          value={cap}
          unit="cap"
          onChange={(value) => state.send("SET_NODES_CAP", { value })}
        >
          {cap === "mixed" && <option value="mixed">Mixed</option>}
          <option value="round">Round</option>
          <option value="flat">Flat</option>
        </EnumProp>
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
  const [state, setState] = useState<number>(Number(value))

  useEffect(() => {
    setState(Number(value))
  }, [value])

  function handleKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation()
    e.key === "Enter" && onChange(state)
  }

  return (
    <PropContainer>
      <label>{unit}</label>
      <input
        type="number"
        value={state || 0}
        onKeyDown={handleKeyDown}
        onChange={({ currentTarget: { value } }) => setState(Number(value))}
        onBlur={() => onChange(state)}
      />
    </PropContainer>
  )
}

interface EnumPropProps {
  value: string | "mixed"
  unit: string
  children: React.ReactNode
  onChange: (value: string) => void
}

function EnumProp({ children, value, unit, onChange }: EnumPropProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation()
  }

  return (
    <PropContainer>
      <label>{unit}</label>
      <select
        value={value}
        onKeyDown={handleKeyDown}
        onChange={({ currentTarget: { value } }) => onChange(value)}
      >
        {value === "mixed" && (
          <option value="mixed" disabled>
            Mixed
          </option>
        )}
        {children}
      </select>
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

  & input,
  select {
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
