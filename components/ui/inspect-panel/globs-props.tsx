import state from "lib/state"
import { clamp } from "lib/utils"
import { IGlob } from "lib/types"

import AnchorInput from "./inputs/anchor-input"
import NumberInput from "./inputs/number-input"

export default function GlobsProps({
  selectedGlobs,
}: {
  selectedGlobs: IGlob[]
}) {
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
      <AnchorInput
        value={a}
        label="a"
        onChange={(value) =>
          state.send("SET_GLOB_OPTIONS", { a: clamp(value, 0, 1) })
        }
      />
      <AnchorInput
        value={b}
        label="b"
        onChange={(value) =>
          state.send("SET_GLOB_OPTIONS", { b: clamp(value, 0, 1) })
        }
      />
      <AnchorInput
        value={ap}
        label="ap"
        onChange={(value) =>
          state.send("SET_GLOB_OPTIONS", { ap: clamp(value, 0, 1) })
        }
      />
      <AnchorInput
        value={bp}
        label="bp"
        onChange={(value) =>
          state.send("SET_GLOB_OPTIONS", { bp: clamp(value, 0, 1) })
        }
      />
      {selectedGlobs.length === 1 && (
        <>
          <NumberInput
            value={selectedGlobs[0].options.D[0]}
            label="Dx"
            onChange={(value) =>
              state.send("SET_GLOB_OPTIONS", {
                D: [value, selectedGlobs[0].options.D[1]],
              })
            }
          />
          <NumberInput
            value={selectedGlobs[0].options.D[1]}
            label="Dy"
            onChange={(value) =>
              state.send("SET_GLOB_OPTIONS", {
                D: [selectedGlobs[0].options.D[0], value],
              })
            }
          />
          <NumberInput
            value={selectedGlobs[0].options.Dp[0]}
            label="Dpx"
            onChange={(value) =>
              state.send("SET_GLOB_OPTIONS", {
                Dp: [value, selectedGlobs[0].options.Dp[1]],
              })
            }
          />
          <NumberInput
            value={selectedGlobs[0].options.Dp[1]}
            label="Dpy"
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
