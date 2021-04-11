import { IData, IGlob, INode, ISelectionSnapshot } from "lib/types"
import { cloneSelection, moveSelection } from "lib/commands"
import * as vec from "lib/vec"
import {
  getGlob,
  getGlobClone,
  getNodeClone,
  getSelectionSnapshot,
  screenToWorld,
  updateGlobPoints,
} from "lib/utils"
import { getGlobPoints } from "lib/utils"
import inputs from "lib/sinputs"
import getNodeSnapper, { NodeSnapper } from "lib/snaps"
import BaseSession from "./BaseSession"

export interface MoveSessionSnapshot extends ISelectionSnapshot {}
export interface MoveSessionClones {
  nodes: Record<string, INode>
  nodeIdMap: Record<string, string>
  globs: Record<string, IGlob>
  globIdMap: Record<string, string>
}

export default class MoveSession extends BaseSession {
  private nodeSnapper?: NodeSnapper
  private snapshot: MoveSessionSnapshot
  private origin = [0, 0]
  private delta = [0, 0]
  private clones: MoveSessionClones

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

    if (inputs.modifiers.optionKey) {
      this.clones = MoveSession.getMoveSessionClones(data)
      MoveSession.startCloning(data, this.clones, this.snapshot)
      this.isCloning = true
    }
  }

  cancel = (data: IData) => {
    if (this.isCloning) {
      MoveSession.stopCloning(data, this.clones, this.snapshot)
      this.isCloning = false
    }

    MoveSession.moveSelection(
      data,
      vec.neg(this.delta),
      MoveSession.getSnapshot(data)
    )
  }

  complete = (data: IData) => {
    if (this.isCloning) {
      // Assign true ids to nodes and globs
      for (let nodeId in this.clones.nodes) {
        data.nodes[nodeId].id = nodeId
      }

      for (let globId in this.clones.globs) {
        data.globs[globId].id = globId
      }
      data.hoveredNodes = data.hoveredNodes.map(
        (id) => this.clones.nodeIdMap[id]
      )
      data.hoveredGlobs = data.hoveredGlobs.map(
        (id) => this.clones.globIdMap[id]
      )

      cloneSelection(
        data,
        {
          nodes: Object.keys(this.clones.nodes),
          globs: Object.keys(this.clones.globs),
          hoveredNodes: data.hoveredNodes,
          hoveredGlobs: data.hoveredGlobs,
        },
        this.snapshot
      )
      return
    } else {
      this.clones = undefined
    }

    moveSelection(data, this.delta, this.snapshot, this.clones)
  }

  update = (data: IData) => {
    const { document, camera } = data

    this.delta = vec.vec(
      this.origin,
      screenToWorld(inputs.pointer.point, camera)
    )

    if (inputs.modifiers.optionKey && !this.isCloning) {
      if (this.clones === undefined) {
        this.clones = MoveSession.getMoveSessionClones(data)
      }
      MoveSession.startCloning(data, this.clones, this.snapshot)
      this.isCloning = true
    } else if (!inputs.modifiers.optionKey && this.isCloning) {
      MoveSession.stopCloning(data, this.clones, this.snapshot)
      this.isCloning = false
    }

    if (this.nodeSnapper) {
      const snapResults = this.nodeSnapper(
        this.delta,
        camera,
        document,
        inputs.modifiers.Alt
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

  static startCloning(
    data: IData,
    clones: MoveSessionClones,
    snapshot: MoveSessionSnapshot
  ) {
    // Add clones to data
    for (let nodeId in clones.nodes) {
      data.nodes[nodeId] = clones.nodes[nodeId]
    }

    for (let globId in clones.globs) {
      data.globs[globId] = clones.globs[globId]
    }

    data.nodeIds = Object.keys(data.nodes)
    data.globIds = Object.keys(data.globs)

    // Move snapshot nodes back to original locations
    for (let nodeId in snapshot.nodes) {
      Object.assign(data.nodes[nodeId], snapshot.nodes[nodeId])
    }

    for (let globId in snapshot.globs) {
      const glob = data.globs[globId]
      Object.assign(glob, snapshot.globs[globId])
    }

    updateGlobPoints(data)

    // Select clones
    data.selectedNodes = snapshot.selectedNodes.map(
      (id) => clones.nodeIdMap[id]
    )

    data.selectedGlobs = snapshot.selectedGlobs.map(
      (id) => clones.globIdMap[id]
    )
  }

  static stopCloning(
    data: IData,
    clones: MoveSessionClones,
    snapshot: MoveSessionSnapshot
  ) {
    // Delete clones
    for (let nodeId in clones.nodes) {
      delete data.nodes[nodeId]
    }
    for (let globId in clones.globs) {
      delete data.globs[globId]
    }

    data.nodeIds = Object.keys(data.nodes)
    data.globIds = Object.keys(data.globs)

    // Re-select original nodes from snapshot
    data.selectedNodes = snapshot.selectedNodes
    data.selectedGlobs = snapshot.selectedGlobs
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

      let next = vec.round(vec.add(snapshot.nodes[node.id].point, delta), 2)

      node.point = next
    }

    // Move globs
    for (let globId in globs) {
      const glob = globs[globId]
      if (
        data.selectedGlobs.includes(globId) ||
        nodesToMove.has(glob.nodes[0]) ||
        nodesToMove.has(glob.nodes[1])
      ) {
        const [start, end] = glob.nodes.map((nodeId) => nodes[nodeId])

        glob.points = getGlobPoints(glob, start, end)
      }
    }
  }

  static getMoveSessionClones(data: IData): MoveSessionClones {
    const nodesToSnapshot = new Set(data.selectedNodes)

    for (let globId of data.selectedGlobs) {
      nodesToSnapshot.add(data.globs[globId].nodes[0])
      nodesToSnapshot.add(data.globs[globId].nodes[1])
    }

    const nodeIdMap: Record<string, string> = {}
    const globIdMap: Record<string, string> = {}

    // A clone's key will be different from its actual id
    const nodes = Object.fromEntries(
      Array.from(nodesToSnapshot.values()).map((nodeId) => {
        const node = getNodeClone(data.nodes[nodeId])

        nodeIdMap[nodeId] = node.id
        const id = node.id
        node.id = nodeId

        return [id, node]
      })
    )

    const globs = Object.fromEntries(
      data.selectedGlobs.map((globId) => {
        const glob = getGlobClone(data.globs[globId])

        globIdMap[globId] = glob.id
        const id = glob.id
        glob.id = globId

        glob.nodes[0] = nodeIdMap[glob.nodes[0]]
        glob.nodes[1] = nodeIdMap[glob.nodes[1]]

        return [id, glob]
      })
    )

    return {
      nodes,
      globs,
      nodeIdMap,
      globIdMap,
    }
  }
}
