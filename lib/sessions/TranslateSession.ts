import { pointer } from "lib/state"
import { IData } from "lib/types"
import * as vec from "lib/vec"
import BaseSession from "./BaseSession"
import { getSelectionSnapshot, screenToWorld } from "lib/utils"
import { moveSelection } from "lib/commands"

export default class TranslateSession extends BaseSession {
  delta = [0, 0]
  origin: number[]
  snapshot: ReturnType<typeof getSelectionSnapshot>

  constructor(data: IData) {
    super(data)
    this.origin = screenToWorld(pointer.point, data.camera)
    this.snapshot = getSelectionSnapshot(data)
  }

  update = (data: IData) => {
    const { snapshot } = this
    const { nodes, globs, selectedNodes, selectedGlobs } = data
    this.delta = vec.sub(screenToWorld(pointer.point, data.camera), this.origin)

    for (let nodeId of selectedNodes) {
      nodes[nodeId].point = vec.add(snapshot.nodes[nodeId].point, this.delta)
    }

    for (let globId of selectedGlobs) {
      globs[globId].D = vec.add(snapshot.globs[globId].D, this.delta)
      globs[globId].Dp = vec.add(snapshot.globs[globId].Dp, this.delta)
    }
  }

  cancel = (data: IData) => {
    const { snapshot } = this
    const { nodes, globs, selectedNodes, selectedGlobs } = data

    for (let nodeId of selectedNodes) {
      nodes[nodeId].point = snapshot.nodes[nodeId].point
    }

    for (let globId of selectedGlobs) {
      globs[globId].D = snapshot.globs[globId].D
      globs[globId].Dp = snapshot.globs[globId].Dp
    }
  }

  complete = (data: IData) => {
    // Create a command
    moveSelection(data, this.delta, this.snapshot)
  }

  static getSnapshot(data: IData) {
    return getSelectionSnapshot(data)
  }
}
