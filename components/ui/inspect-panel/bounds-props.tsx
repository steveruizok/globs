import { INode } from "types"
import state, { useSelector } from "lib/state"

import NumberInput from "./inputs/number-input"
import EnumInput from "./inputs/enum-input"
import BoolInput from "./inputs/bool-input"
import { useCallback } from "react"
import { deepCompare, round } from "lib/utils"

export default function BoundsProps() {
  const bounds = useSelector((s) => s.values.selectionBounds, deepCompare)
  // const selectedNodes = useSelector(
  //   ({ data: { selectedNodes, nodes } }) =>
  //     selectedNodes.map((id) => nodes[id]),
  //   deepCompareArrays
  // )

  const handleXChange = useCallback(
    (value: number) => state.send("CHANGED_BOUNDS_X", { value }),
    []
  )

  const handleYChange = useCallback(
    (value: number) => state.send("CHANGED_BOUNDS_Y", { value }),
    []
  )

  const handleWidthChange = useCallback(
    (value: number) => state.send("CHANGED_BOUNDS_WIDTH", { value }),
    []
  )

  const handleHeightChange = useCallback(
    (value: number) => state.send("CHANGED_BOUNDS_HEIGHT", { value }),
    []
  )

  const handleRotationChange = useCallback(
    (value: number) => state.send("ROTATED_BOUNDS", { value }),
    []
  )

  const handleLockedChange = useCallback(
    (value: boolean) => state.send("SET_NODES_LOCKED", { value }),
    []
  )

  if (!bounds) return null

  const { x, y, width, height } = bounds

  // const locked = selectedNodes.reduce(
  //   (a, c) => (c.locked === a ? a : "mixed"),
  //   selectedNodes[0].locked
  // )

  return (
    <>
      <NumberInput
        value={round(x)}
        label="x"
        onChange={handleXChange}
        onPanStart={() =>
          state.send("STARTED_TRANSLATING", { type: "point", axis: "x" })
        }
      />
      <NumberInput
        value={round(y)}
        label="y"
        onChange={handleYChange}
        onPanStart={() =>
          state.send("STARTED_TRANSLATING", { type: "point", axis: "y" })
        }
      />
      <NumberInput
        value={round(width)}
        label="width"
        onChange={handleWidthChange}
      />
      <NumberInput
        value={round(height)}
        label="height"
        onChange={handleHeightChange}
      />
      {/* <BoolInput label="locked" value={locked} onChange={handleLockedChange} /> */}
    </>
  )
}
