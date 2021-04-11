import { IData } from "lib/types"
import BaseSession from "./BaseSession"
import * as vec from "lib/vec"
import inputs from "lib/sinputs"
import { round, screenToWorld, updateGlobPoints } from "lib/utils"
import { resizeNode } from "lib/commands"

export interface ResizeSessionSnapshot {
  radius: number
}

export default class ResizeSession extends BaseSession {
  nodeId: string
  origin: number[]
  startDistance: number
  startRadius: number

  constructor(data: IData, nodeId: string) {
    super(data)
    this.nodeId = nodeId

    const node = data.nodes[nodeId]

    this.startDistance = vec.dist(
      node.point,
      screenToWorld(inputs.pointer.point, data.camera)
    )

    this.startRadius = node.radius

    this.origin = screenToWorld(inputs.pointer.point, data.camera)
  }

  update = (data: IData) => {
    const { camera, nodes } = data
    const node = nodes[this.nodeId]
    const dist = vec.dist(
      node.point,
      screenToWorld(inputs.pointer.point, camera)
    )

    if (inputs.keys.Shift) {
      node.radius = dist
    } else {
      node.radius = round(this.startRadius + (dist - this.startDistance))
    }

    updateGlobPoints(data)
  }

  cancel = (data: IData) => {
    const { camera, nodes } = data
    const node = nodes[this.nodeId]
    node.radius = this.startRadius
    updateGlobPoints(data)
  }

  complete = (data: IData) => {
    resizeNode(data, this.nodeId, this.startRadius)
  }

  static getSnapshot(data: IData, id: string) {
    const { nodes } = data
    const node = nodes[id]
    return {
      radius: node.radius,
    }
  }
}
