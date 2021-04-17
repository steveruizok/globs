import { IData, IGlob, INode } from "./types"
import { current } from "immer"
import { pasteSelection } from "./commands"
import state from "./state"

interface Copied {
  nodes: Record<string, INode>
  globs: Record<string, IGlob>
}

class Clipboard {
  copied: string

  copy = (data: IData) => {
    const { nodes: sNodes, globs: sGlobs } = current(data)

    const sNodeIds = new Set(data.selectedNodes)

    for (const globId of data.selectedGlobs) {
      sNodeIds.add(sGlobs[globId].nodes[0])
      sNodeIds.add(sGlobs[globId].nodes[1])
    }

    const nodes = Object.fromEntries(
      Array.from(sNodeIds.values()).map((id) => [id, sNodes[id]])
    )

    const globs = Object.fromEntries(
      data.selectedGlobs.map((id) => [id, sGlobs[id]])
    )

    this.copied = JSON.stringify({ nodes, globs })
    navigator.clipboard.writeText(this.copied)
  }

  startPaste = async () => {
    const fromClipboard = await navigator.clipboard.readText()

    let toPaste: Copied

    if (fromClipboard) {
      const copied = JSON.parse(fromClipboard)
      if ("nodes" in copied && "globs" in copied) {
        toPaste = copied
      }
    } else {
      toPaste = JSON.parse(this.copied)
    }

    if (!toPaste) return

    const nodeIdMap: Record<string, string> = {}

    const nodes = Object.fromEntries(
      Object.entries(toPaste.nodes).map(([key, node]) => {
        const id = "node_p_" + Date.now() * Math.random()
        node.id = id
        nodeIdMap[key] = id
        return [id, node]
      })
    )

    const globs = Object.fromEntries(
      Object.values(toPaste.globs).map((glob) => {
        const id = "glob_p_" + Date.now() * Math.random()
        glob.id = id
        glob.nodes = glob.nodes.map((nodeId) => nodeIdMap[nodeId] || nodeId)
        return [id, glob]
      })
    )

    state.send("FINISHED_PASTE", { nodes, globs })
  }

  finishPaste = (data: IData, copied: Copied) => {
    pasteSelection(data, copied)
  }
}

export default new Clipboard()
