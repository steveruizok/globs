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

export type ResizeSessionHandleSnapshot = Record<
  string,
  {
    D: number[]
    Dp: number[]
    E0: number[]
    E0p: number[]
    E1: number[]
    E1p: number[]
    E0n?: number[]
    E0pn?: number[]
    E1n?: number[]
    E1pn?: number[]
  }
>

export default class ResizeSession extends BaseSession {
  nodeId: string
  origin: number[]
  startDistance: number
  snapshot: ISelectionSnapshot
  handleSnapshot: ResizeSessionHandleSnapshot

  constructor(data: IData, nodeId: string) {
    super(data)
    this.nodeId = nodeId

    const node = data.nodes[nodeId]

    this.startDistance = vec.dist(
      node.point,
      screenToWorld(inputs.pointer.point, data.camera)
    )

    this.snapshot = getSelectionSnapshot(data)
    this.handleSnapshot = ResizeSession.getHandleSnapshot(data)
    this.origin = screenToWorld(inputs.pointer.point, data.camera)
  }

  update = (data: IData) => {
    const { camera, nodes, globs, selectedNodes } = data
    const node = nodes[this.nodeId]
    const dist = vec.dist(
      node.point,
      screenToWorld(inputs.pointer.point, camera)
    )

    const delta = dist - this.startDistance

    for (const nodeId of selectedNodes) {
      const node = nodes[nodeId]
      if (inputs.modifiers.optionKey) {
        node.radius = dist
      } else {
        node.radius = round(
          clamp(this.snapshot.nodes[nodeId].radius + delta, 0)
        )
      }
    }

    if (inputs.modifiers.shiftKey) {
      for (const globId in this.handleSnapshot) {
        const glob = globs[globId]
        const snap = this.handleSnapshot[globId]

        if (snap.E0n && snap.E0pn && snap.E1n && snap.E1pn) {
          const ccw0 = vec.clockwise(snap.E0, snap.D, snap.E1)
          glob.D = vec.nudge(
            vec.nudge(snap.D, snap.E0, ccw0 ? -delta : delta),
            snap.E1,
            ccw0 ? -delta : delta
          )

          const ccw1 = vec.clockwise(snap.E0p, snap.Dp, snap.E1p)
          glob.Dp = vec.nudge(
            (glob.Dp = vec.nudge(snap.Dp, snap.E0p, ccw1 ? delta : -delta)),
            snap.E1p,
            ccw1 ? delta : -delta
          )
        } else if (snap.E0n && snap.E0pn) {
          glob.D = vec.nudge(
            snap.D,
            snap.E1,
            vec.clockwise(snap.E0, snap.D, snap.E1) ? -delta : delta
          )
          glob.Dp = vec.nudge(
            snap.Dp,
            snap.E1p,
            vec.clockwise(snap.E0p, snap.Dp, snap.E1p) ? delta : -delta
          )
        } else if (snap.E1n && snap.E1pn) {
          glob.D = vec.nudge(
            snap.D,
            snap.E0,
            vec.clockwise(snap.E0, snap.D, snap.E1) ? -delta : delta
          )
          glob.Dp = vec.nudge(
            snap.Dp,
            snap.E0p,
            vec.clockwise(snap.E0p, snap.Dp, snap.E1p) ? delta : -delta
          )
        }
      }
    } else {
      for (const globId in this.handleSnapshot) {
        const glob = globs[globId]
        const snap = this.handleSnapshot[globId]
        glob.D = snap.D
        glob.Dp = snap.Dp
      }
    }

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
    resizeNode(data, this.snapshot, this.handleSnapshot)
  }

  static getHandleSnapshot(data: IData) {
    const selectedNodeIds = new Set(data.selectedNodes)

    const globHandleSnapshots: ResizeSessionHandleSnapshot = {}

    // Find the globs that will be effected when the node resizes.

    for (const globId in data.globs) {
      const glob = data.globs[globId]
      if (
        selectedNodeIds.has(glob.nodes[0]) ||
        selectedNodeIds.has(glob.nodes[1])
      ) {
        const start = data.nodes[glob.nodes[0]]
        const end = data.nodes[glob.nodes[1]]

        const snap: ResizeSessionHandleSnapshot[keyof ResizeSessionHandleSnapshot] = (globHandleSnapshots[
          glob.id
        ] = {
          D: [...glob.D],
          Dp: [...glob.Dp],
          E0: [...glob.points.E0],
          E1: [...glob.points.E1],
          E0p: [...glob.points.E0p],
          E1p: [...glob.points.E1p],
        })

        if (selectedNodeIds.has(glob.nodes[0])) {
          snap.E0n = vec.uni(vec.vec(start.point, glob.points.E1))
          snap.E0pn = vec.uni(vec.vec(start.point, glob.points.E1p))
        }

        if (selectedNodeIds.has(glob.nodes[1])) {
          snap.E1n = vec.uni(vec.vec(end.point, glob.points.E0))
          snap.E1pn = vec.uni(vec.vec(end.point, glob.points.E0p))
        }
      }
    }

    return globHandleSnapshots
  }
}
