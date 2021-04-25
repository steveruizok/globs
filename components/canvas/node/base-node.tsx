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

const BaseNode = forwardRef<SVGCircleElement, Props>(function BaseNode(
  { id, cx, cy, r, isGlobbed, isFilled, isSelected, isLocked }: Props,
  ref
) {
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
        onPointerDown={(e) => {
          if (e.buttons === 2) {
            state.send("RIGHT_CLICKED_NODE", {
              id,
              shiftKey: e.shiftKey,
              optionKey: e.altKey,
              metaKey: e.metaKey || e.ctrlKey,
              ctrlKey: e.ctrlKey,
              buttons: e.buttons,
            })
          }

          if (e.buttons !== 1) return
          state.send("POINTED_NODE", {
            id,
            shiftKey: e.shiftKey,
            optionKey: e.altKey,
            metaKey: e.metaKey || e.ctrlKey,
            ctrlKey: e.ctrlKey,
            buttons: e.buttons,
          })
        }}
        onDoubleClick={(e) => {
          if (e.buttons !== 1) return
          state.send("TOGGLED_CAP", {
            id,
            shiftKey: e.shiftKey,
            optionKey: e.altKey,
            metaKey: e.metaKey || e.ctrlKey,
            ctrlKey: e.ctrlKey,
            buttons: e.buttons,
          })
        }}
        onPointerEnter={(e) => {
          e.stopPropagation()
          if (e.buttons !== 1) return
          state.send("HOVERED_NODE", {
            id,
            shiftKey: e.shiftKey,
            optionKey: e.altKey,
            metaKey: e.metaKey || e.ctrlKey,
            ctrlKey: e.ctrlKey,
            buttons: e.buttons,
          })
        }}
        onPointerOut={(e) => {
          if (e.buttons !== 1) return
          state.send("UNHOVERED_NODE", {
            id,
            shiftKey: e.shiftKey,
            optionKey: e.altKey,
            metaKey: e.metaKey || e.ctrlKey,
            ctrlKey: e.ctrlKey,
            buttons: e.buttons,
          })
        }}
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
            pointerEvents="none"
          />
        ))}
    </>
  )
})

export default BaseNode
