import { useSelector } from "lib/state"
import { deepCompareArrays } from "lib/utils"
import { styled } from "stitches.config"
import Docs from "./docs"
import NodesProps from "./nodes-props"
import GlobsProps from "./globs-props"
import BoundsProps from "./bounds-props"

export default function PropsList() {
  const selectedNodes = useSelector((s) => s.data.selectedNodes)
  const selectedGlobs = useSelector((s) => s.data.selectedGlobs)

  if (selectedNodes.length === 0 && selectedGlobs.length === 0) return null

  return (
    <>
      <section>
        <h2>Properties</h2>
      </section>
      <PropsTable>
        {selectedNodes.length > 0 && selectedGlobs.length === 0 ? (
          <NodesProps />
        ) : selectedNodes.length === 0 && selectedGlobs.length > 0 ? (
          <GlobsProps />
        ) : (
          <BoundsProps />
        )}
      </PropsTable>
    </>
  )
}

export const PropsTable = styled("div", {
  padding: "8px",
})
