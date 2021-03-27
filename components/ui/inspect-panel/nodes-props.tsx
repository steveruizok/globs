import { INode } from "types"
import state, { useSelector } from "lib/state"

import NumberInput from "./inputs/number-input"
import EnumInput from "./inputs/enum-input"
import BoolInput from "./inputs/bool-input"
import { useCallback } from "react"
import { deepCompare, deepCompareArrays } from "lib/utils"

export default function NodesProps() {
  const selectedNodes = useSelector(
    ({ data: { selectedNodes, nodes } }) =>
      selectedNodes.map((id) => nodes[id]),
    deepCompareArrays
  )

  const handleXChange = useCallback(
    (value: number) => state.send("SET_NODES_X", { value }),
    []
  )

  const handleYChange = useCallback(
    (value: number) => state.send("SET_NODES_Y", { value }),
    []
  )

  const handleRadiusChange = useCallback(
    (value: number) => state.send("SET_NODES_RADIUS", { value }),
    []
  )

  const handleCapChange = useCallback(
    (value: string) => state.send("SET_NODES_CAP", { value }),
    []
  )

  const handleLockedChange = useCallback(
    (value: boolean) => state.send("SET_NODES_LOCKED", { value }),
    []
  )

  if (!selectedNodes[0]) return null

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
      <NumberInput value={x} label="x" onChange={handleXChange} />
      <NumberInput value={y} label="y" onChange={handleYChange} />
      <NumberInput
        value={radius}
        label="radius"
        min={0}
        onChange={handleRadiusChange}
      />
      <EnumInput value={cap} label="cap" onChange={handleCapChange}>
        {cap === "mixed" && <option value="mixed">Mixed</option>}
        <option value="round">Round</option>
        <option value="flat">Flat</option>
      </EnumInput>
      <BoolInput label="locked" value={locked} onChange={handleLockedChange} />
    </>
  )
}
