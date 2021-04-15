import { IAnchor, IData, IGlob, INode, ISelectionSnapshot } from "lib/types"
import BaseSession from "./BaseSession"
import * as vec from "lib/vec"
import inputs from "lib/inputs"
import {
  screenToWorld,
  getGlobPoints,
  getSelectionSnapshot,
  getGlob,
  getGlobClone,
  getNodeClone,
} from "lib/utils"
import MoveSession from "./MoveSession"
import { moveAnchor } from "lib/commands"

export default class CloningSession extends BaseSession {
  private origin: number[]
  private delta: number[]
  private clones: { nodes: Record<string, INode>; globs: Record<string, IGlob> }
  private snapshot: ISelectionSnapshot

  constructor(data: IData) {
    super(data)

    this.clones = CloningSession.getClones(data)
    this.origin = screenToWorld(inputs.pointer.point, data.camera)

    // Add clones to nodes and globs
    for (let id in this.clones.nodes) {
      data.nodes[id] = this.clones.nodes[id]
    }

    for (let id in this.clones.globs) {
      data.globs[id] = this.clones.globs[id]
    }

    data.nodeIds = Object.keys(data.nodes)
    data.globIds = Object.keys(data.globs)

    data.selectedGlobs = Object.keys(this.clones.globs)
    data.selectedNodes = Object.keys(this.clones.nodes)

    this.snapshot = getSelectionSnapshot(data)
  }

  update = (data: IData) => {
    const { camera } = data

    this.delta = vec.vec(
      this.origin,
      screenToWorld(inputs.pointer.point, camera)
    )

    // Move stuff...
    MoveSession.moveSelection(data, this.delta, this.snapshot)
  }

  cancel = (data: IData) => {}

  complete = (data: IData) => {}

  static getClones(data: IData) {
    const nodesToSnapshot = new Set(data.selectedNodes)

    for (let globId of data.selectedGlobs) {
      nodesToSnapshot.add(data.globs[globId].nodes[0])
      nodesToSnapshot.add(data.globs[globId].nodes[1])
    }

    const nodes = Object.fromEntries(
      Array.from(nodesToSnapshot.values()).map((nodeId) => {
        const node = getNodeClone(data.nodes[nodeId])
        return [node.id, node]
      })
    )

    const globs = Object.fromEntries(
      data.selectedGlobs.map((globId) => {
        const glob = getGlobClone(data.globs[globId])
        return [glob.id, glob]
      })
    )

    return {
      nodes,
      globs,
    }
  }
}
