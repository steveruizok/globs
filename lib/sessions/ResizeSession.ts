import { IAnchor, IData } from "lib/types"
import BaseSession from "./BaseSession"
import * as vec from "lib/vec"
import { screenToWorld, updateGlobPoints } from "./session-utils"
import { keys, pointer } from "lib/state"
import { getGlob } from "lib/utils"
import { commands } from "lib/history"

export interface ResizeSessionSnapshot {
  radius: number
}

export default class ResizeSession extends BaseSession {
  nodeId: string
  origin: number[]
  oDistance: number
  snapshot: ResizeSessionSnapshot

  constructor(data: IData, nodeId: string) {
    super(data)
    this.nodeId = nodeId

    const node = data.nodes[nodeId]

    this.oDistance = vec.dist(
      node.point,
      screenToWorld(pointer.point, data.camera)
    )

    this.snapshot = ResizeSession.getSnapshot(data, nodeId)

    this.origin = screenToWorld(pointer.point, data.camera)
  }

  update = (data: IData) => {
    const { camera, nodes } = data
    const node = nodes[this.nodeId]
    const dist = vec.dist(this.origin, screenToWorld(pointer.point, camera))
    if (keys.Meta) {
      node.radius = dist
    } else {
      node.radius = this.snapshot.radius + (dist - this.oDistance)
    }
    updateGlobPoints(data)
  }

  cancel = (data: IData) => {
    const { camera, nodes } = data
    const node = nodes[this.nodeId]
    node.radius = this.snapshot.radius
    updateGlobPoints(data)
  }

  complete = (data: IData) => {
    commands.resizeNode(data, this.nodeId, this.snapshot)
  }

  static getSnapshot(data: IData, id: string) {
    const { nodes } = data
    const node = nodes[id]
    return {
      radius: node.radius,
    }
  }
}
