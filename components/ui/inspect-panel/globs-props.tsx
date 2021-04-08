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
        D: [value, selectedGlobs[0].options.D[1]],
      }),
    []
  )

  const handleDyChange = useCallback(
    (value: number) =>
      state.send("SET_GLOB_OPTIONS", {
        D: [selectedGlobs[0].options.D[0], value],
      }),
    []
  )

  const handleDpxChange = useCallback(
    (value: number) =>
      state.send("SET_GLOB_OPTIONS", {
        Dp: [value, selectedGlobs[0].options.D[1]],
      }),
    []
  )

  const handleDpyChange = useCallback(
    (value: number) =>
      state.send("SET_GLOB_OPTIONS", {
        Dp: [selectedGlobs[0].options.D[0], value],
      }),
    []
  )

  if (selectedGlobs.length === 0) return null

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
      <NumberInput
        value={a}
        label="a"
        min={0}
        max={1}
        onChange={handleAChange}
      />
      <NumberInput
        value={b}
        label="b"
        min={0}
        max={1}
        onChange={handleApChange}
      />
      <NumberInput
        value={ap}
        label="ap"
        min={0}
        max={1}
        onChange={handleBChange}
      />
      <NumberInput
        value={bp}
        label="bp"
        min={0}
        max={1}
        onChange={handleBpChange}
      />
      {selectedGlobs.length === 1 && (
        <>
          <NumberInput
            value={selectedGlobs[0].options.D[0]}
            label="Dx"
            onChange={handleDxChange}
          />
          <NumberInput
            value={selectedGlobs[0].options.D[1]}
            label="Dy"
            onChange={handleDyChange}
          />
          <NumberInput
            value={selectedGlobs[0].options.Dp[0]}
            label="Dpx"
            onChange={handleDpxChange}
          />
          <NumberInput
            value={selectedGlobs[0].options.Dp[1]}
            label="Dpy"
            onChange={handleDpyChange}
          />
        </>
      )}
    </>
  )
}
