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

  const rPrevPts = useRef<ReturnType<typeof getGlob>>()

  if (!glob) return null

  const nodes = glob?.nodes.map((id) => state.data.nodes[id])

  if (!nodes.every(Boolean)) return null

  const { D, Dp, a, b, ap, bp } = glob

  const [
    { point: C0, radius: r0, cap: cap0 },
    { point: C1, radius: r1, cap: cap1 },
  ] = nodes

  let globPts = rPrevPts.current

  try {
    rPrevPts.current = globPts = getGlob(C0, r0, C1, r1, D, Dp, a, b, ap, bp)
  } catch (e) {
    return null
  }

  return (
    <>
      <path
        d={getGlobOutline(globPts, cap0, cap1)}
        className="fill-hover"
        pointerEvents="none"
      />
      {isSelected && <CenterLine glob={glob} />}
    </>
  )
}
