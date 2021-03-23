import state, { useSelector } from "lib/state"
import { deepCompare, deepCompareArrays } from "lib/utils"
import styled from "styled-components"
import React, { useEffect, useRef, useState } from "react"
import { ArrowRight, ArrowUp, Disc, X } from "react-feather"
import Docs from "./docs"
import { IGlob, INode } from "lib/types"

export default function PropsList() {
  // const selectedNodeIds = useSelector((s) => s.data.selectedNodes, deepCompare)

  const selectedNodes = useSelector(
    (s) => s.data.selectedNodes.map((id) => s.data.nodes[id]).filter(Boolean),
    deepCompareArrays
  )

  const selectedGlobs = useSelector(
    (s) => s.data.selectedGlobs.map((id) => s.data.globs[id]),
    deepCompareArrays
  )

  // const selectedHandle = useSelector(
  //   ({ data: { globs, selectedHandle } }) =>
  //     selectedHandle && globs[selectedHandle.id].options[selectedHandle.handle]
  // )

  return (
    <>
      <section>
        <h2>Properties</h2>
      </section>
      <PropsTable>
        {selectedNodes.length === 0 && selectedGlobs.length === 0 ? (
          <Docs />
        ) : selectedNodes.length > 0 && selectedGlobs.length === 0 ? (
          <NodesProps selectedNodes={selectedNodes} />
        ) : selectedNodes.length === 0 && selectedGlobs.length > 0 ? (
          <GlobsProps selectedGlobs={selectedGlobs} />
        ) : (
          <p>Mixed...</p>
        )}
      </PropsTable>
    </>
  )
}
function GlobsProps({ selectedGlobs }: { selectedGlobs: IGlob[] }) {
  const a = selectedGlobs.reduce(
    (a, c) => (c.options.a === a ? a : "mixed"),
    selectedGlobs[0].options.a
  )

  const b = selectedGlobs.reduce(
    (a, c) => (c.options.b === a ? a : "mixed"),
    selectedGlobs[0].options.b
  )

  const ap = selectedGlobs.reduce(
    (a, c) => (c.options.ap === a ? a : "mixed"),
    selectedGlobs[0].options.ap
  )

  const bp = selectedGlobs.reduce(
    (a, c) => (c.options.bp === a ? a : "mixed"),
    selectedGlobs[0].options.bp
  )

  return (
    <>
      <NumberProp
        value={a}
        unit="a"
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => state.send("SET_GLOB_OPTIONS", { a: value })}
      />
      <NumberProp
        value={b}
        unit="b"
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => state.send("SET_GLOB_OPTIONS", { b: value })}
      />
      <NumberProp
        value={ap}
        unit="ap"
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => state.send("SET_GLOB_OPTIONS", { ap: value })}
      />
      <NumberProp
        value={bp}
        unit="bp"
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => state.send("SET_GLOB_OPTIONS", { bp: value })}
      />
    </>
  )
}

function NodesProps({ selectedNodes }: { selectedNodes: INode[] }) {
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

  const locked = selectedNodes.reduce(
    (a, c) => (c.locked === a ? a : "mixed"),
    selectedNodes[0].locked
  )

  return (
    <>
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
      <BoolProp
        unit="locked"
        value={locked}
        onChange={(value) => state.send("SET_NODES_LOCKED", { value })}
      />
    </>
  )
}

interface NumberPropProps {
  value: number | "mixed"
  unit: string
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
}

function NumberProp({
  min,
  max,
  step,
  value,
  unit,
  onChange,
}: NumberPropProps) {
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
        value={state.toFixed(2) || 0}
        min={min}
        max={max}
        step={step}
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

interface BoolPropProps {
  value: boolean | "mixed"
  unit: string
  onChange: (value: boolean) => void
}

function BoolProp({ value, unit, onChange }: BoolPropProps) {
  const rInput = useRef<HTMLInputElement>(null)

  function handleKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation()
  }

  useEffect(() => {
    rInput.current!.indeterminate = value === "mixed"
  }, [value])

  return (
    <PropContainer>
      <label>{unit}</label>
      <input
        ref={rInput}
        type="checkbox"
        checked={value === "mixed" ? true : value}
        onKeyDown={handleKeyDown}
        onChange={({ currentTarget: { checked } }) =>
          onChange(Boolean(checked))
        }
      />
    </PropContainer>
  )
}

const PropContainer = styled.div`
  display: flex;
  justify-content: space-between;
  overflow: hidden;
  padding: 4px 8px;
  font-size: 12px;

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

  & input[type="checkbox"] {
    width: auto;
  }

  & section > h2 {
    font-size: 13px;
    font-weight: 600px;
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
