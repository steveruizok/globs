import { current } from "immer"
import * as vec from "lib/vec"
import { IData, IGlob, INode, ISelectionSnapshot } from "lib/types"
import inputs from "lib/inputs"
import {
  getLineLineIntersection,
  getResizedBounds,
  getSelectedBoundingBox,
  getNewNode,
  getNewGlob,
  screenToWorld,
  updateGlobPoints,
  getSelectionSnapshot,
  getGlobPoints,
} from "lib/utils"
import { getClosestPointOnCurve, getNormalOnCurve } from "lib/bez"
import history, { Command, CommandType } from "lib/history"

import { IResizeNodeAdjacentHandleSnapshot } from "./sessions/ResizeSession"
import AnchorSession, { AnchorSessionSnapshot } from "./sessions/AnchorSession"
import TransformSession, {
  TransformSessionSnapshot,
} from "./sessions/TransformSession"
import RotateSession from "./sessions/RotateSession"
import MoveSession, {
  IMoveNodeAdjacentHandleSnapshot,
} from "./sessions/MoveSession"

/* -------------------- Commands -------------------- */

export function createNode(data: IData) {
  const point = vec.round(screenToWorld(inputs.pointer.point, data.camera))

  const node = getNewNode(point)

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
      },
    })
  )
}

export function createGlobToNewNode(data: IData, point: number[]) {
  const {
    nodes: sNodes,
    selectedNodes: sSelectedNodes,
    camera: sCamera,
  } = current(data)

  const newNode = getNewNode(screenToWorld(point, sCamera))

  newNode.radius = sSelectedNodes.reduce(
    (a, c) => (sNodes[c].radius < a ? sNodes[c].radius : a),
    sNodes[sSelectedNodes[0]].radius
  )

  const newGlobs = sSelectedNodes.map((nodeId) =>
    getNewGlob(sNodes[nodeId], newNode)
  )

  history.execute(
    data,
    new Command({
      type: CommandType.CreateNode,
      do(data) {
        data.nodeIds.push(newNode.id)
        data.nodes[newNode.id] = newNode

        for (const glob of newGlobs) {
          data.globIds.push(glob.id)
          data.globs[glob.id] = glob
        }

        data.selectedGlobs = []
        data.selectedNodes = [newNode.id]
      },
      undo(data) {
        delete data.nodes[newNode.id]
        data.nodeIds = Object.keys(data.nodes)

        for (const glob of newGlobs) {
          delete data.globs[glob.id]
        }

        data.globIds = Object.keys(data.globs)
      },
    })
  )
}

export function createGlobBetweenNodes(data: IData, targetId: string) {
  const {
    globIds: sGlobIds,
    globs: sGlobs,
    nodes: sNodes,
    selectedNodes: sSelectedNodes,
  } = current(data)

  const globs = sGlobIds.map((id) => sGlobs[id])

  // Don't create a second glob between nodes, if one already exists
  const newGlobs = sSelectedNodes
    .filter(
      (nodeId) =>
        !globs.find(
          ({ nodes }) => nodes.includes(nodeId) && nodes.includes(targetId)
        )
    )
    .map((nodeId) => getNewGlob(sNodes[nodeId], sNodes[targetId]))

  history.execute(
    data,
    new Command({
      type: CommandType.CreateGlob,
      do(data) {
        for (const glob of newGlobs) {
          data.globs[glob.id] = glob
          data.globIds.push(glob.id)
        }

        data.selectedGlobs = []
        data.selectedNodes[targetId]
      },
      undo(data) {
        for (const glob of newGlobs) {
          delete data.globs[glob.id]
        }
        data.globIds = Object.keys(data.globs)
      },
    })
  )
}

export function pasteSelection(
  data: IData,
  pasted: { nodes: Record<string, INode>; globs: Record<string, IGlob> }
) {
  history.execute(
    data,
    new Command({
      type: CommandType.Paste,
      do(data) {
        Object.assign(data.nodes, pasted.nodes)
        Object.assign(data.globs, pasted.globs)

        data.nodeIds = Object.keys(data.nodes)
        data.globIds = Object.keys(data.globs)

        data.selectedNodes = Object.keys(pasted.nodes)
        data.selectedGlobs = Object.keys(pasted.globs)

        const bounds = getSelectedBoundingBox(data)

        const point = screenToWorld(vec.div(data.viewport.size, 2), data.camera)

        const delta = vec.sub(
          point,
          vec.add(
            [bounds.minX, bounds.minY],
            vec.div([bounds.width, bounds.height], 2)
          )
        )

        const { globs, nodes } = data

        for (const globId of data.selectedGlobs) {
          const glob = globs[globId]
          const { D, Dp } = globs[glob.id]
          glob.D = vec.round(vec.add(D, delta))
          glob.Dp = vec.round(vec.add(Dp, delta))
        }

        // Move nodes
        for (const nodeId of data.selectedNodes) {
          const node = nodes[nodeId]
          node.point = vec.round(vec.add(nodes[node.id].point, delta), 2)
        }

        updateGlobPoints(data)
      },
      undo(data) {
        for (const nodeId in pasted.nodes) {
          delete data.nodes[nodeId]
        }
        for (const globId in pasted.globs) {
          delete data.globs[globId]
        }
        data.nodeIds = Object.keys(data.nodes)
        data.globIds = Object.keys(data.globs)
      },
    })
  )
}

export function cloneSelection(
  data: IData,
  clones: {
    nodes: string[]
    globs: string[]
    hoveredNodes: string[]
    hoveredGlobs: string[]
  },
  snapshot: ISelectionSnapshot
) {
  const {
    nodes: sNodes,
    globs: sGlobs,
    selectedNodes: sSelectedNodes,
    selectedGlobs: sSelectedGlobs,
  } = current(data)

  const sCloneNodes = clones.nodes.map((id) => sNodes[id])
  const sCloneGlobs = clones.globs.map((id) => sGlobs[id])

  history.execute(
    data,
    new Command({
      type: CommandType.Move,
      manualSelection: true,
      do(data, initial) {
        // When first executed, the items will already be in the correct position
        if (initial) return

        for (const node of sCloneNodes) {
          data.nodes[node.id] = node
        }
        for (const glob of sCloneGlobs) {
          data.globs[glob.id] = glob
        }
        data.nodeIds = Object.keys(data.nodes)
        data.globIds = Object.keys(data.globs)
        data.selectedNodes = sSelectedNodes
        data.selectedGlobs = sSelectedGlobs

        data.hoveredNodes = clones.hoveredNodes
        data.hoveredGlobs = clones.hoveredGlobs
      },
      undo(data) {
        for (const node of sCloneNodes) {
          delete data.nodes[node.id]
        }
        for (const glob of sCloneGlobs) {
          delete data.globs[glob.id]
        }
        data.nodeIds = Object.keys(data.nodes)
        data.globIds = Object.keys(data.globs)
        data.selectedNodes = snapshot.selectedNodes
        data.selectedGlobs = snapshot.selectedGlobs
        data.hoveredNodes = []
        data.hoveredGlobs = []
      },
    })
  )
}

export function moveSelection(
  data: IData,
  delta: number[],
  snapshot: ISelectionSnapshot,
  handleSnapshot: IMoveNodeAdjacentHandleSnapshot
) {
  const sSnapshot = MoveSession.getSnapshot(data)

  const sGlobHandles = Object.fromEntries(
    Object.keys(handleSnapshot).map((globId) => [
      globId,
      {
        D: [...data.globs[globId].D],
        Dp: [...data.globs[globId].Dp],
      },
    ])
  )

  history.execute(
    data,
    new Command({
      type: CommandType.Move,
      do(data, initial) {
        // When first executed, the items will already be in the correct position
        if (initial) return
        MoveSession.moveSelection(data, delta, snapshot)

        const { globs } = data

        for (const globId in sGlobHandles) {
          globs[globId].D = sGlobHandles[globId].D
          globs[globId].Dp = sGlobHandles[globId].Dp
        }

        updateGlobPoints(data)
      },
      undo(data) {
        const { globs } = data

        MoveSession.moveSelection(data, vec.neg(delta), sSnapshot)

        for (const globId in handleSnapshot) {
          globs[globId].D = handleSnapshot[globId].D
          globs[globId].Dp = handleSnapshot[globId].Dp
        }

        updateGlobPoints(data)
      },
    })
  )
}

export function moveHandle(
  data: IData,
  id: string,
  initial: { D: number[]; Dp: number[] },
  current: { D: number[]; Dp: number[] }
) {
  // We need a way to restore the nodes from when the drag began and ended
  history.execute(
    data,
    new Command({
      type: CommandType.Move,
      do(data, initial) {
        if (initial) return

        const glob = data.globs[id]
        const [start, end] = glob.nodes.map((id) => data.nodes[id])
        glob.D = current.D
        glob.Dp = current.Dp

        try {
          // Rebuild the glob points
          glob.points = getGlobPoints(glob, start, end)
        } catch (e) {
          glob.points = null
        }
      },
      undo(data) {
        data.globs[id].D = initial.D
        data.globs[id].Dp = initial.Dp
        const glob = data.globs[id]
        const [start, end] = glob.nodes.map((id) => data.nodes[id])

        try {
          glob.points = getGlobPoints(glob, start, end)
        } catch (e) {
          glob.points = null
        }
      },
    })
  )
}

export function moveAnchor(
  data: IData,
  globId: string,
  initial: AnchorSessionSnapshot
) {
  const current = AnchorSession.getSnapshot(data, globId)

  // We need a way to restore the nodes from when the drag began and ended
  history.execute(
    data,
    new Command({
      type: CommandType.MoveAnchor,
      do(data, initial) {
        if (initial) return

        const glob = data.globs[globId]
        Object.assign(glob, current)
        const [start, end] = glob.nodes.map((id) => data.nodes[id])

        glob.points = getGlobPoints(glob, start, end)
      },
      undo(data) {
        const glob = data.globs[globId]
        Object.assign(glob, initial)
        const [start, end] = glob.nodes.map((id) => data.nodes[id])

        glob.points = getGlobPoints(glob, start, end)
      },
    })
  )
}

export function splitGlob(data: IData, id: string) {
  const { globs: sGlobs, camera: sCamera, nodes: sNodes } = current(data)

  let newStartNode: INode,
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

  const point = screenToWorld(inputs.pointer.point, sCamera)

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

    newStartNode = getNewNode(point, (start.radius + end.radius) / 2)

    D0 = vec.med(E0, closestP.point)
    D1 = vec.med(closestP.point, E1)
    D0p = vec.med(E0p, closestPp.point)
    D1p = vec.med(closestPp.point, E1p)

    a0 = glob.a
    b0 = glob.b
    a0p = glob.ap
    b0p = glob.bp
    a1 = glob.a
    b1 = glob.b
    a1p = glob.ap
    b1p = glob.bp
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

    if (!(D0 && D1 && D0p && D1p)) {
      console.log("Could not split glob there.")
      return
    }

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

    newStartNode = getNewNode(C, r)
  }

  const newGlob = {
    ...getNewGlob(newStartNode, data.nodes[glob.nodes[1]]),
    D: D1,
    Dp: D1p,
    a: a1,
    b: b1,
    ap: a1p,
    bp: b1p,
  }

  newGlob.points = getGlobPoints(
    newGlob,
    newStartNode,
    data.nodes[glob.nodes[1]]
  )

  history.execute(
    data,
    new Command({
      type: CommandType.Split,
      do(data) {
        // Old glob
        const glob = data.globs[oldGlob.id]
        glob.nodes[1] = newStartNode.id

        Object.assign(glob, {
          D: D0,
          Dp: D0p,
          a: a0,
          b: b0,
          ap: a0p,
          bp: b0p,
        })

        glob.points = getGlobPoints(
          glob,
          data.nodes[glob.nodes[0]],
          newStartNode
        )

        // New Glob
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
      },
    })
  )
}

// Reordering
export function reorderGlobs(data: IData, from: number, to: number) {
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
}

export function reorderNodes(data: IData, from: number, to: number) {
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
}

export function deleteSelection(data: IData) {
  const {
    globs: sGlobs,
    nodes: sNodes,
    selectedGlobs: sSelectedGlobIds,
    selectedNodes: sSelectedNodeIds,
  } = current(data)

  const deletedGlobIds = new Set(sSelectedGlobIds)
  const deletedNodeIds = new Set(sSelectedNodeIds)

  for (const globId in deletedGlobIds) {
    const glob = sGlobs[globId]
    deletedNodeIds.add(glob.nodes[0])
    deletedNodeIds.add(glob.nodes[1])
  }

  for (const globId in sGlobs) {
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
        deletedGlobIds.forEach((id) => delete data.globs[id])
        data.globIds = Object.keys(data.globs)

        deletedNodeIds.forEach((id) => delete data.nodes[id])
        data.nodeIds = Object.keys(data.nodes)

        data.selectedNodes = []
        data.selectedGlobs = []
      },
      undo(data) {
        deletedGlobIds.forEach((id) => (data.globs[id] = sGlobs[id]))
        data.globIds = Object.keys(data.globs)

        deletedNodeIds.forEach((id) => (data.nodes[id] = sNodes[id]))
        data.nodeIds = Object.keys(data.nodes)
      },
    })
  )
}

export function toggleSelectionLocked(data: IData) {
  const selectedNodes = [...data.selectedNodes]
  const currentLocked = Object.fromEntries(
    Object.entries(data.nodes).map(([id, node]) => [id, node.locked])
  )

  history.execute(
    data,
    new Command({
      type: CommandType.ToggleLocked,
      do(data) {
        const locked = !selectedNodes.every((id) => data.nodes[id].locked)
        for (const id of selectedNodes) {
          data.nodes[id].locked = locked
        }
      },
      undo(data) {
        for (const id in currentLocked) {
          data.nodes[id].locked = currentLocked[id]
        }
      },
    })
  )
}

export function updateGlobOptions(data: IData, options: Partial<IGlob>) {
  const snapshot = getSelectionSnapshot(data)
  const sGlobIds = [...data.selectedGlobs]

  history.execute(
    data,
    new Command({
      type: CommandType.ChangeBounds,
      do(data) {
        for (const globId of sGlobIds) {
          const glob = data.globs[globId]
          Object.assign(glob, options)
        }

        updateGlobPoints(data)
      },
      undo(data) {
        for (const globId of sGlobIds) {
          const glob = data.globs[globId]
          Object.assign(glob, snapshot.globs[globId])
        }

        updateGlobPoints(data)
      },
    })
  )
}

export function moveBounds(data: IData, delta: number[]) {
  const sNodeIds = [...data.selectedNodes]
  const sGlobIds = [...data.selectedGlobs]

  history.execute(
    data,
    new Command({
      type: CommandType.ChangeBounds,
      do(data) {
        for (const nodeId of sNodeIds) {
          const node = data.nodes[nodeId]
          node.point = vec.add(node.point, delta)
        }

        for (const globId of sGlobIds) {
          const glob = data.globs[globId]
          glob.D = vec.add(glob.D, delta)
          glob.Dp = vec.add(glob.Dp, delta)
        }
        updateGlobPoints(data)
      },
      undo(data) {
        for (const nodeId of sNodeIds) {
          const node = data.nodes[nodeId]
          node.point = vec.sub(node.point, delta)
        }

        for (const globId of sGlobIds) {
          const glob = data.globs[globId]
          glob.D = vec.sub(glob.D, delta)
          glob.Dp = vec.sub(glob.Dp, delta)
        }
        updateGlobPoints(data)
      },
    })
  )
}

export function rotateSelection(
  data: IData,
  center: number[],
  angle: number,
  snapshot: ReturnType<typeof getSelectionSnapshot>
) {
  history.execute(
    data,
    new Command({
      type: CommandType.ChangeBounds,
      do(data, initial) {
        if (initial) return

        RotateSession.rotate(data, center, angle, snapshot)
        updateGlobPoints(data)
      },
      undo(data) {
        for (const id in snapshot.nodes) {
          const sNode = snapshot.nodes[id]
          const node = data.nodes[id]
          node.point = sNode.point
          node.radius = sNode.radius
        }

        for (const id in snapshot.globs) {
          const sGlob = snapshot.globs[id]
          const glob = data.globs[id]
          Object.assign(glob, sGlob)
        }

        updateGlobPoints(data)
      },
    })
  )
}

export function transformBounds(
  data: IData,
  type: "corner" | "edge",
  value: number,
  restore: ReturnType<typeof getSelectionSnapshot>,
  snapshot: TransformSessionSnapshot,
  preserveRadii: boolean
) {
  const current = TransformSession.getSnapshot(data)

  history.execute(
    data,
    new Command({
      type: CommandType.CreateNode,
      do(data, initial) {
        if (initial) return

        const { minX: x0, minY: y0, maxX: x1, maxY: y1 } = snapshot.bounds
        const { maxX: mx, maxY: my, width: mw, height: mh } = snapshot.bounds

        TransformSession.transformSelection(
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
        for (const id in restore.nodes) {
          const sNode = restore.nodes[id]
          const node = data.nodes[id]
          node.point = sNode.point
          node.radius = sNode.radius
        }

        for (const id in restore.globs) {
          const sGlob = restore.globs[id]
          const glob = data.globs[id]
          Object.assign(glob, sGlob)
        }

        updateGlobPoints(data)
      },
    })
  )
}

// This is only for resizing to specific values, e.g. via the props panel
export function resizeBounds(data: IData, size: number[]) {
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
        getResizedBounds(
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
        getResizedBounds(
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
}

export function resizeNode(
  data: IData,
  snapshot: ISelectionSnapshot,
  handleSnapshot: IResizeNodeAdjacentHandleSnapshot
) {
  const current = getSelectionSnapshot(data)

  const sGlobHandles = Object.fromEntries(
    Object.keys(handleSnapshot).map((globId) => [
      globId,
      {
        D: [...data.globs[globId].D],
        Dp: [...data.globs[globId].Dp],
      },
    ])
  )

  history.execute(
    data,
    new Command({
      type: CommandType.Move,
      do(data, initial) {
        if (initial) return

        const { nodes, globs } = data

        for (const nodeId in snapshot.nodes) {
          nodes[nodeId].radius = current.nodes[nodeId].radius
        }

        for (const globId in sGlobHandles) {
          globs[globId].D = sGlobHandles[globId].D
          globs[globId].Dp = sGlobHandles[globId].Dp
        }

        updateGlobPoints(data)

        updateGlobPoints(data)
      },
      undo(data) {
        const { nodes, globs } = data
        for (const nodeId in snapshot.nodes) {
          nodes[nodeId].radius = snapshot.nodes[nodeId].radius
        }

        for (const globId in handleSnapshot) {
          globs[globId].D = handleSnapshot[globId].D
          globs[globId].Dp = handleSnapshot[globId].Dp
        }

        updateGlobPoints(data)
      },
    })
  )
}

export function toggleNodeCap(data: IData, id: string) {
  const cap = data.nodes[id].cap
  history.execute(
    data,
    new Command({
      type: CommandType.CreateNode,
      do(data) {
        const node = data.nodes[id]
        node.cap = cap === "round" ? "flat" : "round"
      },
      undo(data) {
        const node = data.nodes[id]
        node.cap = cap
      },
    })
  )
}

export function setPropertyOnSelectedNodes(
  data: IData,
  change: Partial<{
    x: number
    y: number
    r: number
    cap: "round" | "flat"
    locked: boolean
  }>
) {
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
        for (const key in sNodes) {
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
        for (const key in sNodes) {
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
}

// export function template(data: IData) {
//   const snapshot = current(data)
//   history.execute(
//     data,
//     new Command({
//       type: CommandType.CreateNode,
//       do(data) {},
//       undo(data) {},
//     })
//   )
// }
