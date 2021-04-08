import state, { keys, pointer } from "./state"
import {
  IBounds,
  ICanvasItems,
  IData,
  IGlob,
  IHandle,
  INode,
  ISnapTypes,
} from "./types"
import { current } from "immer"
import * as vec from "./vec"
import {
  getGlob,
  getOuterTangents,
  getSnapshots,
  getSnapglobs,
  getLineLineIntersection,
  getClosestPointOnCircle,
} from "./utils"
import {
  updateGlobPoints,
  saveSelectionState,
  getPositionSnapshot,
} from "./movers/mover-utils"

import HandleMover from "./movers/HandleMover"
import Mover, { MoverSnapshot } from "./movers/Mover"
import AnchorMover, { AnchorMoverSnapshot } from "./movers/AnchorMover"

import { getCommonBounds, getGlobBounds, getNodeBounds } from "./bounds-utils"
import { getClosestPointOnCurve, getNormalOnCurve } from "./bez"
import getNodeSnapper, { NodeSnapper } from "./snaps"
import RadiusMover, { RadiusMoverSnapshot } from "./movers/RadiusMover"
import ResizerMover, {
  ResizerMoverSnapshot,
  ResizerValues,
} from "./movers/ResizeMover"
import RotateMover from "./movers/RotateMover"

/* --------------------- Generic -------------------- */

type CommandFn<T> = (data: T, initial?: boolean) => void

enum CommandType {
  ChangeBounds,
  CreateGlob,
  CreateNode,
  ToggleLocked,
  Delete,
  Split,
  Move,
  MoveAnchor,
  ReorderGlobs,
  ReorderNodes,
}

/**
 * A command makes changes to some applicate state. Every command has an "undo"
 * method to reverse its changes. The apps history is a series of commands.
 */
class BaseCommand<T extends any> {
  timestamp = Date.now()
  private undoFn: CommandFn<T>
  private doFn: CommandFn<T>

  constructor(options: {
    type: CommandType
    do: CommandFn<T>
    undo: CommandFn<T>
  }) {
    this.doFn = options.do
    this.undoFn = options.undo
  }

  undo = (data: T) => this.undoFn(data)

  redo = (data: T, initial = false) => this.doFn(data, initial)
}

class BaseHistory<T> {
  private stack: BaseCommand<T>[] = []
  private pointer = -1
  private maxLength = 100

  execute = (data: T, command: BaseCommand<T>) => {
    this.stack = this.stack.slice(0, this.pointer + 1)
    this.stack.push(command)
    this.pointer++

    if (this.stack.length > this.maxLength) {
      this.stack = this.stack.slice(this.stack.length - this.maxLength)
      this.pointer = this.maxLength - 1
    }

    command.redo(data, true)
  }

  undo = (data: T) => {
    if (this.undos <= 0) return

    const command = this.stack[this.pointer]
    command.undo(data)
    this.pointer--

    // If the next-previous command came within 150ms, undo again.
    if (
      this.pointer > 0 &&
      command.timestamp - this.stack[this.pointer - 1].timestamp < 150
    ) {
      this.undo(data)
    }
  }

  redo = (data: T) => {
    if (this.redos <= 0) return

    this.pointer++
    const command = this.stack[this.pointer]
    command.redo(data, false)

    // If the next command came within 150ms, undo again.
    if (
      this.pointer < this.stack.length - 1 &&
      this.stack[this.pointer + 1].timestamp - command.timestamp < 150
    ) {
      this.redo(data)
    }
  }

  get undos() {
    return this.pointer + 1
  }

  get redos() {
    return this.stack.length - 1 - this.pointer
  }
}

export const history = new BaseHistory<IData>()

/* ---------------- Project Specific ---------------- */

/**
 * A subclass of BaseCommand that sends events to our state. In our case, we want our actions
 * to mutate the state's data. Actions do not effect the "active states" in
 * the app.
 */
export class Command extends BaseCommand<IData> {
  handler = (name: "UNDO" | "REDO", fn: CommandFn<IData>) =>
    state.send(name, { fn })
}

// For every command that changes the data, create an action that also undoes it.

export const commands = {
  createNode(data: IData) {
    const point = screenToWorld(pointer.point, data.camera)
    const restoreSelectionState = saveSelectionState(data)
    const node = createNode(point)

    history.execute(
      data,
      new Command({
        type: CommandType.CreateNode,
        do(data) {
          data.nodeIds.push(node.id)
          data.nodes[node.id] = node
          data.hoveredNodes = [node.id]
          data.selectedNodes = [node.id]
        },
        undo(data) {
          data.nodeIds = data.nodeIds.filter((id) => id !== node.id)
          delete data.nodes[node.id]
          restoreSelectionState(data)
        },
      })
    )
  },
  createGlobToNewNode(data: IData, point: number[]) {
    const {
      nodes: sNodes,
      selectedNodes: sSelectedNodes,
      camera: sCamera,
    } = current(data)
    const restoreSelectionState = saveSelectionState(data)

    const newNode = createNode(screenToWorld(point, sCamera))

    newNode.radius = sSelectedNodes.reduce(
      (a, c) => (sNodes[c].radius < a ? sNodes[c].radius : a),
      sNodes[sSelectedNodes[0]].radius
    )

    const newGlobs = sSelectedNodes.map((nodeId) =>
      createGlob(sNodes[nodeId], newNode)
    )

    history.execute(
      data,
      new Command({
        type: CommandType.CreateNode,
        do(data) {
          data.nodeIds.push(newNode.id)
          data.nodes[newNode.id] = newNode

          for (let glob of newGlobs) {
            data.globIds.push(glob.id)
            data.globs[glob.id] = glob
          }

          data.selectedGlobs = []
          data.selectedNodes = [newNode.id]
        },
        undo(data) {
          delete data.nodes[newNode.id]
          data.nodeIds = Object.keys(data.nodes)

          for (let glob of newGlobs) {
            delete data.globs[glob.id]
          }

          data.globIds = Object.keys(data.globs)
          restoreSelectionState(data)
        },
      })
    )
  },
  createGlobBetweenNodes(data: IData, targetId: string) {
    const {
      globIds: sGlobIds,
      globs: sGlobs,
      nodes: sNodes,
      selectedNodes: sSelectedNodes,
    } = current(data)
    const restoreSelectionState = saveSelectionState(data)

    const globs = sGlobIds.map((id) => sGlobs[id])

    // Don't create a second glob between nodes, if one already exists
    const newGlobs = sSelectedNodes
      .filter(
        (nodeId) =>
          !globs.find(
            ({ nodes }) => nodes.includes(nodeId) && nodes.includes(targetId)
          )
      )
      .map((nodeId) => createGlob(sNodes[nodeId], sNodes[targetId]))

    history.execute(
      data,
      new Command({
        type: CommandType.CreateGlob,
        do(data) {
          for (let glob of newGlobs) {
            data.globs[glob.id] = glob
            data.globIds.push(glob.id)
          }
          restoreSelectionState(data)
          data.selectedGlobs = []
          data.selectedNodes[targetId]
        },
        undo(data) {
          for (let glob of newGlobs) {
            delete data.globs[glob.id]
          }
          data.globIds = Object.keys(data.globs)
          restoreSelectionState(data)
        },
      })
    )
  },
  moveSelection(data: IData, delta: number[], snapshot: MoverSnapshot) {
    const restoreSelectionState = saveSelectionState(data)
    const sSnapshot = Mover.getSnapshot(data)

    history.execute(
      data,
      new Command({
        type: CommandType.Move,
        do(data, initial) {
          // When first executed, the items will already be in the correct position
          if (initial) return

          restoreSelectionState(data)
          Mover.moveSelection(data, delta, snapshot)
        },
        undo(data) {
          restoreSelectionState(data)
          Mover.moveSelection(data, vec.neg(delta), sSnapshot)
        },
      })
    )
  },
  moveHandle(
    data: IData,
    id: string,
    initial: { D: number[]; Dp: number[] },
    current: { D: number[]; Dp: number[] }
  ) {
    const restoreSelectionState = saveSelectionState(data)
    // We need a way to restore the nodes from when the drag began and ended
    history.execute(
      data,
      new Command({
        type: CommandType.Move,
        do(data, initial) {
          if (initial) return

          restoreSelectionState(data)

          const glob = data.globs[id]
          const [start, end] = glob.nodes.map((id) => data.nodes[id])
          glob.options.D = current.D
          glob.options.Dp = current.Dp

          try {
            // Rebuild the glob points
            glob.points = getGlob(
              start.point,
              start.radius,
              end.point,
              end.radius,
              glob.options.D,
              glob.options.Dp,
              glob.options.a,
              glob.options.b,
              glob.options.ap,
              glob.options.bp
            )
          } catch (e) {
            glob.points = null
          }
        },
        undo(data) {
          restoreSelectionState(data)
          data.globs[id].options.D = initial.D
          data.globs[id].options.Dp = initial.Dp
          const glob = data.globs[id]
          const [start, end] = glob.nodes.map((id) => data.nodes[id])

          try {
            // Rebuild the glob points
            glob.points = getGlob(
              start.point,
              start.radius,
              end.point,
              end.radius,
              glob.options.D,
              glob.options.Dp,
              glob.options.a,
              glob.options.b,
              glob.options.ap,
              glob.options.bp
            )
          } catch (e) {
            glob.points = null
          }
        },
      })
    )
  },
  moveAnchor(data: IData, globId: string, initial: AnchorMoverSnapshot) {
    const restoreSelectionState = saveSelectionState(data)
    const current = AnchorMover.getSnapshot(data, globId)

    // We need a way to restore the nodes from when the drag began and ended
    history.execute(
      data,
      new Command({
        type: CommandType.MoveAnchor,
        do(data, initial) {
          if (initial) return
          restoreSelectionState(data)
          const glob = data.globs[globId]
          Object.assign(glob.options, current)
          const [start, end] = glob.nodes.map((id) => data.nodes[id])

          glob.points = getGlob(
            start.point,
            start.radius,
            end.point,
            end.radius,
            glob.options.D,
            glob.options.Dp,
            glob.options.a,
            glob.options.b,
            glob.options.ap,
            glob.options.bp
          )
        },
        undo(data) {
          restoreSelectionState(data)
          const glob = data.globs[globId]
          Object.assign(glob.options, initial)
          const [start, end] = glob.nodes.map((id) => data.nodes[id])

          glob.points = getGlob(
            start.point,
            start.radius,
            end.point,
            end.radius,
            glob.options.D,
            glob.options.Dp,
            glob.options.a,
            glob.options.b,
            glob.options.ap,
            glob.options.bp
          )
        },
      })
    )
  },
  splitGlob(data: IData, id: string) {
    const restoreSelectionState = saveSelectionState(data)
    const { globs: sGlobs, camera: sCamera, nodes: sNodes } = current(data)

    let newStartNode: INode,
      newGlob: IGlob,
      isValid = false,
      D0: number[],
      D1: number[],
      D0p: number[],
      D1p: number[],
      a0: number,
      b0: number,
      a0p: number,
      b0p: number,
      a1: number,
      b1: number,
      a1p: number,
      b1p: number

    const glob = sGlobs[id]
    const oldGlob = glob

    const point = screenToWorld(pointer.point, sCamera)

    const { E0, E0p, E1, E1p, F0, F1, F0p, F1p, D, Dp } = glob.points

    // Points on curve
    const closestP = getClosestPointOnCurve(point, E0, F0, F1, E1)
    const closestPp = getClosestPointOnCurve(point, E0p, F0p, F1p, E1p)

    if (!(closestP.point && closestPp.point)) {
      console.warn("Could not find closest points.")
      return
    }

    const P = closestP.point
    const Pp = closestPp.point

    // Find the circle
    let C: number[], r: number

    // Normals
    const N = getNormalOnCurve(E0, F0, F1, E1, closestP.t)
    const Np = getNormalOnCurve(E0p, F0p, F1p, E1p, closestPp.t)

    if (Math.abs(N[0] - Np[0]) < 0.001 && Math.abs(N[1] - Np[1]) < 0.001) {
      // Lines are parallel
      const [start, end] = glob.nodes.map((id) => sNodes[id])

      const point = vec.med(closestP.point, closestPp.point)

      newStartNode = createNode(point, (start.radius + end.radius) / 2)

      D0 = vec.med(E0, closestP.point)
      D1 = vec.med(closestP.point, E1)
      D0p = vec.med(E0p, closestPp.point)
      D1p = vec.med(closestPp.point, E1p)

      a0 = glob.options.a
      b0 = glob.options.b
      a0p = glob.options.ap
      b0p = glob.options.bp
      a1 = glob.options.a
      b1 = glob.options.b
      a1p = glob.options.ap
      b1p = glob.options.bp
    } else {
      const center = vec.med(N, Np)

      try {
        // Find intersection between normals
        const intA = getLineLineIntersection(
          vec.sub(P, vec.mul(N, 1000000)),
          vec.add(P, vec.mul(N, 1000000)),
          vec.sub(Pp, vec.mul(Np, 1000000)),
          vec.add(Pp, vec.mul(Np, 1000000))
        )

        const L0 = vec.sub(P, vec.mul(vec.per(N), 10000000))
        const L1 = vec.add(P, vec.mul(vec.per(N), 10000000))

        // Center intersection
        const intB = getLineLineIntersection(
          L0,
          L1,
          vec.sub(intA, vec.mul(center, 10000000)),
          vec.add(intA, vec.mul(center, 10000000))
        )

        // Create a circle at the point of intersection. The distance
        // will be the same to either point.
        C = intB
        r = vec.dist(P, C)
      } catch (e) {
        // If the lines are parallel, we won't have an intersection.
        // In this case, create a circle between the two points.
        C = vec.med(P, Pp)
        r = vec.dist(P, Pp) / 2
      }

      // Find an intersection between E0->D and L0->inverted D
      const PL = [
        vec.sub(P, vec.mul(N, 10000000)),
        vec.add(P, vec.mul(N, 10000000)),
      ]

      const PLp = [
        vec.sub(Pp, vec.mul(Np, 10000000)),
        vec.add(Pp, vec.mul(Np, 10000000)),
      ]

      D0 = getLineLineIntersection(PL[0], PL[1], E0, D)
      D1 = getLineLineIntersection(PL[0], PL[1], E1, D)
      D0p = getLineLineIntersection(PLp[0], PLp[1], E0p, Dp)
      D1p = getLineLineIntersection(PLp[0], PLp[1], E1p, Dp)

      // The radio of distances between old and new handles
      const d0 = vec.dist(E0, D0) / vec.dist(E0, D)
      const d0p = vec.dist(E0p, D0p) / vec.dist(E0p, Dp)
      const d1 = vec.dist(E1, D1) / vec.dist(E1, D)
      const d1p = vec.dist(E1p, D1p) / vec.dist(E1p, Dp)

      // Not sure why this part works
      const t0 = 0.75 - d0 * 0.25
      const t0p = 0.75 - d0p * 0.25
      const t1 = 0.75 - d1 * 0.25
      const t1p = 0.75 - d1p * 0.25

      a0 = t0
      b0 = t0
      a0p = t0p
      b0p = t0p
      a1 = t1
      b1 = t1
      a1p = t1p
      b1p = t1p

      newStartNode = createNode(C, r)
    }

    const [start, end] = glob.nodes.map((id) => sNodes[id])

    newGlob = {
      ...createGlob(newStartNode, end),
      options: {
        D: D1,
        Dp: D1p,
        a: a1,
        b: b1,
        ap: a1p,
        bp: b1p,
      },
    }

    try {
      // Old glob

      getGlob(
        start.point,
        start.radius,
        newStartNode.point,
        newStartNode.radius,
        D0,
        D0p,
        a0,
        b0,
        a0p,
        b0p
      )

      // New Glob

      newGlob.points = getGlob(
        newStartNode.point,
        newStartNode.radius,
        end.point,
        end.radius,
        D1,
        D1p,
        a1,
        b1,
        a1p,
        b1p
      )

      isValid = true
    } catch (e) {
      console.warn("Could not create glob.", e.message)
    }

    if (!isValid) return

    history.execute(
      data,
      new Command({
        type: CommandType.Split,
        do(data) {
          const glob = data.globs[oldGlob.id]
          glob.nodes[1] = newStartNode.id

          Object.assign(glob, {
            options: { D: D0, Dp: D0p, a: a0, b: b0, ap: a0p, bp: b0p },
          })

          const [start, end] = glob.nodes.map((id) => data.nodes[id])

          glob.points = getGlob(
            start.point,
            start.radius,
            newStartNode.point,
            newStartNode.radius,
            D0,
            D0p,
            a0,
            b0,
            a0p,
            b0p
          )

          data.nodeIds.push(newStartNode.id)
          data.nodes[newStartNode.id] = newStartNode

          data.globIds.push(newGlob.id)
          data.globs[newGlob.id] = newGlob

          data.hoveredGlobs = []
          data.hoveredNodes = [newStartNode.id]
          data.selectedNodes = [newStartNode.id]
        },
        undo(data) {
          Object.assign(data.globs[oldGlob.id], oldGlob)

          delete data.nodes[newStartNode.id]
          data.nodeIds = Object.keys(data.nodes)

          delete data.globs[newGlob.id]
          data.globIds = Object.keys(data.globs)

          restoreSelectionState(data)
        },
      })
    )
  },
  // Reordering
  reorderGlobs(data: IData, from: number, to: number) {
    const sGlobIds = [...data.globIds]

    history.execute(
      data,
      new Command({
        type: CommandType.ReorderGlobs,
        do(data) {
          const id = data.globIds.splice(from, 1)
          data.globIds.splice(to, 0, id[0])
        },
        undo(data) {
          data.globIds = sGlobIds
        },
      })
    )
  },
  reorderNodes(data: IData, from: number, to: number) {
    const sNodeIds = [...data.nodeIds]

    history.execute(
      data,
      new Command({
        type: CommandType.ReorderGlobs,
        do(data) {
          const id = data.nodeIds.splice(from, 1)
          data.nodeIds.splice(to, 0, id[0])
        },
        undo(data) {
          data.nodeIds = sNodeIds
        },
      })
    )
  },
  // Bounds
  deleteSelection(data: IData) {
    const restoreSelectionState = saveSelectionState(data)
    const {
      globs: sGlobs,
      nodes: sNodes,
      selectedGlobs: sSelectedGlobIds,
      selectedNodes: sSelectedNodeIds,
    } = current(data)

    const deletedGlobIds = new Set(sSelectedGlobIds)
    const deletedNodeIds = new Set(sSelectedNodeIds)

    for (let globId in deletedGlobIds) {
      const glob = sGlobs[globId]
      deletedNodeIds.add(glob.nodes[0])
      deletedNodeIds.add(glob.nodes[1])
    }

    for (let globId in sGlobs) {
      const glob = sGlobs[globId]
      if (glob.nodes.some((nodeId) => deletedNodeIds.has(nodeId))) {
        deletedGlobIds.add(globId)
      }
    }

    history.execute(
      data,
      new Command({
        type: CommandType.Delete,
        do(data) {
          restoreSelectionState(data)
          deletedGlobIds.forEach((id) => delete data.globs[id])
          data.globIds = Object.keys(data.globs)
          data.selectedGlobs = []

          deletedNodeIds.forEach((id) => delete data.nodes[id])
          data.globIds = Object.keys(data.globs)
          data.selectedGlobs = []
        },
        undo(data) {
          deletedGlobIds.forEach((id) => (data.globs[id] = sGlobs[id]))
          data.globIds = Object.keys(data.globs)

          deletedNodeIds.forEach((id) => (data.nodes[id] = sNodes[id]))
          data.nodeIds = Object.keys(data.nodes)
          restoreSelectionState(data)
        },
      })
    )
  },
  toggleSelectionLocked(data: IData) {
    const restoreSelectionState = saveSelectionState(data)
    const selectedNodes = [...data.selectedNodes]
    const currentLocked = Object.fromEntries(
      Object.entries(data.nodes).map(([id, node]) => [id, node.locked])
    )

    history.execute(
      data,
      new Command({
        type: CommandType.ToggleLocked,
        do(data) {
          restoreSelectionState(data)
          const locked = !selectedNodes.every((id) => data.nodes[id].locked)
          for (let id of selectedNodes) {
            data.nodes[id].locked = locked
          }
        },
        undo(data) {
          restoreSelectionState(data)
          for (let id in currentLocked) {
            data.nodes[id].locked = currentLocked[id]
          }
        },
      })
    )
  },
  moveBounds(data: IData, delta: number[]) {
    const restoreSelectionState = saveSelectionState(data)
    const sNodeIds = [...data.selectedNodes]
    const sGlobIds = [...data.selectedGlobs]

    history.execute(
      data,
      new Command({
        type: CommandType.ChangeBounds,
        do(data) {
          restoreSelectionState(data)
          for (let nodeId of sNodeIds) {
            const node = data.nodes[nodeId]
            node.point = vec.add(node.point, delta)
          }

          for (let globId of sGlobIds) {
            const glob = data.globs[globId]
            glob.options.D = vec.add(glob.options.D, delta)
            glob.options.Dp = vec.add(glob.options.Dp, delta)
          }
        },
        undo(data) {
          restoreSelectionState(data)
          for (let nodeId of sNodeIds) {
            const node = data.nodes[nodeId]
            node.point = vec.sub(node.point, delta)
          }

          for (let globId of sGlobIds) {
            const glob = data.globs[globId]
            glob.options.D = vec.sub(glob.options.D, delta)
            glob.options.Dp = vec.sub(glob.options.Dp, delta)
          }
        },
      })
    )
  },
  rotateSelection(
    data: IData,
    center: number[],
    angle: number,
    snapshot: ReturnType<typeof getPositionSnapshot>
  ) {
    const restoreSelectionState = saveSelectionState(data)

    history.execute(
      data,
      new Command({
        type: CommandType.ChangeBounds,
        do(data, initial) {
          if (initial) return
          restoreSelectionState(data)
          RotateMover.rotate(data, center, angle, snapshot)
          updateGlobPoints(data)
        },
        undo(data) {
          restoreSelectionState(data)
          for (let id in snapshot.nodes) {
            const sNode = snapshot.nodes[id]
            const node = data.nodes[id]
            node.point = sNode.point
            node.radius = sNode.radius
          }

          for (let id in snapshot.globs) {
            const sGlob = snapshot.globs[id]
            const glob = data.globs[id]
            Object.assign(glob.options, sGlob)
          }

          updateGlobPoints(data)
        },
      })
    )
  },
  edgeOrCornerResizeBounds(
    data: IData,
    type: "corner" | "edge",
    value: number,
    restore: ReturnType<typeof getPositionSnapshot>,
    snapshot: ResizerMoverSnapshot,
    preserveRadii: boolean
  ) {
    const restoreSelectionState = saveSelectionState(data)
    const current = ResizerMover.getSnapshot(data)

    history.execute(
      data,
      new Command({
        type: CommandType.CreateNode,
        do(data, initial) {
          if (initial) return
          restoreSelectionState(data)

          const { x: x0, y: y0, maxX: x1, maxY: y1 } = snapshot.bounds
          const { maxX: mx, maxY: my, width: mw, height: mh } = snapshot.bounds

          ResizerMover.resize(
            data,
            type,
            current.point,
            value,
            {
              x0,
              y0,
              x1,
              y1,
              mx,
              my,
              mw,
              mh,
            },
            snapshot,
            preserveRadii
          )
          updateGlobPoints(data)
        },
        undo(data) {
          restoreSelectionState(data)
          for (let id in restore.nodes) {
            const sNode = restore.nodes[id]
            const node = data.nodes[id]
            node.point = sNode.point
            node.radius = sNode.radius
          }

          for (let id in restore.globs) {
            const sGlob = restore.globs[id]
            const glob = data.globs[id]
            Object.assign(glob.options, sGlob)
          }

          updateGlobPoints(data)
        },
      })
    )
  },
  // TODO: Turn this into a mover, so that it doesn't blow undo stack
  resizeBounds(data: IData, size: number[]) {
    const restoreSelectionState = saveSelectionState(data)
    const sNodeIds = [...data.selectedNodes]
    const sGlobIds = [...data.selectedGlobs]
    const bounds = getSelectedBoundingBox(data)

    const delta = [
      size[0] ? size[0] - bounds.width : 0,
      size[1] ? size[1] - bounds.height : 0,
    ]

    history.execute(
      data,
      new Command({
        type: CommandType.ChangeBounds,
        do(data) {
          restoreSelectionState(data)
          resizeBounds(
            sNodeIds.map((id) => data.nodes[id]),
            sGlobIds.map((id) => data.globs[id]),
            bounds,
            [0, 0],
            delta,
            true
          )
          updateGlobPoints(data)
        },
        undo(data) {
          restoreSelectionState(data)
          resizeBounds(
            sNodeIds.map((id) => data.nodes[id]),
            sGlobIds.map((id) => data.globs[id]),
            bounds,
            [0, 0],
            vec.neg(delta),
            true
          )
          updateGlobPoints(data)
        },
      })
    )
  },
  resizeNode(data: IData, id: string, initial: RadiusMoverSnapshot) {
    const restoreSelectionState = saveSelectionState(data)
    const current = RadiusMover.getSnapshot(data, id)
    history.execute(
      data,
      new Command({
        type: CommandType.Move,
        do(data, initial) {
          if (initial) return
          restoreSelectionState(data)
          const { nodes } = data
          const node = nodes[id]
          node.radius = current.radius
          updateGlobPoints(data)
        },
        undo(data) {
          restoreSelectionState(data)
          const { nodes } = data
          const node = nodes[id]
          node.radius = initial.radius
          updateGlobPoints(data)
        },
      })
    )
  },
  toggleNodeCap(data: IData, id: string) {
    const restoreSelectionState = saveSelectionState(data)
    const cap = data.nodes[id].cap
    history.execute(
      data,
      new Command({
        type: CommandType.CreateNode,
        do(data) {
          restoreSelectionState(data)
          const node = data.nodes[id]
          node.cap = cap === "round" ? "flat" : "round"
        },
        undo(data) {
          restoreSelectionState(data)
          const node = data.nodes[id]
          node.cap = cap
        },
      })
    )
  },
  setPropertyOnSelectedNodes(
    data: IData,
    change: Partial<{
      x: number
      y: number
      r: number
      cap: "round" | "flat"
      locked: boolean
    }>
  ) {
    const restoreSelectionState = saveSelectionState(data)
    const { x = null, y = null, r = null, cap = null, locked = null } = change

    const sNodes = Object.fromEntries(
      data.selectedNodes.map((id) => {
        const { point, radius, cap } = data.nodes[id]
        return [
          id,
          {
            point: [...point],
            radius,
            cap,
            locked,
          },
        ]
      })
    )

    history.execute(
      data,
      new Command({
        type: CommandType.CreateNode,
        do(data) {
          restoreSelectionState(data)
          for (let key in sNodes) {
            const node = data.nodes[key]
            if (x !== null) node.point[0] = x
            if (y !== null) node.point[1] = y
            if (r !== null) node.radius = r
            if (cap !== null) node.cap = cap
            if (locked !== null) node.locked = locked
          }
          updateGlobPoints(data)
        },
        undo(data) {
          restoreSelectionState(data)
          for (let key in sNodes) {
            const node = data.nodes[key]
            const sNode = sNodes[key]
            if (x !== null) node.point[0] = sNode.point[0]
            if (y !== null) node.point[1] = sNode.point[1]
            if (r !== null) node.radius = sNode.radius
            if (cap !== null) node.cap = sNode.cap
            if (locked !== null) node.locked = sNode.locked
          }
          updateGlobPoints(data)
        },
      })
    )
  },
  template(data: IData) {
    const snapshot = current(data)
    history.execute(
      data,
      new Command({
        type: CommandType.CreateNode,
        do(data) {},
        undo(data) {},
      })
    )
  },
}

/* -------------------- Utilities ------------------- */

function screenToWorld(point: number[], camera: IData["camera"]) {
  return vec.add(vec.div(point, camera.zoom), camera.point)
}

function createNode(point: number[], radius = 25): INode {
  const id = "node_" + Math.random() * Date.now()

  return {
    id,
    name: "Node",
    point,
    type: ICanvasItems.Node,
    radius,
    cap: "round",
    zIndex: 1,
    locked: false,
  }
}

export function createGlob(A: INode, B: INode): IGlob {
  const { point: C0, radius: r0 } = A
  const { point: C1, radius: r1 } = B

  const [E0, E1, E0p, E1p] = getOuterTangents(C0, r0, C1, r1)

  const D = vec.med(E0, E1),
    Dp = vec.med(E0p, E1p),
    a = 0.5,
    b = 0.5,
    ap = 0.5,
    bp = 0.5

  const id = "glob_" + Math.random() * Date.now()

  return {
    id,
    name: "Glob",
    nodes: [A.id, B.id],
    options: { D, Dp, a, b, ap, bp },
    points: getGlob(C0, r0, C1, r1, D, Dp, a, b, ap, bp),
    zIndex: 1,
  }
}

function getSelectedBoundingBox(data: IData) {
  const { selectedGlobs, selectedNodes, nodes, globs } = data

  if (selectedGlobs.length + selectedNodes.length === 0) return null

  return getCommonBounds(
    ...selectedGlobs
      .map((id) => globs[id])
      .filter((glob) => glob.points !== null)
      .map((glob) =>
        getGlobBounds(glob, nodes[glob.nodes[0]], nodes[glob.nodes[1]])
      ),
    ...selectedNodes.map((id) => getNodeBounds(nodes[id]))
  )
}

export function resizeBounds(
  nodes: INode[],
  globs: IGlob[],
  bounds: IBounds,
  pointDelta: number[],
  sizeDelta: number[],
  resizeRadius: boolean
) {
  const snapshots = getSnapshots(nodes, bounds)
  const snapglobs = getSnapglobs(globs, bounds)

  let { x: x0, y: y0, maxX: x1, maxY: y1 } = bounds
  let { maxX: mx, maxY: my, width: mw, height: mh } = bounds

  const [x, y] = [
    bounds.x + bounds.width + sizeDelta[0],
    bounds.y + bounds.height + sizeDelta[1],
  ]

  y1 = y
  my = y0
  mh = Math.abs(y1 - y0)

  x1 = x
  mx = x0
  mw = Math.abs(x1 - x0)

  for (let node of nodes) {
    const { nx, nmx, ny, nmy, nw, nh } = snapshots[node.id]

    node.point = vec.round(vec.add([mx + nx * mw, my + ny * mh], pointDelta))
    if (resizeRadius) {
      node.radius = (nw * mw + nh * mh) / 2
    }
  }

  for (let glob of globs) {
    const { D, Dp, a, ap, b, bp } = snapglobs[glob.id]

    Object.assign(glob.options, {
      a: a,
      ap: ap,
      b: b,
      bp: bp,
    })

    Object.assign(glob.options, {
      D: [mx + D.nx * mw, my + D.ny * mh],
      Dp: [mx + Dp.nx * mw, my + Dp.ny * mh],
      a,
      ap,
      b,
      bp,
    })
  }
}
