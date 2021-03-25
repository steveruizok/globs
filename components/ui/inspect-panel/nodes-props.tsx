import { INode } from "types"
import state from "lib/state"

import NumberInput from "./inputs/number-input"
import EnumInput from "./inputs/enum-input"
import BoolInput from "./inputs/bool-input"

export default function NodesProps({
  selectedNodes,
}: {
  selectedNodes: INode[]
}) {
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
      <NumberInput
        value={x}
        label="x"
        onChange={(value) => state.send("SET_NODES_X", { value })}
      />
      <NumberInput
        value={y}
        label="y"
        onChange={(value) => state.send("SET_NODES_Y", { value })}
      />
      <NumberInput
        value={radius}
        label="radius"
        min={0}
        onChange={(value) => state.send("SET_NODES_RADIUS", { value })}
      />
      <EnumInput
        value={cap}
        label="cap"
        onChange={(value) => state.send("SET_NODES_CAP", { value })}
      >
        {cap === "mixed" && <option value="mixed">Mixed</option>}
        <option value="round">Round</option>
        <option value="flat">Flat</option>
      </EnumInput>
      <BoolInput
        label="locked"
        value={locked}
        onChange={(value) => state.send("SET_NODES_LOCKED", { value })}
      />
    </>
  )
}
