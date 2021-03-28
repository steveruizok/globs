import state, { elms } from "lib/state"
import { useEffect, useRef, useState } from "react"
import { IBounds } from "types"
// import { getBounds } from "utils"
// This is a pretty brute-force way of doing things; however because
// we can't measure our bounding box until we've rendered elements and
// their changes (at which time we can use their getBBox methods), we
// need to do everything as an effect.

export default function useBoundingBox() {
  // const rBounds = useRef("")
  // const [bounds, setBounds] = useState<IBounds | false>()
  // useEffect(() => {
  //   return state.onUpdate((state) => {
  //     const selectedElms: SVGPathElement[] = []
  //     for (let id of state.data.selectedNodes) {
  //       selectedElms.push(elms[id])
  //     }
  //     for (let id of state.data.selectedGlobs) {
  //       selectedElms.push(elms[id])
  //     }
  //     if (selectedElms.length < 2) {
  //       if (rBounds.current) {
  //         rBounds.current = ""
  //         setBounds(false)
  //       }
  //       return
  //     }
  //     const next = getBounds(selectedElms.filter(Boolean))
  //     const sNext = JSON.stringify(next)
  //     if (sNext !== rBounds.current) {
  //       rBounds.current = sNext
  //       setBounds(next)
  //     }
  //   })
  // }, [])
  // return bounds
}
