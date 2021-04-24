import classNames from "classnames"
import state from "lib/state"
import { IGlobPoints } from "lib/types"
import { getGlobOutline } from "lib/utils"
import { forwardRef } from "react"

interface Props {
  id: string
  points: IGlobPoints
  isFilled: boolean
  isSelected: boolean
  startCap: "round" | "flat"
  endCap: "round" | "flat"
}

const BaseGlob = forwardRef<SVGPathElement, Props>(function BaseGlob(
  { id, points, isFilled, isSelected, startCap, endCap }: Props,
  ref
) {
  const outline = getGlobOutline(points, startCap, endCap)

  return (
    <path
      ref={ref}
      d={outline}
      onPointerDown={(e) => {
        if (e.buttons === 2) {
          state.send("RIGHT_CLICKED_GLOB", {
            id,
            shiftKey: e.shiftKey,
            optionKey: e.altKey,
            metaKey: e.metaKey || e.ctrlKey,
            ctrlKey: e.ctrlKey,
            buttons: e.buttons,
          })
        }

        if (e.buttons !== 1) return

        state.send("POINTED_GLOB", {
          id,
          shiftKey: e.shiftKey,
          optionKey: e.altKey,
          metaKey: e.metaKey || e.ctrlKey,
          ctrlKey: e.ctrlKey,
          buttons: e.buttons,
        })
      }}
      className={classNames([
        "strokewidth-m",
        {
          "stroke-selected": !isFilled && isSelected,
          "stroke-outline": !isFilled && !isSelected,
          "fill-flat": isFilled,
          "fill-soft": !isFilled,
        },
      ])}
    />
  )
})

export default BaseGlob
