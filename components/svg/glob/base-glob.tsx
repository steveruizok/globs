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

const BaseGlob = forwardRef<SVGPathElement, Props>(
  ({ id, points, isFilled, isSelected, startCap, endCap }, ref) => {
    const outline = getGlobOutline(points, startCap, endCap)

    return (
      <path
        ref={ref}
        d={outline}
        onPointerDown={() => state.send("SELECTED_GLOB", { id })}
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
  }
)

export default BaseGlob
