import { IData, ISelectionSnapshot } from "lib/types"
import { moveSelection } from "lib/commands"
import * as vec from "lib/vec"
import { getSelectionSnapshot, screenToWorld } from "lib/utils"
import { getGlobPoints } from "lib/utils"
import inputs from "lib/inputs"
import getNodeSnapper, { NodeSnapper } from "lib/snaps"
import BaseSession from "./BaseSession"

export interface MoveSessionSnapshot extends ISelectionSnapshot {}

export default class MoveSession extends BaseSession {
  private nodeSnapper?: NodeSnapper
  private delta = [0, 0]
  private snapshot: MoveSessionSnapshot
  private origin: number[]

  constructor(data: IData) {
    super(data)
    const nodes = data.nodeIds.map((id) => data.nodes[id])
    const globs = data.globIds.map((id) => data.globs[id])

    this.origin = screenToWorld(inputs.pointer.point, data.camera)
    this.snapshot = MoveSession.getSnapshot(data)

    const snapNode = MoveSession.getClosestNodeToPointer(data)

    if (snapNode) {
      this.nodeSnapper = getNodeSnapper(snapNode, nodes, globs)
    }
  }

  complete = (data: IData) => {
    moveSelection(data, this.delta, this.snapshot)
  }

  cancel = (data: IData) => {
    MoveSession.moveSelection(
      data,
      vec.neg(this.delta),
      MoveSession.getSnapshot(data)
    )
  }

  update = (data: IData) => {
    const { document, camera } = data

    this.delta = vec.vec(
      this.origin,
      screenToWorld(inputs.pointer.point, camera)
    )

    if (this.nodeSnapper) {
      const snapResults = this.nodeSnapper(
        this.delta,
        camera,
        document,
        inputs.keys.Alt
      )
      this.delta = snapResults.delta
      data.snaps.active = snapResults.snaps as any
    } else {
      data.snaps.active = []
    }

    if (inputs.keys.Shift) {
      if (inputs.pointer.axis === "x") {
        this.delta[1] = 0
      } else {
        this.delta[0] = 0
      }
    }

    // Move stuff...
    MoveSession.moveSelection(data, this.delta, this.snapshot)
  }

  static getSnapshot(data: IData) {
    return getSelectionSnapshot(data)
  }

  static getClosestNodeToPointer(data: IData) {
    const { selectedNodes, nodes, camera } = data

    if (selectedNodes.length === 0) return

    return selectedNodes
      .map((id) => nodes[id])
      .find(
        (node) =>
          vec.dist(node.point, screenToWorld(inputs.pointer.point, camera)) <
          node.radius
      )
  }

  static moveSelection(
    data: IData,
    delta: number[],
    snapshot: MoveSessionSnapshot
  ) {
    const { globs, nodes } = data

    // Moving maybe nodes and globs
    const nodesToMove = new Set(data.selectedNodes)

    for (let globId of data.selectedGlobs) {
      const glob = globs[globId]
      for (let nodeId of glob.nodes) {
        nodesToMove.add(nodeId)
      }

      const { D, Dp } = snapshot.globs[glob.id]

      glob.D = vec.round(vec.add(D, delta))
      glob.Dp = vec.round(vec.add(Dp, delta))
    }

    // Move nodes
    for (let nodeId of nodesToMove) {
      const node = nodes[nodeId]
      if (node.locked) continue

      let next = vec.round(vec.add(snapshot.nodes[nodeId].point, delta), 2)

      node.point = next
    }

    // Move globs
    for (let id in globs) {
      const glob = globs[id]
      if (
        data.selectedGlobs.includes(id) ||
        nodesToMove.has(glob.nodes[0]) ||
        nodesToMove.has(glob.nodes[1])
      ) {
        const [start, end] = glob.nodes.map((id) => nodes[id])

        try {
          glob.points = getGlobPoints(glob, start, end)
        } catch (e) {
          glob.points = null
        }
      }
    }
  }
}
