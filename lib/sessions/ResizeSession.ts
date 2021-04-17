import { IData, IGlob, ISelectionSnapshot } from "lib/types"
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
  handleSnapshot: Record<string, { D: number[]; Dp: number[]; mp: number[] }>

  constructor(data: IData, nodeId: string) {
    super(data)
    this.nodeId = nodeId

    const node = data.nodes[nodeId]

    this.startDistance = vec.dist(
      node.point,
      screenToWorld(inputs.pointer.point, data.camera)
    )

    this.snapshot = getSelectionSnapshot(data)
    // this.handleSnapshot = ResizeSession.getHandleSnapshot(data)
    this.origin = screenToWorld(inputs.pointer.point, data.camera)
  }

  update = (data: IData) => {
    const { camera, nodes, selectedNodes } = data
    const node = nodes[this.nodeId]
    const dist = vec.dist(
      node.point,
      screenToWorld(inputs.pointer.point, camera)
    )

    for (const nodeId of selectedNodes) {
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

    // const ratio = dist / this.startDistance

    // for (const globId in this.handleSnapshot) {
    //   const glob = data.globs[globId]
    //   const start = data.nodes[glob.nodes[0]]
    //   const end = data.nodes[glob.nodes[1]]
    //   const snap = this.handleSnapshot[globId]

    //   const mp = vec.nudge(
    //     start.point,
    //     end.point,
    //     vec.dist(start.point, end.point) - (start.radius + end.radius)
    //   )

    //   glob.D = vec.add(snap.mp, vec.mul(snap.D, ratio))
    //   glob.Dp = vec.add(snap.mp, vec.mul(snap.Dp, ratio))
    // }

    updateGlobPoints(data)
  }

  cancel = (data: IData) => {
    const { nodes } = data
    for (const nodeId in this.snapshot.nodes) {
      nodes[nodeId].radius = this.snapshot.nodes[nodeId].radius
    }
    updateGlobPoints(data)
  }

  complete = (data: IData) => {
    resizeNode(data, this.snapshot)
  }

  // static getHandleSnapshot(data: IData) {
  // const selectedNodeIds = new Set(data.selectedNodes)
  // const globHandleSnapshots: Record<
  //   string,
  //   { D: number[]; Dp: number[]; mp: number[]; dist: number }
  // > = {}

  // Find the globs that will be effected when the node resizes.

  // for (const globId in data.globs) {
  //   const glob = data.globs[globId]
  //   if (
  //     selectedNodeIds.has(glob.nodes[0]) ||
  //     selectedNodeIds.has(glob.nodes[1])
  //   ) {
  //     // If a glob is shared between two other globs, we want to move the handles
  //     // in a way that preserves their continuity.

  //     // It looks like... move the handle towards its connection with the non-resizing node
  //     // by a distance equal to the difference in radius sizes.

  //     // Find the vector between the glob's handle and the midpoint between the points.

  //     const start = data.nodes[glob.nodes[0]]
  //     const end = data.nodes[glob.nodes[1]]
  //     const dist = vec.dist(start.point, end.point)
  //     const innerDist =
  //       vec.dist(start.point, end.point) - (start.radius + end.radius)

  //     // const mp = vec.nudge(start.point, end.point, innerDist)
  //     const mp = vec.med(glob.points.C0, glob.points.C1)

  //     globHandleSnapshots[glob.id] = {
  //       D: vec.vec(mp, glob.D),
  //       Dp: vec.vec(mp, glob.Dp),
  //       mp,
  //       dist: vec.dist(start.point, end.point) - (start.radius + end.radius),
  //     }

  //     // As the node's radius changes, we want to scale these distances along with the radius.
  //   }
  // }

  // return globHandleSnapshots
  // }
}
