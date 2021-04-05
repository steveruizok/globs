import * as svg from "lib/svg"
import * as vec from "lib/vec"
import state from "lib/state"
import Anchor from "./anchor"
import Handle from "./handle"
import classNames from "classnames"
import { IGlob } from "lib/types"

interface HandlesProps {
  glob: IGlob
  isDragging: boolean
  isSelected: boolean
  isPrime: boolean
}

export default function Handles({
  glob,
  isDragging,
  isSelected,
  isPrime,
}: HandlesProps) {
  const { points, id } = glob
  const start = isPrime ? points.E0p : points.E0
  const end = isPrime ? points.E1p : points.E1
  const position = isPrime ? points.Dp : points.D

  const [p0, p1] = isPrime ? [points.Dp1, points.Dp2] : [points.D1, points.D2]

  return (
    <g
      className={classNames([
        {
          "opacity-m": !isSelected,
          "opacity-full": isSelected,
        },
      ])}
    >
      {isDragging ? (
        <ExtendedLines
          position={position}
          start={start}
          end={end}
          isPrime={isPrime}
        />
      ) : (
        <path
          d={[
            svg.moveTo(start),
            svg.lineTo(position),
            svg.lineTo(end),
          ].toString()}
          pointerEvents="none"
          className={classNames([
            "fill-none",
            "strokewidth-s",
            "dash-array-m",
            {
              "stroke-left": !isPrime,
              "stroke-right": isPrime,
            },
          ])}
        />
      )}
      {/* Projected Points */}
      <use
        href="#dot"
        x={p0[0]}
        y={p0[1]}
        pointerEvents="none"
        className={classNames({
          "fill-left": !isPrime,
          "fill-right": isPrime,
        })}
      />
      <use
        href="#dot"
        x={p1[0]}
        y={p1[1]}
        pointerEvents="none"
        className={classNames({
          "fill-left": !isPrime,
          "fill-right": isPrime,
        })}
      />
      {/* Anchors */}
      <Anchor
        position={isPrime ? points.F0p : points.F0}
        isSelected={isSelected}
        isPrime={isPrime}
        onSelect={() =>
          state.send("SELECTED_ANCHOR", {
            id,
            anchor: isPrime ? "ap" : "a",
          })
        }
      />
      <Anchor
        position={isPrime ? points.F1p : points.F1}
        isSelected={isSelected}
        isPrime={isPrime}
        onSelect={() =>
          state.send("SELECTED_ANCHOR", {
            id,
            anchor: isPrime ? "bp" : "b",
          })
        }
      />
      {/* Handle */}
      <Handle
        isPrime={isPrime}
        position={position}
        onSelect={() =>
          state.send("POINTED_HANDLE", {
            id,
            handle: isPrime ? "Dp" : "D",
          })
        }
      />
    </g>
  )
}

interface ExtendedLinesProps {
  start: number[]
  end: number[]
  position: number[]
  isPrime: boolean
}

function ExtendedLines({ start, end, position, isPrime }: ExtendedLinesProps) {
  const [n0, n1] = [
    vec.uni(vec.sub(start, position)),
    vec.uni(vec.sub(end, position)),
  ]
  return (
    <path
      d={[
        svg.moveTo(position),
        svg.lineTo(vec.add(position, vec.mul(n0, 10000))),
        svg.moveTo(position),
        svg.lineTo(vec.add(position, vec.mul(n1, 10000))),
      ].join(" ")}
      fill="none"
      stroke="red"
      opacity={0.5}
      pointerEvents="none"
      className={classNames([
        "strokewidth-s",
        "fill-none",
        {
          "stroke-left": !isPrime,
          "stroke-right": isPrime,
        },
      ])}
    />
  )
}
