import { getCommonBounds, getGlobBounds, getNodeBounds } from "lib/bounds-utils"
import { IBounds, ICanvasItems, IData, IGlob, INode } from "lib/types"
import {
  getClosestPointOnCircle,
  getGlob,
  getOuterTangents,
  getSnapglobs,
  getSnapshots,
  projectPoint,
} from "lib/utils"
import * as vec from "lib/vec"

export function screenToWorld(point: number[], camera: IData["camera"]) {
  return vec.add(vec.div(point, camera.zoom), camera.point)
}

export function isInView(point: number[], document: IData["document"]) {
  return !(
    point[0] < document.point[0] ||
    point[0] > document.point[0] + document.size[0] ||
    point[1] < document.point[1] ||
    point[1] > document.point[1] + document.size[1]
  )
}

export function getSafeHandlePoint(start: INode, end: INode, handle: number[]) {
  const { point: C0, radius: r0 } = start
  const { point: C1, radius: r1 } = end

  if (vec.dist(handle, C0) < r0 + 1) {
    handle = getClosestPointOnCircle(C0, r0, handle, 1)
  }

  if (vec.dist(handle, C1) < r1 + 1) {
    handle = getClosestPointOnCircle(C1, r1, handle, 1)
  }

  return handle
}

export function createNode(point: number[], radius = 25): INode {
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

export function getSelectedBoundingBox(data: IData) {
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

export function updateGlobPoints(data: IData) {
  const { globs, globIds, nodes, selectedNodes, selectedGlobs } = data

  const nodesToUpdate = new Set(selectedNodes)

  const globsToUpdate = new Set(selectedGlobs.map((id) => globs[id]))

  const sGlobs = globIds.map((id) => globs[id])

  for (let glob of sGlobs) {
    nodesToUpdate.add(glob.nodes[0])
    nodesToUpdate.add(glob.nodes[1])
  }

  for (let glob of sGlobs) {
    if (nodesToUpdate.has(glob.nodes[0]) || nodesToUpdate.has(glob.nodes[1])) {
      globsToUpdate.add(glob)
    }
  }

  globsToUpdate.forEach((glob) => {
    const [start, end] = glob.nodes.map((id) => nodes[id])
    try {
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
  })
}

// Essential when deleting or restoring nodes / globs
export function saveSelectionState(data: IData) {
  const sHighlightedNodes = [...data.highlightNodes]
  const sHoveredNodes = [...data.hoveredNodes]
  const sSelectedNodes = [...data.selectedNodes]
  const sHighlightedGlobs = [...data.highlightGlobs]
  const sHoveredGlobs = [...data.hoveredGlobs]
  const sSelectedGlobs = [...data.selectedGlobs]

  return function restore(data: IData) {
    data.highlightNodes = sHighlightedNodes
    data.hoveredNodes = sHoveredNodes
    data.selectedNodes = sSelectedNodes
    data.highlightGlobs = sHighlightedGlobs
    data.hoveredGlobs = sHoveredGlobs
    data.selectedGlobs = sSelectedGlobs
  }
}
