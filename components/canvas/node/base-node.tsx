import classNames from "classnames"
import state from "lib/state"
import { forwardRef } from "react"

interface Props {
  id: string
  cx: number
  cy: number
  r: number
  isGlobbed: boolean
  isFilled: boolean
  isSelected: boolean
  isLocked: boolean
}

const BaseNode = forwardRef<SVGCircleElement, Props>(
  ({ id, cx, cy, r, isGlobbed, isFilled, isSelected, isLocked }, ref) => {
    return (
      <>
        <circle
          ref={ref}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          className={classNames([
            "strokewidth-m",
            {
              "fill-flat": !isGlobbed && isFilled,
              "fill-soft": !isGlobbed && !isFilled,
              "stroke-none": isFilled,
              "stroke-selected": !isGlobbed && !isFilled && isSelected,
              "stroke-outline": !isGlobbed && !isFilled && !isSelected,
            },
          ])}
          pointerEvents="none"
        />
        <circle
          cx={cx}
          cy={cy}
          r={Math.max(r, 8)}
          fill="transparent"
          stroke="transparent"
          onPointerDown={() => state.send("POINTED_NODE", { id })}
          onDoubleClick={() => state.send("TOGGLED_CAP", { id })}
          onPointerEnter={(e) => {
            e.stopPropagation()
            state.send("HOVERED_NODE", { id })
          }}
          onPointerOut={() => state.send("UNHOVERED_NODE", { id })}
        />
        {!isFilled &&
          (isLocked ? (
            <use
              href="#anchor"
              x={cx}
              y={cy}
              className="stroke-outline strokewidth-m dash-array-m"
              pointerEvents="none"
              fill="none"
            />
          ) : (
            <use
              href="#dot"
              x={cx}
              y={cy}
              className="fill-flat"
              stroke="none"
            />
          ))}
      </>
    )
  }
)

export default BaseNode
