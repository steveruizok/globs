import { Intersection, ShapeInfo } from "kld-intersections"
import { IBounds, IData, IGlob, INode } from "lib/types"
import BaseSession from "./BaseSession"
import inputs from "lib/inputs"
import { screenToWorld, getBoundsBoundsIntersection } from "lib/utils"
import {
  getNodeBounds,
  getBoundsBetweenPoints,
  boundsContain,
  getGlobBounds,
} from "lib/bounds-utils"
import * as vec from "lib/vec"

interface BrushSnapshot {
  selectedNodeIds: string[]
  selectedGlobIds: string[]
  nodes: Record<
    string,
    { bounds: IBounds; intersector: (...lines: any[]) => boolean }
  >
  globs: Record<
    string,
    { bounds: IBounds; intersector: (...lines: any[]) => boolean }
  >
}

export default class BrushSession extends BaseSession {
  origin: number[]
  snapshot: BrushSnapshot

  constructor(data: IData) {
    super(data)

    this.origin = vec.round(screenToWorld(inputs.pointer.origin, data.camera))

    this.snapshot = BrushSession.getSnapshot(data)
  }

  update = (data: IData) => {
    const { origin, snapshot } = this
    const { globs, nodes } = data
    const point = screenToWorld(inputs.pointer.point, data.camera)

    const bounds = getBoundsBetweenPoints(origin, point)
    const { minX: x, minY: y, width: w, height: h } = bounds

    const rect = ShapeInfo.rectangle({
      left: x,
      top: y,
      width: w,
      height: h,
    })

    // We need to find out which of our nodes and globs are being intersected
    // by the user's brush. We need to check all of the items in a user's project,
    // so we want to do this AS FAST AS POSSIBLE. (Considering using rbush and
    // doing the following hit tests on a web worker).

    // If the user is holding Shift, then start from the originally selected items.

    const selectedNodeIds = new Set(
      inputs.modifiers.shiftKey ? snapshot.selectedNodeIds : []
    )

    const selectedGlobIds = new Set(
      inputs.modifiers.shiftKey ? snapshot.selectedGlobIds : []
    )

    for (let nodeId in nodes) {
      const snap = this.snapshot.nodes[nodeId]
      if (
        !selectedNodeIds.has(nodeId) &&
        (boundsContain(bounds, snap.bounds) || snap.intersector(rect))
      ) {
        selectedNodeIds.add(nodeId)
      }
    }

    for (let globId in globs) {
      const snap = this.snapshot.globs[globId]
      if (
        !selectedGlobIds.has(globId) &&
        (boundsContain(bounds, snap.bounds) || snap.intersector(rect))
      ) {
        selectedGlobIds.add(globId)
      }
    }

    data.brush = bounds
    data.selectedNodes = Array.from(selectedNodeIds.values())
    data.selectedGlobs = Array.from(selectedGlobIds.values())
  }

  cancel = (data: IData) => {
    data.brush = undefined
    data.selectedNodes = this.snapshot.selectedNodeIds
    data.selectedGlobs = this.snapshot.selectedGlobIds
  }

  complete = (data: IData) => {
    data.brush = undefined
  }

  static getSnapshot(data: IData) {
    return {
      selectedNodeIds: [...data.selectedNodes],
      selectedGlobIds: [...data.selectedGlobs],
      nodes: Object.fromEntries(
        Object.entries(data.nodes).map(([id, node]) => [
          id,
          {
            intersector: BrushSession.getNodeBrushIntersector(node),
            bounds: getNodeBounds(node),
          },
        ])
      ),
      globs: Object.fromEntries(
        Object.entries(data.globs).map(([id, glob]) => [
          id,
          {
            intersector: BrushSession.getGlobBrushIntersector(
              glob,
              data.nodes[glob.nodes[0]],
              data.nodes[glob.nodes[1]]
            ),
            bounds: getGlobBounds(
              glob,
              data.nodes[glob.nodes[0]],
              data.nodes[glob.nodes[1]]
            ),
          },
        ])
      ),
    }
  }

  static getGlobBrushIntersector(glob: IGlob, start: INode, end: INode) {
    const { E0, F0, F1, E1, E0p, F0p, F1p, E1p } = glob.points
    const c0 = ShapeInfo.cubicBezier({ p1: E0, p2: F0, p3: F1, p4: E1 })
    const c1 = ShapeInfo.cubicBezier({ p1: E0p, p2: F0p, p3: F1p, p4: E1p })
    const n0 = ShapeInfo.circle({ center: start.point, radius: start.radius })
    const n1 = ShapeInfo.circle({ center: end.point, radius: end.radius })
    return function linesIntersectGlob(rect: typeof ShapeInfo.Rectangle) {
      return (
        Intersection.intersect(n0, rect)?.points.length ||
        Intersection.intersect(n1, rect)?.points.length ||
        Intersection.intersect(c0, rect)?.points.length ||
        Intersection.intersect(c1, rect)?.points.length
      )
    }
  }

  static getNodeBrushIntersector(node: INode) {
    const A = ShapeInfo.circle({ center: node.point, radius: node.radius })
    return function linesIntersectGlob(rect: typeof ShapeInfo.Rectangle) {
      return Intersection.intersect(A, rect)?.points.length
    }
  }
}
