import * as vec from "lib/vec"
import * as svg from "lib/svg"
import { createState, createSelectorHook } from "@state-designer/react"
import {
  ICanvasItems,
  INode,
  IGlob,
  IData,
  IBounds,
  KeyCommand,
  ISnapTypes,
} from "lib/types"
import intersect from "path-intersection"
import {
  arrsIntersect,
  getCornerRotater,
  CornerRotater,
  CornerResizer,
  EdgeResizer,
  getCornerResizer,
  getClosestPointOnCircle,
  getEdgeResizer,
  getGlob,
  getGlobPath,
  getOuterTangents,
  projectPoint,
  rectContainsRect,
  round,
  throttle,
  getLineLineIntersection,
  resizeBounds,
} from "utils"
import { getClosestPointOnCurve, getNormalOnCurve } from "lib/bez"
import { initialData } from "./data"
import { motionValue } from "framer-motion"
import {
  getCommonBounds,
  getGlobBounds,
  getGlobInnerBounds,
  getNodeBounds,
} from "./bounds-utils"

export const elms: Record<string, SVGPathElement> = {}

const state = createState({
  data: initialData,
  onEnter: "setup",
  on: {
    MOUNTED_ELEMENT: { secretlyDo: "mountElement" },
    UNMOUNTED_ELEMENT: { secretlyDo: "deleteElement" },
    MOUNTED: { do: ["setup", "setViewport"], to: "selecting" },
    UNMOUNTED: "teardown",
    RESIZED: "setViewport",
    STARTED_CREATING_NODES: { to: "creatingNodes" },

    STARTED_LINKING_NODES: {
      if: "hasSelectedNodes",
      to: "linkingNodes",
    },
    SET_NODES_X: ["setSelectedNodesPointX", "updateGlobPoints"],
    SET_NODES_Y: ["setSelectedNodesPointY", "updateGlobPoints"],
    SET_NODES_RADIUS: ["setSelectedNodesRadius", "updateGlobPoints"],
    SET_NODES_CAP: ["setSelectedNodesCap", "updateGlobPoints"],
    SET_NODES_LOCKED: "setSelectedNodesLocked",
    SET_GLOB_OPTIONS: ["setSelectedGlobOptions", "updateGlobPoints"],
    CHANGED_BOUNDS_X: ["changeBoundsX", "updateGlobPoints"],
    CHANGED_BOUNDS_Y: ["changeBoundsY", "updateGlobPoints"],
    CHANGED_BOUNDS_WIDTH: ["changeBoundsWidth", "updateGlobPoints"],
    CHANGED_BOUNDS_HEIGHT: ["changeBoundsHeight", "updateGlobPoints"],
    PRESSED_SPACE: "enableFill",
    RELEASED_SPACE: "disableFill",
    TOGGLED_NODE_LOCKED: "toggleNodeLocked",
    WHEELED: {
      ifAny: ["hasShift", "isTrackpadZoom"],
      do: ["zoomCamera", "updateMvPointer"],
      else: ["wheelPanCamera", "updateMvPointer"],
    },
    MOVED_POINTER: { secretlyDo: "updateMvPointer" },
    ZOOMED_TO_FIT: "zoomToFit",
  },
  states: {
    tool: {
      initial: "selecting",
      states: {
        selecting: {
          on: {
            LOCKED_NODES: "lockSelectedNodes",
          },
          initial: "notPointing",
          states: {
            notPointing: {
              onEnter: "saveData",
              on: {
                CANCELLED: "clearSelection",
                DELETED: {
                  do: [
                    "deleteSelectedGlobs",
                    "deleteSelectedNodes",
                    "clearSelection",
                    "saveData",
                  ],
                },
                TOGGLED_CAP: "toggleNodeCap",
                HIGHLIT_GLOB: "pushHighlightGlob",
                HIGHLIT_NODE: "pushHighlightNode",
                UNHIGHLIT_GLOB: "pullHighlightGlob",
                UNHIGHLIT_NODE: "pullHighlightNode",
                HOVERED_GLOB: "pushHoveredGlob",
                UNHOVERED_GLOB: "pullHoveredGlob",
                HOVERED_NODE: "pushHoveredNode",
                UNHOVERED_NODE: "pullHoveredNode",
                MOVED_NODE_ORDER: "moveNodeOrder",
                MOVED_GLOB_ORDER: "moveGlobOrder",
                SELECTED_NODE: [
                  {
                    if: "hasShift",
                    then: {
                      if: "nodeIsSelected",
                      do: "pullSelectedNode",
                      else: "pushSelectedNode",
                    },
                    else: {
                      do: "setSelectedNode",
                    },
                  },

                  { if: "nodeIsHovered", to: "pointingNodes" },
                ],
                SELECTED_GLOB: [
                  {
                    if: ["globIsSelected", "hasMeta"],
                    to: "splittingGlob",
                  },
                  {
                    if: "globIsSelected",
                    then: {
                      if: "hasShift",
                      do: "pullSelectedGlob",
                      else: "setSelectedGlob",
                    },
                    else: {
                      if: "hasShift",
                      do: "pushSelectedGlob",
                      else: "setSelectedGlob",
                    },
                  },

                  { if: "globIsHovered", to: "pointingBounds" },
                ],
                SELECTED_ANCHOR: {
                  do: ["setSelectingAnchor"],
                  to: "pointingAnchor",
                },
                POINTED_HANDLE: {
                  do: ["setSelectingHandle"],
                  to: "pointingHandle",
                },
                POINTED_CANVAS: [
                  { if: "hasMeta", break: true },
                  {
                    if: "hasSelection",
                    do: ["clearSelection"],
                  },
                  {
                    wait: 0.01,
                    ifAny: ["hasSpace", "isMultitouch"],
                    to: "canvasPanning",
                    else: {
                      to: "brushSelecting",
                    },
                  },
                ],
                POINTED_BOUNDS: {
                  to: "pointingBounds",
                },
                POINTED_BOUNDS_EDGE: {
                  to: "edgeResizing",
                },
                POINTED_BOUNDS_CORNER: {
                  to: "cornerResizing",
                },
                POINTED_ROTATE_CORNER: {
                  to: "cornerRotating",
                },
              },
            },
            canvasPanning: {
              on: {
                MOVED_POINTER: {
                  do: "panCamera",
                },
                STOPPED_POINTING: {
                  to: "notPointing",
                },
              },
            },
            pointingBounds: {
              onEnter: ["setInitialNodes", "setInitialGlobs"],
              onExit: ["clearInitialNodes", "clearSnaps", "saveData"],
              on: {
                CANCELLED: { do: "returnSelected", to: "notPointing" },
                WHEELED: ["moveSelected", "updateGlobPoints"],
                MOVED_POINTER: ["moveSelected", "updateGlobPoints"],
                STOPPED_POINTING: {
                  to: "notPointing",
                },
              },
            },
            pointingNodes: {
              onExit: ["clearInitialNodes", "clearSnaps", "saveData"],
              onEnter: [
                "setInitialNodes",
                "setInitialGlobs",
                "setInitialPoints",
                "setSnapPoints",
              ],
              on: {
                CANCELLED: { do: "returnSelected", to: "notPointing" },
                WHEELED: ["moveSelected", "updateGlobPoints"],
                MOVED_POINTER: [
                  {
                    if: "hasMeta",
                    do: ["resizeNode", "updateGlobPoints"],
                    else: ["moveSelected", "updateGlobPoints"],
                  },
                ],
                STOPPED_POINTING: {
                  to: "notPointing",
                },
              },
            },
            pointingHandle: {
              onExit: ["clearSnaps", "saveData"],
              onEnter: ["setInitialGlobs", "setSnapPoints"],
              on: {
                WHEELED: ["moveSelectedHandle"],
                MOVED_POINTER: ["moveSelectedHandle"],
                STOPPED_POINTING: {
                  do: ["clearSelectedHandle"],
                  to: "notPointing",
                },
              },
            },
            pointingAnchor: {
              onExit: ["clearSnaps", "saveData"],
              on: {
                WHEELED: ["moveSelectedAnchor"],
                MOVED_POINTER: ["moveSelectedAnchor"],
                STOPPED_POINTING: {
                  do: "clearSelectedAnchor",
                  to: "notPointing",
                },
              },
            },
            brushSelecting: {
              onEnter: "startBrush",
              onExit: "clearBrush",
              on: {
                MOVED_POINTER: ["updateBrush", "updateBrushSelection"],
                WHEELED: ["updateBrush", "updateBrushSelection"],
                STOPPED_POINTING: { to: "notPointing" },
                CANCELLED: { to: "notPointing" },
              },
            },
            edgeResizing: {
              onEnter: ["setBounds", "setResizingEdge"],
              on: {
                MOVED_POINTER: ["edgeResize", "updateGlobPoints"],
                WHEELED: ["edgeResize", "updateGlobPoints"],
                STOPPED_POINTING: { to: "notPointing" },
                CANCELLED: { to: "notPointing" },
              },
            },
            cornerResizing: {
              onEnter: ["setBounds", "setResizingCorner"],
              on: {
                MOVED_POINTER: ["cornerResize", "updateGlobPoints"],
                WHEELED: ["cornerResize", "updateGlobPoints"],
                STOPPED_POINTING: { to: "notPointing" },
                CANCELLED: { to: "notPointing" },
              },
            },
            cornerRotating: {
              onEnter: ["setBounds", "setRotatingCorner"],
              on: {
                MOVED_POINTER: ["cornerRotate", "updateGlobPoints"],
                WHEELED: ["cornerRotate", "updateGlobPoints"],
                STOPPED_POINTING: { to: "notPointing" },
                CANCELLED: { to: "notPointing" },
              },
            },
          },
        },
        cloningNodes: {
          onEnter: "createClones",
          onExit: "saveData",
          on: {
            CANCELLED: { to: "selecting" },
            MOVED_POINTER: {},
            STOPPED_POINTING: {
              to: "selecting",
            },
          },
        },
        creatingNodes: {
          onExit: "saveData",
          on: {
            CANCELLED: { to: "selecting" },
            POINTED_CANVAS: {
              do: "createNode",
              to: "selecting",
            },
          },
        },
        linkingNodes: {
          onExit: "saveData",
          on: {
            CANCELLED: { to: "selecting" },
            POINTED_CANVAS: {
              do: ["createNodeAndGlob", "saveData"],
              to: "selecting",
            },
            SELECTED_NODE: {
              do: ["createGlobBetweenNodes", "clearSelection"],
              to: "selecting",
            },
            HOVERED_NODE: { do: "setHoveredNode" },
            UNHOVERED_NODE: { do: "pullHoveredNode" },
          },
        },

        splittingGlob: {
          on: {
            POINTED_CANVAS: { unless: "hasMeta", to: "selecting" },
            CANCELLED: { to: "selecting" },
            RELEASED_META: { to: "selecting" },
            SPLIT_GLOB: {
              do: ["splitGlob", "clearSelection", "saveData"],
              to: "selecting",
            },
          },
        },
      },
    },
  },
  conditions: {
    hasSelection(data) {
      const { selectedNodes, selectedGlobs } = data
      return selectedGlobs.length > 0 || selectedNodes.length > 0
    },
    nodeIsHovered(data, payload: { id: string }) {
      return data.hoveredNodes.includes(payload.id)
    },
    nodeIsSelected(data, payload: { id: string }) {
      return data.selectedNodes.includes(payload.id)
    },
    hasSelectedNodes(data) {
      return data.selectedNodes.length > 0
    },
    globIsHovered(data, payload: { id: string }) {
      return data.hoveredGlobs.includes(payload.id)
    },
    globIsSelected(data, payload: { id: string }) {
      return data.selectedGlobs.includes(payload.id)
    },
    isTrackpadZoom(data, payload: { ctrlKey: boolean }) {
      return keys.Alt || payload.ctrlKey
    },
    hasControl() {
      return keys.Control
    },
    hasMeta() {
      return keys.Meta
    },
    hasShift() {
      return keys.Shift
    },
    hasSpace() {
      return keys[" "]
    },
    isMultitouch(data) {
      return pointer.points.size > 1
    },
  },
  actions: {
    // CLONES
    createClones(data) {},
    // BOUNDS
    setBounds(data, payload: { bounds: IBounds }) {
      data.bounds = payload.bounds
    },
    changeBoundsX(data, payload: { value: number }) {
      const { selectedNodes, selectedGlobs, nodes, globs } = data
      const bounds = getSelectedBoundingBox(data)
      const dx = payload.value - bounds.x

      const sNodes = selectedNodes.map((id) => nodes[id])
      const sGlobs = selectedGlobs.map((id) => globs[id])

      let nodesToChange = new Set(sNodes)

      // for (let glob of sGlobs) {
      //   nodesToChange.add(nodes[glob.nodes[0]])
      //   nodesToChange.add(nodes[glob.nodes[1]])
      // }

      for (let node of nodesToChange) {
        node.point[0] += dx
      }

      for (let glob of sGlobs) {
        glob.options.D[0] += dx
        glob.options.Dp[0] += dx
      }
    },
    changeBoundsY(data, payload: { value: number }) {
      const { selectedNodes, selectedGlobs, nodes, globs } = data
      const bounds = getSelectedBoundingBox(data)
      const dy = payload.value - bounds.y

      const sNodes = selectedNodes.map((id) => nodes[id])
      const sGlobs = selectedGlobs.map((id) => globs[id])

      let nodesToChange = new Set(sNodes)

      // for (let glob of sGlobs) {
      //   nodesToChange.add(nodes[glob.nodes[0]])
      //   nodesToChange.add(nodes[glob.nodes[1]])
      // }

      for (let node of nodesToChange) {
        node.point[1] += dy
      }

      for (let glob of sGlobs) {
        glob.options.D[1] += dy
        glob.options.Dp[1] += dy
      }
    },
    changeBoundsWidth(data, payload: { value: number }) {
      const { selectedNodes, selectedGlobs, nodes, globs } = data
      const bounds = getSelectedBoundingBox(data)

      const dx = payload.value - bounds.width

      const sNodes = selectedNodes.map((id) => nodes[id])
      const sGlobs = selectedGlobs.map((id) => globs[id])

      resizeBounds(sNodes, sGlobs, bounds, dx, 0)
    },
    changeBoundsHeight(data, payload: { value: number }) {
      const { selectedNodes, selectedGlobs, nodes, globs } = data
      const bounds = getSelectedBoundingBox(data)

      const dy = payload.value - bounds.height

      const sNodes = selectedNodes.map((id) => nodes[id])
      const sGlobs = selectedGlobs.map((id) => globs[id])

      resizeBounds(sNodes, sGlobs, bounds, 0, dy)
    },

    // RESIZING
    setResizingCorner(data, payload: { corner: number }) {
      const { selectedNodes, selectedGlobs, globs, nodes } = data

      cornerResizer = getCornerResizer(
        selectedNodes.map((id) => nodes[id]),
        selectedGlobs.map((id) => globs[id]),
        getSelectedBoundingBox(data),
        payload.corner
      )
    },
    cornerResize(data) {
      const { selectedNodes, selectedGlobs, globs, nodes, camera } = data

      cornerResizer(
        screenToWorld(pointer.point, camera.point, camera.zoom),
        selectedNodes.map((id) => nodes[id]),
        selectedGlobs.map((id) => globs[id]),
        keys.Meta
      )
    },
    setResizingEdge(data, payload: { edge: number }) {
      const { selectedNodes, selectedGlobs, globs, nodes } = data

      edgeResizer = getEdgeResizer(
        selectedNodes.map((id) => nodes[id]),
        selectedGlobs.map((id) => globs[id]),
        getSelectedBoundingBox(data),
        payload.edge
      )
    },
    edgeResize(data) {
      const { selectedNodes, selectedGlobs, nodes, globs, camera } = data

      edgeResizer(
        screenToWorld(pointer.point, camera.point, camera.zoom),
        selectedNodes.map((id) => nodes[id]),
        selectedGlobs.map((id) => globs[id]),
        keys.Meta
      )
    },
    setRotatingCorner(data) {
      const { selectedNodes, selectedGlobs, globs, nodes, camera } = data

      cornerRotater = getCornerRotater(
        selectedNodes.map((id) => nodes[id]),
        selectedGlobs.map((id) => globs[id]),
        screenToWorld(pointer.point, camera.point, camera.zoom),
        getSelectedBoundingBox(data)
      )
    },
    cornerRotate(data) {
      const { selectedNodes, selectedGlobs, globs, nodes, camera } = data

      cornerRotater(
        screenToWorld(pointer.point, camera.point, camera.zoom),
        selectedNodes.map((id) => nodes[id]),
        selectedGlobs.map((id) => globs[id])
      )
    },

    // ELEMENT REFERENCES
    mountElement(data, payload: { id: string; elm: SVGPathElement }) {
      elms[payload.id] = payload.elm
    },
    deleteElement(data, payload: { id: string }) {
      delete elms[payload.id]
    },

    // POINTER
    updateMvPointer(data) {
      updateMvPointer(pointer, data.camera)
    },

    // DISPLAY
    enableFill(data) {
      data.fill = true
    },
    disableFill(data) {
      data.fill = false
    },

    // BRUSH
    startBrush(data) {
      const { nodes, globs, camera } = data

      const targets = [
        ...Object.values(nodes).map((node) => {
          return {
            id: node.id,
            type: "node" as const,
            path: svg.ellipse(node.point, node.radius),
          }
        }),
        ...Object.values(globs).map((glob) => {
          let path = ""

          try {
            path = getGlobPath(glob, nodes[glob.nodes[0]], nodes[glob.nodes[1]])
          } catch (e) {}

          return {
            id: glob.id,
            type: "glob" as const,
            path,
          }
        }),
      ]

      data.brush = {
        start: screenToWorld(pointer.point, camera.point, camera.zoom),
        end: screenToWorld(pointer.point, camera.point, camera.zoom),
        targets,
      }
    },
    updateBrush(data) {
      const { brush, camera } = data
      brush.end = screenToWorld(pointer.point, camera.point, camera.zoom)
    },
    updateBrushSelection(data) {
      const { brush, nodes, globs } = data
      const { start, end } = brush
      const x0 = Math.min(start[0], end[0])
      const y0 = Math.min(start[1], end[1])
      const y1 = Math.max(start[1], end[1])
      const x1 = Math.max(start[0], end[0])

      const rect = [
        svg.moveTo([x0, y0]),
        svg.lineTo([x1, y0]),
        svg.lineTo([x1, y1]),
        svg.lineTo([x0, y1]),
        svg.closePath(),
      ].join(" ")

      data.selectedGlobs = []
      data.selectedNodes = []

      for (let target of brush.targets) {
        let bounds: IBounds

        if (target.type === "node") {
          const node = nodes[target.id]

          if (!node) {
            throw Error("Could not find that node!")
          }

          bounds = getNodeBounds(nodes[target.id])
        } else {
          const glob = globs[target.id]

          if (!glob) {
            throw Error("Could not find that glob!")
          }

          try {
            bounds = getGlobInnerBounds(globs[target.id])
          } catch (e) {
            console.warn("Could not get bounds", e)
          }
        }

        if (
          (bounds && rectContainsRect(x0, y0, x1, y1, bounds)) ||
          intersect(rect, target.path, true)
        ) {
          if (target.type === "glob") {
            data.selectedGlobs.push(target.id)
          } else if (target.type === "node") {
            data.selectedNodes.push(target.id)
          }
        }
      }
    },
    clearBrush(data) {
      data.brush = undefined
    },

    // CAMERA
    panCamera(data) {
      const { camera, document } = data
      camera.point = vec.round(
        vec.sub(camera.point, vec.div(pointer.delta, camera.zoom))
      )
      document.point = camera.point
    },
    wheelPanCamera(data, payload: { delta: number[] }) {
      const { camera, document } = data
      const delta = vec.div(vec.neg(payload.delta), camera.zoom)
      camera.point = vec.round(vec.sub(camera.point, delta))
      pointer.delta = vec.mul(vec.neg(delta), camera.zoom)
      document.point = camera.point
    },
    zoomCamera(data, payload: { delta: number[] }) {
      const { camera, viewport, document } = data
      const { point } = pointer

      const delta =
        (vec.mul(vec.neg(payload.delta), 5)[1] / 500) *
        Math.max(0.1, camera.zoom)

      const pt0 = vec.add(vec.div(point, camera.zoom), camera.point)

      camera.zoom = Math.max(Math.min(camera.zoom + delta, 10), 0.001)
      camera.zoom = Math.round(camera.zoom * 100) / 100

      const pt1 = vec.add(vec.div(point, camera.zoom), camera.point)

      camera.point = vec.round(vec.sub(camera.point, vec.sub(pt1, pt0)))

      document.size = vec.round(vec.div(viewport.size, camera.zoom))
      document.point = camera.point
    },
    zoomToFit(data) {
      const { camera, viewport, document } = data

      camera.point = [-viewport.size[0] / 2, -viewport.size[1] / 2]
      camera.zoom = 1
      document.size = vec.round(vec.div(viewport.size, camera.zoom))
      document.point = camera.point

      // if (nodeIds.length + globIds.length === 0) return null

      // const bounds = getCommonBounds(
      //   ...globIds
      //     .map((id) => globs[id])
      //     .filter((glob) => glob.points !== null)
      //     .map((glob) =>
      //       getGlobBounds(glob, nodes[glob.nodes[0]], nodes[glob.nodes[1]])
      //     ),
      //   ...nodeIds.map((id) => getNodeBounds(nodes[id]))
      // )

      // camera.point = [bounds.x - 800, bounds.y - 200]
      // camera.zoom = (viewport.size[0] - 400) / bounds.width

      // document.size = vec.round(vec.div(viewport.size, camera.zoom))
      // document.point = camera.point
    },

    // VIEWPORT
    setViewport(data, payload: { size: number[] }) {
      const { viewport, camera, document } = data
      const c0 = screenToWorld(
        vec.add(document.point, vec.div(viewport.size, 2)),
        camera.point,
        camera.zoom
      )
      viewport.size = payload.size
      document.size = vec.round(vec.div(viewport.size, camera.zoom))
      const c1 = screenToWorld(
        vec.add(document.point, vec.div(viewport.size, 2)),
        camera.point,
        camera.zoom
      )
      document.point = vec.sub(document.point, vec.sub(c1, c0))
      camera.point = document.point
    },

    // SELECTION
    clearSelection(data) {
      data.selectedHandle = undefined
      data.selectedNodes = []
      data.selectedGlobs = []
      data.highlightNodes = []
      data.highlightGlobs = []
    },

    // HOVERS / HIGHLIGHTS
    pushHighlightGlob(data, payload: { id: string }) {
      if (data.highlightGlobs.includes(payload.id)) return
      data.highlightGlobs.push(payload.id)
    },
    pullHighlightGlob(data, payload: { id: string }) {
      const index = data.highlightGlobs.indexOf(payload.id)
      data.highlightGlobs.splice(index, 1)
    },
    pushHoveredGlob(data, payload: { id: string }) {
      if (data.hoveredGlobs.includes(payload.id)) return
      data.hoveredGlobs.push(payload.id)
    },
    pullHoveredGlob(data, payload: { id: string }) {
      const index = data.hoveredGlobs.indexOf(payload.id)
      data.hoveredGlobs.splice(index, 1)
    },
    setHoveredGlobs(data, payload: { ids: string[] }) {
      data.hoveredGlobs = payload.ids
      data.highlightGlobs = []
    },
    setHoveredGlob(data, payload: { id: string }) {
      data.hoveredGlobs = [payload.id]
      data.highlightGlobs = []
    },
    pushHighlightNode(data, payload: { id: string }) {
      if (data.highlightNodes.includes(payload.id)) return
      data.highlightNodes.push(payload.id)
    },
    pullHighlightNode(data, payload: { id: string }) {
      const index = data.highlightNodes.indexOf(payload.id)
      data.highlightNodes.splice(index, 1)
    },
    pushHoveredNode(data, payload: { id: string }) {
      if (data.hoveredNodes.includes(payload.id)) return
      data.hoveredNodes.push(payload.id)
    },
    pullHoveredNode(data, payload: { id: string }) {
      const index = data.hoveredNodes.indexOf(payload.id)
      data.hoveredNodes.splice(index, 1)
    },
    setHoveredNode(data, payload: { id: string }) {
      data.hoveredNodes = []
    },
    clearHovers(data) {
      data.hoveredGlobs = []
      data.hoveredNodes = []
    },

    // NODES
    createNode(data) {
      const { nodes, nodeIds, camera } = data
      const point = screenToWorld(pointer.point, camera.point, camera.zoom)
      const node = createNode(point)
      nodeIds.push(node.id)
      nodes[node.id] = node
      data.hoveredNodes = [node.id]
      data.selectedNodes = [node.id]
    },
    resizeNode(data) {
      const { nodes, hoveredNodes, camera, selectedNodes } = data
      if (selectedNodes[0] !== hoveredNodes[0]) return
      const node = nodes[selectedNodes[0]]
      const point = screenToWorld(pointer.point, camera.point, camera.zoom)
      node.radius = round(vec.dist(point, node.point))
    },
    setSelectedNode(data, payload: { id: string }) {
      data.bounds = undefined
      data.selectedHandle = undefined
      data.selectedAnchor = undefined
      data.selectedGlobs = []
      data.selectedNodes = [payload.id]
    },
    pushSelectedNode(data, payload: { id: string }) {
      data.selectedNodes.push(payload.id)
    },
    pullSelectedNode(data, payload: { id: string }) {
      data.selectedNodes = data.selectedNodes.filter((id) => id !== payload.id)
    },
    toggleNodeCap(data, payload: { id: string }) {
      const node = data.nodes[payload.id]
      node.cap = node.cap === "round" ? "flat" : "round"
    },
    setSelectedNodesPointX(data, payload: { value: number }) {
      for (let id of data.selectedNodes) {
        data.nodes[id].point[0] = payload.value
      }
    },
    setSelectedNodesPointY(data, payload: { value: number }) {
      for (let id of data.selectedNodes) {
        data.nodes[id].point[1] = payload.value
      }
    },
    setSelectedNodesRadius(data, payload: { value: number }) {
      for (let id of data.selectedNodes) {
        data.nodes[id].radius = payload.value
      }
    },
    setSelectedNodesCap(data, payload: { value: "round" | "flat" }) {
      for (let id of data.selectedNodes) {
        data.nodes[id].cap = payload.value
      }
    },
    setSelectedNodesLocked(data, payload: { value: boolean }) {
      for (let id of data.selectedNodes) {
        data.nodes[id].locked = payload.value
      }
    },
    deleteSelectedNodes(data) {
      const { globIds, globs, nodeIds, nodes, selectedNodes } = data
      data.nodeIds = nodeIds.filter((id) => !selectedNodes.includes(id))

      // pull(data.nodeIds, ...data.selectedNodes)
      for (let id of selectedNodes) {
        delete nodes[id]

        for (let gid of globIds) {
          const glob = globs[gid]
          if (!glob) continue

          if (glob.nodes.includes(id)) {
            data.globIds = data.globIds.filter((g) => g !== gid)
            delete globs[gid]
          }
        }
      }

      data.selectedNodes = []
    },
    moveNodeOrder(
      data,
      payload: {
        id: string
        from: number
        to: number
        reason: string
      }
    ) {
      if (payload.reason === "CANCEL") return

      const { nodeIds } = data
      nodeIds.splice(nodeIds.indexOf(payload.id), 1)
      nodeIds.splice(payload.to, 0, payload.id)
    },
    setInitialNodes(data) {
      const { selectedNodes, selectedGlobs, globs, nodes } = data

      data.initialNodes = {}

      for (let id of selectedNodes) {
        data.initialNodes[id] = { ...nodes[id] }
      }

      for (let globId of selectedGlobs) {
        const glob = globs[globId]
        for (let nodeId of glob.nodes) {
          data.initialNodes[nodeId] = { ...nodes[nodeId] }
        }
      }
    },
    clearInitialNodes(data) {
      data.initialNodes = {}
    },

    // GLOBS
    createNodeAndGlob(data) {
      const { selectedNodes, nodes, globs, globIds, camera } = data

      const minRadius = selectedNodes.reduce(
        (a, c) => (nodes[c].radius < a ? nodes[c].radius : a),
        nodes[selectedNodes[0]].radius
      )

      const newNode = createNode(
        screenToWorld(pointer.point, camera.point, camera.zoom)
      )

      newNode.radius = minRadius

      data.nodeIds.push(newNode.id)
      data.nodes[newNode.id] = newNode

      for (let nodeId of selectedNodes) {
        const glob = createGlob(nodes[nodeId], nodes[newNode.id])
        globIds.push(glob.id)
        data.globs[glob.id] = glob
      }

      data.selectedGlobs = []
      data.selectedNodes = [newNode.id]
    },
    setSelectedGlob(data, payload: { id: string }) {
      data.bounds = undefined
      data.selectedHandle = undefined
      data.selectedAnchor = undefined
      data.selectedNodes = []
      data.selectedGlobs = [payload.id]
    },
    pushSelectedGlob(data, payload: { id: string }) {
      data.selectedGlobs.push(payload.id)
      data.selectedHandle = undefined
      data.selectedAnchor = undefined
      data.selectedNodes = []
    },
    pullSelectedGlob(data, payload: { id: string }) {
      data.selectedGlobs = data.selectedGlobs.filter((id) => id !== payload.id)
    },
    returnSelected(data) {
      const { nodes, globs, initialPoints, camera } = data

      // Move nodes back to the initial points.
      for (let nodeId in initialPoints.nodes) {
        nodes[nodeId].point = initialPoints.nodes[nodeId]
      }

      // Move handles back by the same delta, too.
      for (let globId of data.selectedGlobs) {
        globs[globId].options.D = initialPoints.globs[globId].D
        globs[globId].options.Dp = initialPoints.globs[globId].Dp
      }
    },
    setInitialGlobs(data) {
      const { selectedGlobs, globs } = data

      data.initialGlobs = {}

      for (let id of selectedGlobs) {
        data.initialGlobs[id] = { ...globs[id] }
      }
    },
    clearInitialGlobs(data) {
      data.initialGlobs = {}
    },
    moveSelected(data) {
      const {
        selectedGlobs,
        selectedNodes,
        globs,
        nodes,
        snaps,
        camera,
        initialNodes,
        initialGlobs,
      } = data

      const delta = vec.div(pointer.delta, camera.zoom)
      const originDelta = vec.div(
        vec.sub(pointer.point, pointer.origin),
        camera.zoom
      )

      snaps.active = []

      // Just moving one node?
      if (selectedNodes.length === 1 && selectedGlobs.length === 0) {
        const node = nodes[selectedNodes[0]]
        let next: number[]

        if (keys.Shift) {
          next = vec.round(
            vec.add(data.initialPoints.nodes[node.id], originDelta)
          )

          if (pointer.axis === "x") {
            node.point = [next[0], initialNodes[node.id].point[1]]
          } else if (pointer.axis === "y") {
            node.point = [initialNodes[node.id].point[0], next[1]]
          }
          return
        }

        // Node center, plus + vector from origin to node center + vector from origin to current
        const pt = initialNodes[node.id].point
        const pOrigin = screenToWorld(pointer.origin, camera.point, camera.zoom)
        const pPoint = screenToWorld(pointer.point, camera.point, camera.zoom)

        // const distFromInitialCenter = vec.vec(pOrigin, pt)
        next = vec.round(vec.add(pt, vec.vec(pOrigin, pPoint)), 2)

        if (!keys.Alt && vec.len(delta) < 3) {
          let snappedX = false
          let snappedY = false

          // Centers
          for (let id in snaps.nodes) {
            if (id === node.id) continue
            const snap = snaps.nodes[id]

            if (!isInView(snap.point, data.document)) continue

            const d = vec.dist(next, snap.point) * camera.zoom
            if (d < 3) {
              // Snap to point
              next = snap.point
              snaps.active.push({
                type: ISnapTypes.NodesCenter,
                from: snap.point,
                to: next,
              })
              snappedX = true
              snappedY = true
              break
            }
          }

          // Xs and Ys
          if (!snappedX) {
            let x0: number, x1: number, dx: number
            for (let id in snaps.nodes) {
              if (id === node.id) continue
              const snap = snaps.nodes[id]

              if (!isInView(snap.point, data.document)) continue

              x0 = next[0]
              x1 = snap.point[0]
              dx = Math.abs(x0 - x1)

              // Check center X
              if (dx * camera.zoom < 3) {
                // Snap to x
                next[0] = x1
                snaps.active.push({
                  type: ISnapTypes.NodesX,
                  from: snap.point,
                  to: next,
                })
                snappedX = true
                break
              }

              // Secondary checks on the x axis
              if (camera.zoom >= 1) {
                // Check left
                x0 = next[0] - node.radius
                x1 = snap.point[0] - snap.radius
                dx = Math.abs(x0 - x1)

                if (dx * camera.zoom < 2) {
                  // Snap to x
                  next[0] = x1 + node.radius
                  snaps.active.push({
                    type: ISnapTypes.NodesX,
                    from: vec.sub(snap.point, [snap.radius, 0]),
                    to: vec.sub(next, [node.radius, 0]),
                  })
                  snappedX = true
                  break
                }

                // Check right
                x0 = next[0] + node.radius
                x1 = snap.point[0] + snap.radius
                dx = Math.abs(x0 - x1)

                if (dx * camera.zoom < 3) {
                  // Snap to x
                  next[0] = x1 - node.radius
                  snaps.active.push({
                    type: ISnapTypes.NodesX,
                    from: vec.add(snap.point, [snap.radius, 0]),
                    to: vec.add(next, [node.radius, 0]),
                  })
                  snappedX = true
                  break
                }

                // Check left to right
                x0 = next[0] - node.radius
                x1 = snap.point[0] + snap.radius
                dx = Math.abs(x0 - x1)

                if (dx * camera.zoom < 3) {
                  // Snap to x
                  next[0] = x1 + node.radius
                  snaps.active.push({
                    type: ISnapTypes.NodesX,
                    from: vec.add(snap.point, [snap.radius, 0]),
                    to: vec.sub(next, [node.radius, 0]),
                  })
                  snappedX = true
                  break
                }

                // Check right to left
                x0 = next[0] + node.radius
                x1 = snap.point[0] - snap.radius
                dx = Math.abs(x0 - x1)

                if (dx * camera.zoom < 3) {
                  // Snap to x
                  next[0] = x1 - node.radius
                  snaps.active.push({
                    type: ISnapTypes.NodesX,
                    from: vec.sub(snap.point, [snap.radius, 0]),
                    to: vec.add(next, [node.radius, 0]),
                  })
                  snappedX = true
                  break
                }
              }
            }
          }

          // Ys
          if (!snappedY) {
            let y0: number, y1: number, dy: number
            for (let id in snaps.nodes) {
              if (id === node.id) continue
              const snap = snaps.nodes[id]

              if (!isInView(snap.point, data.document)) continue

              y0 = next[1]
              y1 = snap.point[1]
              dy = Math.abs(y0 - y1)

              if (dy * camera.zoom < 3) {
                // Snap to y
                next[1] = y1
                snaps.active.push({
                  type: ISnapTypes.NodesY,
                  from: snap.point,
                  to: next,
                })
                snappedY = true
                break
              }

              // Secondary checks on the y axis
              if (camera.zoom >= 1) {
                // Check top to top
                y0 = next[1] - node.radius
                y1 = snap.point[1] - snap.radius
                dy = Math.abs(y0 - y1)

                if (dy * camera.zoom < 3) {
                  // Snap top to top
                  next[1] = y1 + node.radius
                  snaps.active.push({
                    type: ISnapTypes.NodesY,
                    from: vec.sub(snap.point, [0, snap.radius]),
                    to: vec.sub(next, [0, node.radius]),
                  })
                  snappedY = true
                  break
                }

                // Check bottom to bottom
                y0 = next[1] + node.radius
                y1 = snap.point[1] + snap.radius
                dy = Math.abs(y0 - y1)

                if (dy * camera.zoom < 3) {
                  next[1] = y1 - node.radius
                  snaps.active.push({
                    type: ISnapTypes.NodesY,
                    from: vec.add(snap.point, [0, snap.radius]),
                    to: vec.add(next, [0, node.radius]),
                  })
                  snappedY = true
                  break
                }

                // Check top to bottom
                y0 = next[1] - node.radius
                y1 = snap.point[1] + snap.radius
                dy = Math.abs(y0 - y1)

                if (dy * camera.zoom < 3) {
                  next[1] = y1 + node.radius
                  snaps.active.push({
                    type: ISnapTypes.NodesX,
                    from: vec.add(snap.point, [0, snap.radius]),
                    to: vec.sub(next, [0, node.radius]),
                  })
                  snappedY = true
                  break
                }

                // Check bottom to top
                y0 = next[1] + node.radius
                y1 = snap.point[1] - snap.radius
                dy = Math.abs(y0 - y1)

                if (dy * camera.zoom < 3) {
                  next[1] = y1 - node.radius
                  snaps.active.push({
                    type: ISnapTypes.NodesX,
                    from: vec.sub(snap.point, [0, snap.radius]),
                    to: vec.add(next, [0, node.radius]),
                  })
                  snappedY = true
                  break
                }
              }
            }
          }
        }

        node.point = next
        return
      }

      // Moving maybe nodes and globs
      const nodesToMove: string[] = [...selectedNodes]

      for (let globId of selectedGlobs) {
        const glob = globs[globId]
        for (let nodeId of glob.nodes) {
          if (nodesToMove.includes(nodeId)) {
            continue
          }
          nodesToMove.push(nodeId)
        }

        let nextD = vec.round(vec.add(glob.options.D, delta))
        let nextDp = vec.round(vec.add(glob.options.Dp, delta))

        if (keys.Shift) {
          if (pointer.axis === "x") {
            nextD[1] = initialGlobs[glob.id].options.D[1]
            nextDp[1] = initialGlobs[glob.id].options.Dp[1]
          } else {
            nextD[0] = initialGlobs[glob.id].options.D[0]
            nextDp[0] = initialGlobs[glob.id].options.Dp[0]
          }
        }

        glob.options.D = nextD
        glob.options.Dp = nextDp
      }

      // Move nodes
      for (let id of nodesToMove) {
        const node = nodes[id]
        if (node.locked) continue

        let next = vec.round(vec.add(nodes[id].point, delta), 2)

        if (keys.Shift) {
          if (pointer.axis === "x") {
            next[1] = initialNodes[node.id].point[1]
          } else {
            next[0] = initialNodes[node.id].point[0]
          }
        }

        node.point = next
      }

      // Move globs
      for (let id in globs) {
        const glob = globs[id]
        if (arrsIntersect(glob.nodes, nodesToMove)) {
          const { options } = glob
          const [start, end] = glob.nodes.map((id) => nodes[id])

          try {
            glob.points = getGlob(
              start.point,
              start.radius,
              end.point,
              end.radius,
              options.D,
              options.Dp,
              options.a,
              options.b,
              options.ap,
              options.bp
            )
          } catch (e) {
            glob.points = null
          }
        }
      }

      // Now update the globs!
    },
    clearSnaps(data) {
      data.snaps.active = []
    },
    setSelectedGlobOptions(data, payload: Partial<IGlob["options"]>) {
      const { globs, selectedGlobs } = data
      for (let id of selectedGlobs) {
        const glob = globs[id]
        Object.assign(glob.options, payload)
      }
    },
    updateGlobPoints(data) {
      const { globs, globIds, nodes, selectedNodes, selectedGlobs } = data

      const nodesToUpdate = new Set(selectedNodes)

      const globsToUpdate = new Set(selectedGlobs.map((id) => globs[id]))

      const sGlobs = globIds.map((id) => globs[id])

      for (let glob of sGlobs) {
        nodesToUpdate.add(glob.nodes[0])
        nodesToUpdate.add(glob.nodes[1])
      }

      for (let glob of sGlobs) {
        if (
          nodesToUpdate.has(glob.nodes[0]) ||
          nodesToUpdate.has(glob.nodes[1])
        ) {
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
    },
    createGlobBetweenNodes(data, payload: { id: string }) {
      const { selectedNodes, globs, globIds, nodes } = data
      const globsArr = Object.values(data.globs)

      for (let id of selectedNodes) {
        if (payload.id === id) continue

        // Don't re-glob
        for (let glob of globsArr) {
          if (arrsIntersect(glob.nodes, [id, payload.id])) continue
        }

        const newGlob = createGlob(nodes[id], nodes[payload.id])
        globs[newGlob.id] = newGlob
        globIds.push(newGlob.id)
      }
    },
    deleteSelectedGlobs(data) {
      const { globs, selectedGlobs } = data
      for (let gid of selectedGlobs) {
        delete globs[gid]
      }
      data.globIds = Object.keys(globs)
      data.selectedGlobs = []
    },
    toggleNodeLocked(data, payload: { id: string }) {
      data.nodes[payload.id].locked = !data.nodes[payload.id].locked
    },
    lockSelectedNodes(data) {
      const { selectedNodes, nodeIds, nodes } = data
      if (selectedNodes.every((id) => nodes[id].locked)) {
        for (let id of selectedNodes) {
          nodes[id].locked = false
        }
      } else {
        for (let id of selectedNodes) {
          nodes[id].locked = true
        }
      }
    },
    moveGlobOrder(
      data,
      payload: {
        id: string
        from: number
        to: number
        reason: string
      }
    ) {
      if (payload.reason === "CANCEL") return

      const { globIds } = data
      globIds.splice(globIds.indexOf(payload.id), 1)
      globIds.splice(payload.to, 0, payload.id)
    },
    splitGlob(data, payload: { id: string }) {
      const { globs, nodes, nodeIds, globIds } = data

      const glob = globs[payload.id]

      const point = mvPointer.world.get()

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

      const D0 = getLineLineIntersection(PL[0], PL[1], E0, D)
      const D1 = getLineLineIntersection(PL[0], PL[1], E1, D)
      const D0p = getLineLineIntersection(PLp[0], PLp[1], E0p, Dp)
      const D1p = getLineLineIntersection(PLp[0], PLp[1], E1p, Dp)

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

      const a0 = t0,
        b0 = t0,
        a0p = t0p,
        b0p = t0p,
        a1 = t1,
        b1 = t1,
        a1p = t1p,
        b1p = t1p

      try {
        const oldEndNode = nodes[glob.nodes[1]]

        const newStartNode = createNode(C, r)
        nodeIds.push(newStartNode.id)
        nodes[newStartNode.id] = newStartNode

        // Old glob
        const oldGlob = glob
        oldGlob.nodes[1] = newStartNode.id
        oldGlob.options.D = D0
        oldGlob.options.Dp = D0p
        oldGlob.options.a = a0
        oldGlob.options.b = b0
        oldGlob.options.ap = a0p
        oldGlob.options.bp = b0p

        // New Glob
        const newGlob = createGlob(newStartNode, oldEndNode)
        globIds.push(newGlob.id)
        globs[newGlob.id] = newGlob
        newGlob.options.D = D1
        newGlob.options.Dp = D1p
        oldGlob.options.a = a1
        oldGlob.options.b = b1
        oldGlob.options.ap = a1p
        oldGlob.options.bp = b1p

        for (let g of [oldGlob, newGlob]) {
          const [start, end] = g.nodes.map((id) => nodes[id])
          g.points = getGlob(
            start.point,
            start.radius,
            end.point,
            end.radius,
            g.options.D,
            g.options.Dp,
            g.options.a,
            g.options.b,
            g.options.ap,
            g.options.bp
          )
        }

        data.hoveredGlobs = []
        data.hoveredNodes = [newStartNode.id]
      } catch (e) {
        // console.warn("Could not create glob.")
      }
    },

    // HANDLES
    setSelectingHandle(data, payload: { id: string; handle: string }) {
      // const glob = data.globs[payload.id]
      data.selectedGlobs = [payload.id]
      data.selectedHandle = payload
      data.selectedNodes = []
    },
    moveSelectedHandle(data) {
      const {
        camera,
        nodes,
        globs,
        selectedHandle,
        snaps,
        initialGlobs,
        document,
      } = data
      const glob = globs[selectedHandle.id]
      const [start, end] = glob.nodes

      snaps.active = []

      let next = screenToWorld(pointer.point, camera.point, camera.zoom)

      if (keys.Shift) {
        next = getSafeHandlePoint(nodes[start], nodes[end], next)

        if (pointer.axis === "x") {
          next[1] = initialGlobs[glob.id].options[selectedHandle.handle][1]
        } else {
          next[0] = initialGlobs[glob.id].options[selectedHandle.handle][0]
        }

        // Move the other handle, too.
        if (keys.Meta) {
          const otherHandle = selectedHandle.handle === "D" ? "Dp" : "D"
          const otherNext = getSafeHandlePoint(
            nodes[start],
            nodes[end],
            vec.add(
              initialGlobs[glob.id].options[otherHandle],
              vec.sub(
                next,
                initialGlobs[glob.id].options[selectedHandle.handle]
              )
            )
          )

          if (pointer.axis === "x") {
            otherNext[1] = initialGlobs[glob.id].options[otherHandle][1]
          } else {
            otherNext[0] = initialGlobs[glob.id].options[otherHandle][0]
          }

          glob.options[otherHandle] = otherNext
        }

        glob.options[selectedHandle.handle] = next
      } else {
        if (!keys.Alt) {
          const originDelta = vec.div(
            vec.sub(pointer.point, pointer.origin),
            camera.zoom
          )

          for (let id in snaps.globs) {
            if (id === selectedHandle.id) continue

            const pts = snaps.globs[id]
            let snapped = false

            for (let snap of pts) {
              const d = vec.dist(next, snap) * camera.zoom

              if (vec.isEqual(next, snap) && d > 3) {
                // unsnap from point, move to pointer
                next = vec.add(glob.options[selectedHandle.handle], originDelta)
                snapped = true
              } else if (d < 3) {
                // Snap to point
                next = snap
                snapped = true
              }
            }

            if (!snapped) {
              if (globs[id].points === null) continue

              const { E0: a, D: b, E1: c, E0p: ap, Dp: bp, E1p: cp } = globs[
                id
              ].points

              if (
                isInView(a, document) &&
                isInView(b, document) &&
                Math.abs(vec.distanceToLine(a, b, next)) < 3
              ) {
                next = vec.nearestPointOnLine(a, b, next, false)
                snaps.active.push({
                  type: ISnapTypes.Handle,
                  from: next,
                  to: vec.dist(next, a) > vec.dist(next, b) ? a : b,
                })
                snapped = true
              } else if (
                isInView(b, document) &&
                isInView(c, document) &&
                Math.abs(vec.distanceToLine(b, c, next)) < 3
              ) {
                next = vec.nearestPointOnLine(b, c, next, false)
                snaps.active.push({
                  type: ISnapTypes.Handle,
                  from: next,
                  to: vec.dist(next, b) > vec.dist(next, c) ? b : c,
                })
                snapped = true
              } else if (
                isInView(ap, document) &&
                isInView(bp, document) &&
                Math.abs(vec.distanceToLine(ap, bp, next)) < 3
              ) {
                next = vec.nearestPointOnLine(ap, bp, next, false)
                snaps.active.push({
                  type: ISnapTypes.Handle,
                  from: next,
                  to: vec.dist(next, ap) > vec.dist(next, bp) ? ap : bp,
                })
                snapped = true
              } else if (
                isInView(bp, document) &&
                isInView(cp, document) &&
                Math.abs(vec.distanceToLine(bp, cp, next)) < 3
              ) {
                next = vec.nearestPointOnLine(bp, cp, next, false)
                snaps.active.push({
                  type: ISnapTypes.Handle,
                  from: next,
                  to: vec.dist(next, bp) > vec.dist(next, cp) ? bp : cp,
                })
                snapped = true
              }
            }

            if (snapped) break
          }
        }

        next = getSafeHandlePoint(nodes[start], nodes[end], next)

        // Move the other handle, too.
        if (keys.Meta) {
          const otherHandle = selectedHandle.handle === "D" ? "Dp" : "D"
          glob.options[otherHandle] = getSafeHandlePoint(
            nodes[start],
            nodes[end],
            vec.add(
              initialGlobs[glob.id].options[otherHandle],
              vec.sub(
                next,
                initialGlobs[glob.id].options[selectedHandle.handle]
              )
            )
          )
        }

        // Apply the change to the handle
        glob.options[selectedHandle.handle] = vec.round(next)
      }

      try {
        // Rebuild the glob points
        glob.points = getGlob(
          nodes[start].point,
          nodes[start].radius,
          nodes[end].point,
          nodes[end].radius,
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
    clearSelectedHandle(data) {
      data.selectedHandle = undefined
    },

    // ANCHORS
    setSelectingAnchor(data, payload: { id: string; anchor: string }) {
      // const glob = data.globs[payload.id]
      data.selectedGlobs = [payload.id]
      data.selectedAnchor = payload
      data.selectedNodes = []
    },
    moveSelectedAnchor(data) {
      const { camera, nodes, globs, selectedAnchor, snaps } = data
      const glob = globs[selectedAnchor.id]
      const {
        points: { E0, D, E1, E0p, Dp, E1p },
        nodes: [start, end],
      } = glob

      let next = screenToWorld(pointer.point, camera.point, camera.zoom)
      let n: number

      if (selectedAnchor.anchor === "a") {
        next = vec.nearestPointOnLine(E0, D, next)
        n = vec.dist(E0, next) / vec.dist(E0, D)
      } else if (selectedAnchor.anchor === "b") {
        next = vec.nearestPointOnLine(E1, D, next)
        n = vec.dist(E1, next) / vec.dist(E1, D)
      } else if (selectedAnchor.anchor === "ap") {
        next = vec.nearestPointOnLine(E0p, Dp, next)
        n = vec.dist(E0p, next) / vec.dist(E0p, Dp)
      } else if (selectedAnchor.anchor === "bp") {
        next = vec.nearestPointOnLine(E1p, Dp, next)
        n = vec.dist(E1p, next) / vec.dist(E1p, Dp)
      }

      n = Math.round(n * 100) / 100

      // Round to midpoint
      if (!keys.Alt) {
        if (Math.abs(n - 0.5) < 0.025) {
          n = 0.5
        }
      }

      if (keys.Meta) {
        const otherAnchor =
          selectedAnchor.anchor === "a" ? "ap" : "b" ? "bp" : "ap" ? "a" : "b"
        glob.options[otherAnchor] = n
      }

      glob.options[selectedAnchor.anchor] = n

      glob.points = getGlob(
        nodes[start].point,
        nodes[start].radius,
        nodes[end].point,
        nodes[end].radius,
        glob.options.D,
        glob.options.Dp,
        glob.options.a,
        glob.options.b,
        glob.options.ap,
        glob.options.bp
      )
    },
    clearSelectedAnchor(data) {
      data.selectedAnchor = undefined
    },

    // INITIAL POINTS
    setInitialPoints(data) {
      const { nodes, globs, initialPoints } = data

      const nodePts: IData["initialPoints"]["nodes"] = {}

      for (let key in nodes) {
        nodePts[key] = nodes[key].point
      }

      const globPts: IData["initialPoints"]["globs"] = {}

      for (let key in globs) {
        globPts[key] = { D: globs[key].options.D, Dp: globs[key].options.Dp }
      }

      initialPoints.nodes = nodePts
      initialPoints.globs = globPts
    },
    // SNAPS
    setSnapPoints(data) {
      const { nodes, snaps, globs } = data

      const nodePts: IData["snaps"]["nodes"] = {}

      for (let key in nodes) {
        const node = nodes[key]
        nodePts[key] = { point: node.point, radius: node.radius }
      }

      const globPts: IData["snaps"]["globs"] = {}

      for (let key in globs) {
        const {
          options: { D, Dp },
          points,
        } = globs[key]

        globPts[key] = [D, Dp]

        if (points) {
          globPts[key].push(
            projectPoint(
              D,
              vec.angle(D, points.E0),
              vec.dist(D, points.E0) * 2
            ),
            projectPoint(
              Dp,
              vec.angle(Dp, points.E0p),
              vec.dist(Dp, points.E0p) * 2
            ),
            projectPoint(
              D,
              vec.angle(D, points.E1),
              vec.dist(D, points.E1) * 2
            ),
            projectPoint(
              Dp,
              vec.angle(Dp, points.E1p),
              vec.dist(Dp, points.E1p) * 2
            )
          )
        }
      }

      snaps.nodes = nodePts
      snaps.globs = globPts
    },

    // DATA
    saveData(data) {
      if (typeof window === "undefined") return
      if (typeof localStorage === "undefined") return
      localStorage.setItem("glob_aldata_v5", JSON.stringify(data))
    },

    // EVENTS
    setup(data) {
      if (typeof window === "undefined") return
      if (typeof localStorage === "undefined") return
      const saved = localStorage.getItem("glob_aldata_v5")
      if (saved) {
        Object.assign(data, JSON.parse(saved))
      }

      data.selectedNodes = []
      data.selectedGlobs = []
      data.highlightGlobs = []
      data.highlightNodes = []
      data.hoveredNodes = []
      data.hoveredGlobs = []
      data.selectedAnchor = undefined
      data.selectedHandle = undefined
      data.fill = false

      if (typeof window !== "undefined") {
        document.body.addEventListener("pointerleave", handlePointerLeave)
        window.addEventListener("pointermove", handlePointerMove)
        window.addEventListener("pointerdown", handlePointerDown)
        window.addEventListener("pointerup", handlePointerUp)
        window.addEventListener("keydown", handleKeyDown)
        window.addEventListener("keyup", handleKeyUp)
        window.addEventListener("resize", handleResize)
      }
    },
    teardown() {
      if (typeof window !== "undefined") {
        document.body.removeEventListener("pointerleave", handlePointerLeave)
        window.removeEventListener("pointermove", handlePointerMove)
        window.removeEventListener("pointerdown", handlePointerDown)
        window.removeEventListener("pointerup", handlePointerUp)
        window.removeEventListener("keydown", handleKeyDown)
        window.removeEventListener("keyup", handleKeyUp)
        window.removeEventListener("resize", handleResize)
      }
    },
  },
  values: {
    selectionBounds(data) {
      return getSelectedBoundingBox(data)
    },
  },
})

/* -------------------- RESIZERS -------------------- */

let edgeResizer: EdgeResizer | undefined = undefined
let cornerResizer: CornerResizer | undefined = undefined
let cornerRotater: CornerRotater | undefined = undefined

/* --------------------- INPUTS --------------------- */

export const mvPointer = {
  screen: motionValue([0, 0]),
  world: motionValue([0, 0]),
}

const pointer = {
  id: -1,
  type: "mouse",
  point: [0, 0],
  delta: [0, 0],
  origin: [0, 0],
  buttons: 0,
  axis: "any" as "any" | "x" | "y",
  points: new Set<number>(),
}

function updateMvPointer(point: typeof pointer, camera: IData["camera"]) {
  mvPointer.screen.set(pointer.point)
  mvPointer.world.set(screenToWorld(pointer.point, camera.point, camera.zoom))
}

const keys: Record<string, boolean> = {}

/* ------------------ INPUT EVENTS ------------------ */

function handlePointerLeave() {
  for (let id in keys) {
    keys[id] = false
  }
}

const handleResize = throttle(() => {
  if (typeof window !== "undefined") {
    state.send("RESIZED", { size: [window.innerWidth, window.innerHeight] })
  }
}, 16)

function handlePointerDown(e: PointerEvent) {
  pointer.points.add(e.pointerId)

  Object.assign(pointer, {
    id: e.pointerId,
    type: e.pointerType,
    buttons: e.buttons,
    direction: "any",
  })

  const x = e.clientX
  const y = e.clientY

  pointer.origin = [x, y]
  pointer.point = [x, y]
  pointer.delta = [0, 0]

  state.send("STARTED_POINTING")
}

function handlePointerUp(e: PointerEvent) {
  pointer.points.delete(e.pointerId)

  if (e.pointerId !== pointer.id) return
  const x = e.clientX
  const y = e.clientY

  pointer.id = -1
  pointer.buttons = e.buttons
  pointer.delta = vec.sub([x, y], pointer.point)
  pointer.point = [x, y]
  pointer.axis = "any"

  document.body.style.cursor = "default"

  state.send("STOPPED_POINTING")
}

const handlePointerMove = throttle((e: PointerEvent) => {
  if (pointer.id > -1 && e.pointerId !== pointer.id) return
  const x = e.clientX
  const y = e.clientY

  const ox = Math.abs(x - pointer.origin[0])
  const oy = Math.abs(y - pointer.origin[1])

  pointer.axis = ox > oy ? "x" : "y"
  pointer.buttons = e.buttons
  pointer.delta = vec.sub([x, y], pointer.point)
  pointer.point = [x, y]
  state.send("MOVED_POINTER")
}, 16)

// Keyboard commands

const downCommands: Record<string, KeyCommand[]> = {
  z: [
    { eventName: "UNDID", modifiers: ["Meta"] },
    { eventName: "REDID", modifiers: ["Meta", "Shift"] },
  ],
  c: [{ eventName: "COPIED", modifiers: ["Meta"] }],
  v: [{ eventName: "PASTED", modifiers: ["Meta"] }],
  g: [{ eventName: "STARTED_LINKING_NODES", modifiers: [] }],
  l: [{ eventName: "LOCKED_NODES", modifiers: ["Meta"] }],
  n: [{ eventName: "STARTED_CREATING_NODES", modifiers: [] }],
  Option: [{ eventName: "PRESSED_OPTION", modifiers: [] }],
  Shift: [{ eventName: "PRESSED_SHIFT", modifiers: [] }],
  Alt: [{ eventName: "PRESSED_ALT", modifiers: [] }],
  Meta: [{ eventName: "PRESSED_META", modifiers: [] }],
  Escape: [{ eventName: "CANCELLED", modifiers: [] }],
  Enter: [{ eventName: "CONFIRMED", modifiers: [] }],
  Delete: [{ eventName: "DELETED", modifiers: [] }],
  Backspace: [{ eventName: "DELETED", modifiers: [] }],
  " ": [{ eventName: "PRESSED_SPACE", modifiers: [] }],
  "]": [{ eventName: "MOVED_FORWARD", modifiers: ["Meta"] }],
  "[": [{ eventName: "MOVED_BACKWARD", modifiers: ["Meta"] }],
  "‘": [{ eventName: "MOVED_TO_FRONT", modifiers: ["Meta", "Shift"] }],
  "“": [{ eventName: "MOVED_TO_BACK", modifiers: ["Meta", "Shift"] }],
}

const upCommands = {
  " ": [{ eventName: "RELEASED_SPACE", modifiers: [] }],
  Option: [{ eventName: "RELEASED_OPTION", modifiers: [] }],
  Shift: [{ eventName: "RELEASED_SHIFT", modifiers: [] }],
  Alt: [{ eventName: "RELEASED_ALT", modifiers: [] }],
  Meta: [{ eventName: "RELEASED_META", modifiers: [] }],
}

function handleKeyDown(e: KeyboardEvent) {
  keys[e.key] = true
  if (e.key in downCommands) {
    for (let { modifiers, eventName } of downCommands[e.key]) {
      if (modifiers.every((command) => keys[command])) {
        e.preventDefault()
        state.send(eventName)
        break
      }
    }
  }

  state.send("PRESSED_KEY", { key: e.key })
}

function handleKeyUp(e: KeyboardEvent) {
  keys[e.key] = false
  if (e.key in upCommands) {
    for (let { modifiers, eventName } of upCommands[e.key]) {
      if (modifiers.every((command) => keys[command])) {
        e.preventDefault()
        state.send(eventName)
        break
      }
    }
  }

  state.send("RELEASED_KEY", { key: e.key })
}

function screenToWorld(point: number[], offset: number[], zoom: number) {
  return vec.add(vec.div(point, zoom), offset)
}

function worldToScreen(point: number[], offset: number[], zoom: number) {
  return vec.mul(vec.sub(point, offset), zoom)
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

export const useSelector = createSelectorHook(state)
export default state

// state.onUpdate((s) => console.log(s.active, s.log[0]))

function getSafeHandlePoint(start: INode, end: INode, handle: number[]) {
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

function isInView(point: number[], document: IData["document"]) {
  return !(
    point[0] < document.point[0] ||
    point[0] > document.point[0] + document.size[0] ||
    point[1] < document.point[1] ||
    point[1] > document.point[1] + document.size[1]
  )
}
