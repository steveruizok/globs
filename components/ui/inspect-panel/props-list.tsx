import { useSelector } from "lib/state"
import { deepCompareArrays } from "lib/utils"
import styled from "styled-components"
import Docs from "./docs"
import NodesProps from "./nodes-props"
import GlobsProps from "./globs-props"

export default function PropsList() {
  const selectedNodes = useSelector(
    (s) => s.data.selectedNodes.map((id) => s.data.nodes[id]).filter(Boolean)
    // deepCompareArrays
  )

  const selectedGlobs = useSelector(
    (s) => s.data.selectedGlobs.map((id) => s.data.globs[id])
    // deepCompareArrays
  )

  return (
    <>
      <section>
        <h2>Properties</h2>
      </section>
      <PropsTable>
        {selectedNodes.length === 0 && selectedGlobs.length === 0 ? (
          <Docs />
        ) : selectedNodes.length > 0 && selectedGlobs.length === 0 ? (
          <NodesProps selectedNodes={selectedNodes} />
        ) : selectedNodes.length === 0 && selectedGlobs.length > 0 ? (
          <GlobsProps selectedGlobs={selectedGlobs} />
        ) : (
          <p>Mixed...</p>
        )}
      </PropsTable>
    </>
  )
}

export const PropsTable = styled.div`
  padding: 8px;
`
