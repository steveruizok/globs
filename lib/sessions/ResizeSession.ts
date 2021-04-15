import { IData, ISelectionSnapshot } from "lib/types"
import BaseSession from "./BaseSession"
import * as vec from "lib/vec"
import inputs from "lib/inputs"
import {
  clamp,
  getSelectionSnapshot,
  round,
  screenToWorld,
  updateGlobPoints,
} from "lib/utils"
import { resizeNode } from "lib/commands"

export interface ResizeSessionSnapshot {
  radius: number
}

export default class ResizeSession extends BaseSession {
  nodeId: string
  origin: number[]
  startDistance: number
  snapshot: ISelectionSnapshot

  constructor(data: IData, nodeId: string) {
    super(data)
    this.nodeId = nodeId

    const node = data.nodes[nodeId]

    this.startDistance = vec.dist(
      node.point,
      screenToWorld(inputs.pointer.point, data.camera)
    )

    this.snapshot = getSelectionSnapshot(data)
    this.origin = screenToWorld(inputs.pointer.point, data.camera)
  }

  update = (data: IData) => {
    const { camera, nodes, selectedNodes } = data
    const node = nodes[this.nodeId]
    const dist = vec.dist(
      node.point,
      screenToWorld(inputs.pointer.point, camera)
    )

    for (let nodeId of selectedNodes) {
      const node = nodes[nodeId]
      if (inputs.keys.Shift) {
        node.radius = dist
      } else {
        node.radius = round(
          clamp(
            this.snapshot.nodes[nodeId].radius + (dist - this.startDistance),
            0
          )
        )
      }
    }

    updateGlobPoints(data)
  }

  cancel = (data: IData) => {
    const { nodes } = data
    for (let nodeId in this.snapshot.nodes) {
      nodes[nodeId].radius = this.snapshot.nodes[nodeId].radius
    }
    updateGlobPoints(data)
  }

  complete = (data: IData) => {
    resizeNode(data, this.snapshot)
  }
}
