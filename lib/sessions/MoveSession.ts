import { IData, IGlob, INode, ISelectionSnapshot } from "lib/types"
import { moveSelection } from "lib/commands"
import * as vec from "lib/vec"
import {
  getGlobClone,
  getNodeClone,
  getSelectionSnapshot,
  screenToWorld,
} from "lib/utils"
import { getGlobPoints } from "lib/utils"
import inputs from "lib/inputs"
import getNodeSnapper, { NodeSnapper } from "lib/snaps"
import BaseSession from "./BaseSession"

export interface MoveSessionSnapshot extends ISelectionSnapshot {}

export default class MoveSession extends BaseSession {
  private nodeSnapper?: NodeSnapper
  private snapshot: MoveSessionSnapshot
  private origin = [0, 0]
  private delta = [0, 0]
  private clones: { nodes: Record<string, INode>; globs: Record<string, IGlob> }

  private isCloning = false

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

    if (inputs.modifiers.optionKey && !this.isCloning) {
      // Create clones
      this.clones = MoveSession.getClones(data)

      // Add clones to data
      for (let nodeId in this.clones.nodes) {
        data.nodes[nodeId] = this.clones.nodes[nodeId]
        data.nodeIds.push(nodeId)
      }

      for (let globId in this.clones.globs) {
        data.globs[globId] = this.clones.globs[globId]
        data.globIds.push(globId)
      }

      // Move snapshot nodes back to original locations
      for (let nodeId in this.snapshot.nodes) {
        Object.assign(data.nodes[nodeId], this.snapshot.nodes[nodeId])
      }
      for (let globId in this.snapshot.globs) {
        Object.assign(data.nodes[globId], this.snapshot.globs[globId])
      }

      // Select clones
      data.selectedNodes = Object.keys(this.clones.nodes)
      data.selectedGlobs = Object.keys(this.clones.globs)
    } else if (!inputs.modifiers.optionKey && this.isCloning) {
      // Delete clones
      for (let nodeId in this.clones.nodes) {
        delete data.nodes[nodeId]
      }
      for (let globId in this.clones.globs) {
        delete data.nodes[globId]
      }

      data.nodeIds = Object.keys(data.nodes)
      data.globIds = Object.keys(data.globs)

      // Re-select original nodes from snapshot
      data.selectedNodes = Object.keys(this.snapshot.nodes)
      data.selectedGlobs = Object.keys(this.snapshot.globs)
    }

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
