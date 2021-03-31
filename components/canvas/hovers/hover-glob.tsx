import state, { useSelector } from "lib/state"
import { deepCompare, getGlob, getGlobOutline } from "lib/utils"
import { useRef } from "react"

interface Props {
  id: string
}

export default function HoverGlob({ id }: Props) {
  const glob = useSelector((s) => s.data.globs[id], deepCompare)

  const rPrevPts = useRef<ReturnType<typeof getGlob>>()

  if (!glob) return null

  const nodes = glob?.nodes.map((id) => state.data.nodes[id])

  const { D, Dp, a, b, ap, bp } = glob.options

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
    <path
      d={getGlobOutline(globPts, cap0, cap1)}
      fill="rgba(255, 0, 0, .12)"
      pointerEvents="none"
    />
  )
}
