import { IData, ISelectionSnapshot } from "lib/types"
import BaseSession from "./BaseSession"
import * as vec from "lib/vec"
import inputs from "lib/inputs"
import {
  clamp,
  getSelectionSnapshot,
  round,
  screenToWorld,
  getRayRayIntersection,
  updateGlobPoints,
} from "lib/utils"
import { resizeNode } from "lib/commands"

export type IResizeNodeAdjacentHandleSnapshot = Record<
  string,
  {
    D: number[]
    Dp: number[]
    E0: number[]
    E0p: number[]
    E1: number[]
    E1p: number[]
    type: "end" | "start" | "both"
    n0: number[]
    n0p: number[]
    n1: number[]
    n1p: number[]
    nE0: number[]
    nE0p: number[]
    nE1: number[]
    nE1p: number[]
  }
>

export default class ResizeSession extends BaseSession {
  nodeId: string
  origin: number[]
  startDistance: number
  snapshot: ISelectionSnapshot
  handleSnapshot: IResizeNodeAdjacentHandleSnapshot

  constructor(data: IData, nodeId: string) {
    super(data)
    this.nodeId = nodeId

    const node = data.nodes[nodeId]

    this.startDistance = vec.dist(
      node.point,
      screenToWorld(inputs.pointer.point, data.camera)
    )

    this.snapshot = getSelectionSnapshot(data)
    this.handleSnapshot = ResizeSession.getNodeAdjacentHandleSnapshot(data)
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
        const {
          type,
          E0,
          E0p,
          E1,
          E1p,
          n0,
          n0p,
          n1,
          n1p,
          nE0,
          nE0p,
          nE1,
          nE1p,
        } = snap

        const d0 = vec.add(E0, vec.mul(nE0, delta))
        const d0p = vec.add(E0p, vec.mul(nE0p, delta))
        const d1 = vec.add(E1, vec.mul(nE1, delta))
        const d1p = vec.add(E1p, vec.mul(nE1p, delta))

        switch (type) {
          case "start": {
            glob.D = getRayRayIntersection(d0, n0, E1, n1)
            glob.Dp = getRayRayIntersection(d0p, n0p, E1p, n1p)
            break
          }
          case "end": {
            glob.D = getRayRayIntersection(d1, n1, E0, n0)
            glob.Dp = getRayRayIntersection(d1p, n1p, E0p, n0p)
            break
          }
          case "both": {
            glob.D = getRayRayIntersection(d1, n1, d0, n0)
            glob.Dp = getRayRayIntersection(d1p, n1p, d0p, n0p)

            break
          }
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

  static getNodeAdjacentHandleSnapshot(data: IData) {
    const { globs } = data
    const selectedNodeIds = new Set(data.selectedNodes)

    const globHandleSnapshots: IResizeNodeAdjacentHandleSnapshot = {}

    // Find the globs that will be effected when the node resizes.
    // We need to have some of their points, along with whether those points
    // are in clockwise order. If a glob has both its nodes among the selected
    // nodes, then

    for (const globId in globs) {
      const glob = globs[globId]
      const hasStart = selectedNodeIds.has(glob.nodes[0])
      const hasEnd = selectedNodeIds.has(glob.nodes[1])

      const {
        D,
        Dp,
        points: { E0, E1, E0p, E1p },
      } = glob

      if (hasStart || hasEnd) {
        const [start, end] = glob.nodes.map(
          (nodeId) => data.nodes[nodeId].point
        )

        globHandleSnapshots[glob.id] = {
          D: [...D],
          Dp: [...Dp],
          E0: [...E0],
          E1: [...E1],
          E0p: [...E0p],
          E1p: [...E1p],
          type: hasStart && hasEnd ? "both" : hasStart ? "start" : "end",
          n0: vec.uni(vec.vec(E0, D)),
          n0p: vec.uni(vec.vec(E0p, Dp)),
          n1: vec.uni(vec.vec(E1, D)),
          n1p: vec.uni(vec.vec(E1p, Dp)),
          nE0: vec.uni(vec.vec(start, E0)),
          nE0p: vec.uni(vec.vec(start, E0p)),
          nE1: vec.uni(vec.vec(end, E1)),
          nE1p: vec.uni(vec.vec(end, E1p)),
        }
      }
    }

    return globHandleSnapshots
  }
}
