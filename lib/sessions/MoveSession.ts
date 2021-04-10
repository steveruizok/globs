import { IData } from "lib/types"
import { commands } from "lib/history"
import * as vec from "lib/vec"
import { isInView, screenToWorld } from "./session-utils"
import { getGlob } from "lib/utils"
import { keys, pointer } from "lib/state"
import getNodeSnapper, { NodeSnapper } from "lib/snaps"
import BaseSession from "./BaseSession"

export interface MoveSessionSnapshot {
  selectedNodes: string[]
  selectedGlobs: string[]
  nodes: Record<string, { id: string; point: number[]; radius: number }>
  globs: Record<string, { id: string; D: number[]; Dp: number[] }>
}

export default class MoveSession extends BaseSession {
  nodeSnapper?: NodeSnapper
  delta = [0, 0]
  snapshot: MoveSessionSnapshot
  origin: number[]

  constructor(data: IData) {
    super(data)
    const nodes = data.nodeIds.map((id) => data.nodes[id])
    const globs = data.globIds.map((id) => data.globs[id])

    this.origin = screenToWorld(pointer.point, data.camera)
    this.snapshot = MoveSession.getSnapshot(data)

    const snapNode = MoveSession.getClosestNodeToPointer(data)

    if (snapNode) {
      this.nodeSnapper = getNodeSnapper(snapNode, nodes, globs)
    }
  }

  complete = (data: IData) => {
    commands.moveSelection(data, this.delta, this.snapshot)
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

    this.delta = vec.vec(this.origin, screenToWorld(pointer.point, camera))

    if (this.nodeSnapper) {
      const snapResults = this.nodeSnapper(
        this.delta,
        camera,
        document,
        keys.Alt
      )
      this.delta = snapResults.delta
      data.snaps.active = snapResults.snaps as any
    } else {
      data.snaps.active = []
    }

    if (keys.Shift) {
      if (pointer.axis === "x") {
        this.delta[1] = 0
      } else {
        this.delta[0] = 0
      }
    }

    // Move stuff...
    MoveSession.moveSelection(data, this.delta, this.snapshot)
  }

  static getSnapshot(data: IData) {
    const nodes = data.nodeIds.map((id) => data.nodes[id])
    const globs = data.globIds.map((id) => data.globs[id])

    return {
      selectedNodes: [...data.selectedNodes],
      selectedGlobs: [...data.selectedGlobs],
      nodes: Object.fromEntries(
        nodes.map((node) => [
          node.id,
          {
            id: node.id,
            point: [...node.point],
            radius: node.radius,
          },
        ])
      ),
      globs: Object.fromEntries(
        globs.map((glob) => [
          glob.id,
          {
            id: glob.id,
            D: [...glob.D],
            Dp: [...glob.Dp],
          },
        ])
      ),
    }
  }

  static getClosestNodeToPointer(data: IData) {
    const { selectedNodes, nodes, camera, document } = data

    if (selectedNodes.length === 0) return false

    const point = screenToWorld(pointer.point, camera)

    let nodeUnderPointer = selectedNodes
      .map((id) => nodes[id])
      .find((node) => vec.dist(node.point, point) < node.radius)

    // 	let d = vec.dist(closestNodeToPointer.point, point)

    // for (let i = 1; i < selectedNodes.length; i++) {
    //   const node = nodes[selectedNodes[i]]
    //   if (isInView(node.point, document)) {
    //     const d1 = vec.dist(node.point, point)
    //     if (d1 < d) closestNodeToPointer = node
    //   }
    // }

    return nodeUnderPointer
  }

  static moveSelection(
    data: IData,
    delta: number[],
    snapshot: MoveSessionSnapshot
  ) {
    const { globs, nodes } = data

    // Moving maybe nodes and globs
    const nodesToMove = new Set(snapshot.selectedNodes)

    for (let globId of snapshot.selectedGlobs) {
      const glob = globs[globId]
      for (let nodeId of glob.nodes) {
        nodesToMove.add(nodeId)
      }

      const { D, Dp } = snapshot.globs[glob.id]

      glob.D = vec.round(vec.add(D, delta))
      glob.Dp = vec.round(vec.add(Dp, delta))
    }

    // Move nodes
    for (let id of nodesToMove) {
      const node = nodes[id]
      if (node.locked) continue

      let next = vec.round(vec.add(snapshot.nodes[id].point, delta), 2)

      node.point = next
    }

    // Move globs
    for (let id in globs) {
      const glob = globs[id]
      if (
        snapshot.selectedGlobs.includes(id) ||
        nodesToMove.has(glob.nodes[0]) ||
        nodesToMove.has(glob.nodes[1])
      ) {
        const { D, Dp, a, b, ap, bp } = glob

        const [
          { point: C0, radius: r0 },
          { point: C1, radius: r1 },
        ] = glob.nodes.map((id) => nodes[id])

        try {
          glob.points = getGlob(C0, r0, C1, r1, D, Dp, a, b, ap, bp)
        } catch (e) {
          glob.points = null
        }
      }
    }
  }
}
