import classNames from "classnames"
import state from "lib/state"
import { forwardRef } from "react"

interface Props {
  id: string
  cx: number
  cy: number
  r: number
  isFilled: boolean
  isSelected: boolean
  isLocked: boolean
}

const BaseNode = forwardRef<SVGCircleElement, Props>(
  ({ id, cx, cy, r, isFilled, isSelected, isLocked }, ref) => {
    return (
      <>
        <circle
          ref={ref}
          cx={cx}
          cy={cy}
          r={r}
          className={classNames([
            "strokewidth-m",
            {
              "fill-flat": isFilled,
              "fill-soft": !isFilled,
              "stroke-none": isFilled,
              "stroke-selected": !isFilled && isSelected,
              "stroke-outline": !isFilled && !isSelected,
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
          onPointerDown={() => state.send("SELECTED_NODE", { id })}
          onDoubleClick={() => state.send("TOGGLED_CAP", { id })}
          onPointerOver={() => state.send("HOVERED_NODE", { id })}
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
