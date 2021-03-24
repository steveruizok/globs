import state, { useSelector } from "lib/state"
import { clamp, deepCompareArrays } from "lib/utils"
import styled from "styled-components"
import React, { useEffect, useRef, useState } from "react"
import { ArrowRight, ArrowUp, Disc, X } from "react-feather"
import Docs from "./docs"
import { IGlob, INode } from "lib/types"
import { motion, PanInfo } from "framer-motion"

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
        onChange={(value) =>
          state.send("SET_GLOB_OPTIONS", { a: clamp(value, 0, 1) })
        }
      />
      <NumberProp
        value={b}
        unit="b"
        min={0}
        max={1}
        step={0.01}
        onChange={(value) =>
          state.send("SET_GLOB_OPTIONS", { b: clamp(value, 0, 1) })
        }
      />
      <NumberProp
        value={ap}
        unit="ap"
        min={0}
        max={1}
        step={0.01}
        onChange={(value) =>
          state.send("SET_GLOB_OPTIONS", { ap: clamp(value, 0, 1) })
        }
      />
      <NumberProp
        value={bp}
        unit="bp"
        min={0}
        max={1}
        step={0.01}
        onChange={(value) =>
          state.send("SET_GLOB_OPTIONS", { bp: clamp(value, 0, 1) })
        }
      />
      {selectedGlobs.length === 1 && (
        <>
          <NumberProp
            value={selectedGlobs[0].options.D[0]}
            unit="Dx"
            onChange={(value) =>
              state.send("SET_GLOB_OPTIONS", {
                D: [value, selectedGlobs[0].options.D[1]],
              })
            }
          />
          <NumberProp
            value={selectedGlobs[0].options.D[1]}
            unit="Dy"
            onChange={(value) =>
              state.send("SET_GLOB_OPTIONS", {
                D: [selectedGlobs[0].options.D[0], value],
              })
            }
          />
          <NumberProp
            value={selectedGlobs[0].options.Dp[0]}
            unit="Dpx"
            onChange={(value) =>
              state.send("SET_GLOB_OPTIONS", {
                Dp: [value, selectedGlobs[0].options.Dp[1]],
              })
            }
          />
          <NumberProp
            value={selectedGlobs[0].options.Dp[1]}
            unit="Dpy"
            onChange={(value) =>
              state.send("SET_GLOB_OPTIONS", {
                Dp: [selectedGlobs[0].options.Dp[0], value],
              })
            }
          />
        </>
      )}
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
        min={0}
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
  const rInput = useRef<HTMLInputElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  // const [state, setState] = useState(Math.round(Number(value) * 100) / 100)

  function handleKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation()
    // e.key === "Enter" && onChange(state)
  }

  function handleChange({
    currentTarget: { value },
  }: React.ChangeEvent<HTMLInputElement>) {
    const next = Math.round(Number(rPanStart.current) * 100) / 100
    onChange(min !== undefined ? clamp(next, min, max) : next)
    // setState(min !== undefined ? clamp(Number(value), min, max) : Number(value))
  }

  function handlePanStart() {
    document.body.style.cursor = "ew-resize"
  }

  function handlePanEnd() {
    document.body.style.cursor = "default"
  }

  let rPanStart = useRef(Math.round(Number(value) * 100) / 100)

  function handlePan(e: PointerEvent, info: PanInfo) {
    if (!isFocused && value !== "mixed") {
      rPanStart.current += info.delta.x
      const next = Math.round(Number(rPanStart.current) * 100) / 100
      onChange(min !== undefined ? clamp(next, min, max) : next)
    }
  }

  function handleTap() {
    if (isHovered) {
      setIsFocused(true)
      rInput.current!.focus()
    }
  }

  return (
    <PropContainer>
      <label style={{ pointerEvents: "none" }}>{unit}</label>
      <motion.div
        className="dragWrapper"
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        onPanStart={handlePanStart}
        onPanEnd={handlePanEnd}
        onPan={handlePan}
        onTap={handleTap}
      >
        <input
          ref={rInput}
          type="number"
          value={value || 0}
          min={min}
          max={max}
          step={step}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          onBlur={(e) => {
            setIsFocused(false)
            if (value !== "mixed") handleChange(e)
          }}
          style={{ pointerEvents: isFocused ? "all" : "none" }}
        />
      </motion.div>
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

const PropContainer = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  overflow: hidden;
  padding: 4px 8px;
  font-size: 12px;

  & label {
    width: 80px;
  }

  .dragWrapper {
    width: 100%;
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
