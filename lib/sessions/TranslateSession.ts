import { pointer } from "lib/state"
import { IData } from "lib/types"
import * as vec from "lib/vec"
import BaseSession from "./BaseSession"
import { getPositionSnapshot, screenToWorld } from "./session-utils"

export default class TranslateSession extends BaseSession {
  delta = [0, 0]
  origin: number[]
  snapshot: ReturnType<typeof getPositionSnapshot>

  constructor(data: IData) {
    super(data)
    this.origin = screenToWorld(pointer.point, data.camera)
    this.snapshot = getPositionSnapshot(data)
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
    // Clean up the change
  }

  complete = (data: IData) => {
    // Create a command
  }

  static getSnapshot(data: IData) {
    return getPositionSnapshot(data)
  }
}
