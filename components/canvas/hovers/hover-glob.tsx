import state, { useSelector } from "lib/state"
import { deepCompare, getGlob, getGlobOutline } from "lib/utils"
import { useRef } from "react"
import CenterLine from "../glob/center-line"

interface Props {
  id: string
  isSelected: boolean
}

export default function HoverGlob({ id, isSelected }: Props) {
  const glob = useSelector((s) => s.data.globs[id], deepCompare)

  if (!glob) return null

  const nodes = glob?.nodes.map((id) => state.data.nodes[id])

  if (!nodes.every(Boolean)) return null

  const [{ cap: cap0 }, { cap: cap1 }] = nodes

  return (
    <>
      <path
        d={getGlobOutline(glob.points, cap0, cap1)}
        className="fill-hover"
        pointerEvents="none"
      />
      {isSelected && <CenterLine glob={glob} />}
    </>
  )
}
