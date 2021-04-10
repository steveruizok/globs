import state, { useSelector } from "lib/state"
import { clamp, deepCompareArrays } from "lib/utils"

import NumberInput from "./inputs/number-input"
import { useCallback } from "react"

export default function GlobsProps() {
  const selectedGlobs = useSelector(({ data: { selectedGlobs, globs } }) =>
    selectedGlobs.map((id) => globs[id], deepCompareArrays)
  )

  const handleAChange = useCallback(
    (value: number) =>
      state.send("SET_GLOB_OPTIONS", { a: clamp(value, 0, 1) }),
    []
  )

  const handleApChange = useCallback(
    (value: number) =>
      state.send("SET_GLOB_OPTIONS", { ap: clamp(value, 0, 1) }),
    []
  )

  const handleBChange = useCallback(
    (value: number) =>
      state.send("SET_GLOB_OPTIONS", { b: clamp(value, 0, 1) }),
    []
  )

  const handleBpChange = useCallback(
    (value: number) =>
      state.send("SET_GLOB_OPTIONS", { bp: clamp(value, 0, 1) }),
    []
  )

  const handleDxChange = useCallback(
    (value: number) =>
      state.send("SET_GLOB_OPTIONS", {
        D: [value, selectedGlobs[0].D[1]],
      }),
    []
  )

  const handleDyChange = useCallback(
    (value: number) =>
      state.send("SET_GLOB_OPTIONS", {
        D: [selectedGlobs[0].D[0], value],
      }),
    []
  )

  const handleDpxChange = useCallback(
    (value: number) =>
      state.send("SET_GLOB_OPTIONS", {
        Dp: [value, selectedGlobs[0].D[1]],
      }),
    []
  )

  const handleDpyChange = useCallback(
    (value: number) =>
      state.send("SET_GLOB_OPTIONS", {
        Dp: [selectedGlobs[0].D[0], value],
      }),
    []
  )

  if (selectedGlobs.length === 0) return null

  const a = selectedGlobs.reduce(
    (a, c) => (c.a === a ? a : "mixed"),
    selectedGlobs[0].a
  )

  const b = selectedGlobs.reduce(
    (a, c) => (c.b === a ? a : "mixed"),
    selectedGlobs[0].b
  )

  const ap = selectedGlobs.reduce(
    (a, c) => (c.ap === a ? a : "mixed"),
    selectedGlobs[0].ap
  )

  const bp = selectedGlobs.reduce(
    (a, c) => (c.bp === a ? a : "mixed"),
    selectedGlobs[0].bp
  )

  return (
    <>
      <NumberInput
        value={a}
        label="a"
        min={0}
        max={1}
        onChange={handleAChange}
        onPanStart={() =>
          state.send("STARTED_TRANSLATING", {
            type: "anchor",
            anchor: "a",
          })
        }
      />
      <NumberInput
        value={b}
        label="b"
        min={0}
        max={1}
        onChange={handleBChange}
        onPanStart={() =>
          state.send("STARTED_TRANSLATING", {
            type: "anchor",
            anchor: "b",
          })
        }
      />
      <NumberInput
        value={ap}
        label="ap"
        min={0}
        max={1}
        onChange={handleApChange}
        onPanStart={() =>
          state.send("STARTED_TRANSLATING", {
            type: "anchor",
            anchor: "ap",
          })
        }
      />
      <NumberInput
        value={bp}
        label="bp"
        min={0}
        max={1}
        onChange={handleBpChange}
        onPanStart={() =>
          state.send("STARTED_TRANSLATING", {
            type: "anchor",
            anchor: "bp",
          })
        }
      />
      {selectedGlobs.length === 1 && (
        <>
          <NumberInput
            value={selectedGlobs[0].D[0]}
            label="Dx"
            onChange={handleDxChange}
            onPanStart={() =>
              state.send("STARTED_TRANSLATING", {
                type: "handle",
                handle: "D",
                axis: "x",
              })
            }
          />
          <NumberInput
            value={selectedGlobs[0].D[1]}
            label="Dy"
            onChange={handleDyChange}
            onPanStart={() =>
              state.send("STARTED_TRANSLATING", {
                type: "handle",
                handle: "D",
                axis: "y",
              })
            }
          />
          <NumberInput
            value={selectedGlobs[0].Dp[0]}
            label="Dpx"
            onChange={handleDpxChange}
            onPanStart={() =>
              state.send("STARTED_TRANSLATING", {
                type: "handle",
                handle: "Dp",
                axis: "x",
              })
            }
          />
          <NumberInput
            value={selectedGlobs[0].Dp[1]}
            label="Dpy"
            onChange={handleDpyChange}
            onPanStart={() =>
              state.send("STARTED_TRANSLATING", {
                type: "handle",
                handle: "Dp",
                axis: "y",
              })
            }
          />
        </>
      )}
    </>
  )
}
