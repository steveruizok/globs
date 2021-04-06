import Snaps from "./snaps"
import Brush from "./brush"
import Bounds from "./bounds/bounds"
import BoundsBg from "./bounds/bounds-bg"
import Contents from "./contents"
import HoveredGlobs from "./hovers/hovered-globs"
import HoveredNodes from "./hovers/hovered-nodes"
import { memo } from "react"

function Canvas() {
  return (
    <g>
      <BoundsBg />
      <Contents />
      <Snaps />
      <HoveredNodes />
      <HoveredGlobs />
      <Bounds />
      <Brush />
    </g>
  )
}

export default memo(Canvas)
