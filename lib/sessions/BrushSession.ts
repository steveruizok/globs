import intersect from "path-intersection"
import { IAnchor, IBounds, IData } from "lib/types"
import BaseSession from "./BaseSession"
import * as svg from "lib/svg"
import RBush from "rbush"
import inputs from "lib/inputs"
import {
  screenToWorld,
  getGlobOutline,
  pointInCircle,
  pointInRect,
  getCircleBoundsIntersection,
} from "lib/utils"
import {
  getGlobInnerBounds,
  getNodeBounds,
  boundsCollide,
  getBoundsBetweenPoints,
  boundsContain,
  getGlobBounds,
  pointInBounds,
} from "lib/bounds-utils"
import * as vec from "lib/vec"

interface NodeBushData extends IBounds {
  id: string
}

interface GlobBushData extends IBounds {
  id: string
  path: string
}

export default class BrushSession extends BaseSession {
  origin: number[]
  snapshot: {
    tree: RBush<NodeBushData | GlobBushData>
    selectedNodeIds: string[]
    selectedGlobIds: string[]
  }

  constructor(data: IData) {
    super(data)

    this.origin = vec.round(screenToWorld(inputs.pointer.origin, data.camera))

    this.snapshot = BrushSession.getSnapshot(data)
  }

  update = (data: IData) => {
    const { origin, snapshot } = this
    const point = screenToWorld(inputs.pointer.point, data.camera)

    const bounds = getBoundsBetweenPoints(origin, point)

    const boundsPath = svg.rectFromBounds(bounds)

    // We need to find out which of our nodes and globs are being intersected
    // by the user's brush. We need to check all of the items in a user's project,
    // so we want to do this AS FAST AS POSSIBLE.

    // If the user is holding Shift, then start from the originally selected items.

    const selectedNodeIds = new Set(
      inputs.modifiers.shiftKey ? snapshot.selectedNodeIds : []
    )

    const selectedGlobIds = new Set(
      inputs.modifiers.shiftKey ? snapshot.selectedGlobIds : []
    )

    // Our snapshot already contains an optimized R-tree containing all of the
    // bounding boxes for the project's nodes and globs. Start by searching this
    // tree for items whose bounding box intersects with or is contained by the
    // bounds of our user's brush.
    const hits = snapshot.tree.search(bounds)

    for (let hit of hits) {
      if ("path" in hit) {
        // For intersected globs, make a second check if the glob's bounds are fully
        // contained by the brush; if not, make a third (expensive) check using the
        // glob's svg path. (We could still carve this out of path-intersection).
        if (
          !selectedGlobIds.has(hit.id) &&
          (boundsContain(bounds, hit) || intersect(boundsPath, hit.path))
        ) {
          selectedGlobIds.add(hit.id)
        }
      } else {
        // For nodes, make a second check if the node's bounds are fully contained
        // by the brush; if not, make a third (sorta expensive) point-in-circle check.
        const node = data.nodes[hit.id]
        if (
          !selectedNodeIds.has(hit.id) &&
          (boundsContain(bounds, hit) ||
            getCircleBoundsIntersection(node.point, node.radius, bounds))
        ) {
          selectedNodeIds.add(hit.id)
        }
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
    const tree = new RBush<NodeBushData | GlobBushData>()
    tree.load([
      ...Object.values(data.nodes).map((node) => ({
        id: node.id,
        ...getNodeBounds(node),
      })),
      ...Object.values(data.globs).map((glob) => ({
        id: glob.id,
        path: getGlobOutline(glob.points),
        ...getGlobBounds(
          glob,
          data.nodes[glob.nodes[0]],
          data.nodes[glob.nodes[1]]
        ),
      })),
    ])

    return {
      tree,
      selectedNodeIds: [...data.selectedNodes],
      selectedGlobIds: [...data.selectedGlobs],
    }
  }
}
