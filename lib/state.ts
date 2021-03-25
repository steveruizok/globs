import * as vec from "lib/vec"
import * as svg from "lib/svg"
import { createState, createSelectorHook } from "@state-designer/react"
import { ICanvasItems, INode, IGlob, IData } from "lib/types"
import intersect from "path-intersection"
import {
  arrsIntersect,
  clamp,
  getCircleTangentToPoint,
  getClosestPointOnCircle,
  getGlob,
  getGlobPath,
  getNearestPointOnCurve,
  getOuterTangents,
  getTouchDisplay,
  projectPoint,
  rectContainsRect,
  round,
  throttle,
} from "utils"
import { initialData } from "./data"
import { getGlobOutline } from "components/canvas/glob/glob"
import { motionValue } from "framer-motion"

/*
- [ ] Keep camera centered when resizing
- [ ] Zoom to content
- [ ] Lock mirrored adjacent handles
- [ ] Lock handle position relative to some other position?
- [ ] Lock node position relative to some other position?
- [ ] Display midline
- [ ] Copy to clipboard
- [ ] Select two nodes and glob them
- [ ] Keyboard shortcuts for toolbar
- [ ] Copy and paste
*/

const elms: Record<string, SVGPathElement> = {}

const state = createState({
  data: initialData,
  onEnter: ["setup"],
  on: {
    MOUNTED_ELEMENT: { secretlyDo: "mountElement" },
    UNMOUNTED_ELEMENT: { secretlyDo: "deleteElement" },
    MOUNTED: { do: ["setup", "setViewport"], to: "selecting" },
    UNMOUNTED: ["teardown"],
    RESIZED: "setViewport",
    STARTED_CREATING_NODES: {
      to: "creatingNodes",
    },
    STARTED_BRANCHING_NODES: {
      if: "hasSelectedNodes",
      to: "branchingNodes",
    },
    STARTED_LINKING_NODES: {
      if: "hasSelectedNodes",
      to: "linkingNodes",
    },
    SET_NODES_X: ["setSelectedNodesPointX", "updateNodeGlobPoints"],
    SET_NODES_Y: ["setSelectedNodesPointY", "updateNodeGlobPoints"],
    SET_NODES_RADIUS: ["setSelectedNodesRadius", "updateNodeGlobPoints"],
    SET_NODES_CAP: ["setSelectedNodesCap", "updateNodeGlobPoints"],
    SET_NODES_LOCKED: "setSelectedNodesLocked",
    SET_GLOB_OPTIONS: ["setSelectedGlobOptions", "updateSelectedGlobsPoints"],
    ENABLED_FILL: "enableFill",
    DISABLED_FILL: "disableFill",
    TOGGLED_NODE_LOCKED: "toggleNodeLocked",
    WHEELED: {
      ifAny: ["hasShift", "isTrackpadZoom"],
      get: "wheelZoomDelta",
      do: ["zoomCamera", "updateMvPointer"],
      else: {
        do: ["wheelPanCamera", "updateMvPointer"],
      },
    },
    MOVED_POINTER: { secretlyDo: "updateMvPointer" },
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
                SELECTED_NODE: [
                  {
                    if: "nodeIsSelected",
                    then: {
                      if: "hasShift",
                      do: "pullSelectedNode",
                    },
                    else: {
                      if: "hasShift",
                      do: "pushSelectedNode",
                      else: "setSelectedNode",
                    },
                  },
                  { if: "nodeIsHovered", to: "pointingNodes" },
                ],
                SPLIT_GLOB: "splitGlobAtPoint",
                SELECTED_GLOB: [
                  {
                    if: "globIsSelected",
                    then: {
                      if: "hasShift",
                      do: "pullSelectedGlob",
                    },
                    else: {
                      if: "hasShift",
                      do: "pushSelectedGlob",
                      else: "setSelectedGlob",
                    },
                  },
                  { if: "globIsHovered", to: "pointingGlobs" },
                ],
                SELECTED_ANCHOR: {
                  do: "setSelectingAnchor",
                  to: "pointingAnchor",
                },
                POINTED_HANDLE: {
                  do: "setSelectingHandle",
                  to: "pointingHandle",
                },
                POINTED_CANVAS: [
                  "clearSelection",
                  {
                    wait: 0.01,
                    ifAny: ["hasSpace", "isMultitouch"],
                    to: "canvasPanning",
                    else: {
                      to: "brushSelecting",
                    },
                  },
                ],
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
            pointingGlobs: {
              onExit: "saveData",
              onEnter: ["setInitialPoints", "setSnapPoints"],
              on: {
                CANCELLED: { do: "returnSelected", to: "notPointing" },
                WHEELED: ["moveSelected", "updateSelectedGlobsPoints"],
                MOVED_POINTER: ["moveSelected", "updateSelectedGlobsPoints"],
                STOPPED_POINTING: {
                  to: "notPointing",
                },
              },
            },
            pointingNodes: {
              onExit: "saveData",
              onEnter: ["setInitialPoints", "setSnapPoints"],
              on: {
                CANCELLED: { do: "returnSelected", to: "notPointing" },
                WHEELED: ["moveSelected", "updateSelectedGlobsPoints"],
                MOVED_POINTER: {
                  if: "hasMeta",
                  do: ["resizeNode", "updateSelectedGlobsPoints"],
                  else: ["moveSelected", "updateSelectedGlobsPoints"],
                },
                STOPPED_POINTING: {
                  to: "notPointing",
                },
              },
            },
            pointingHandle: {
              onExit: "saveData",
              onEnter: ["setSnapPoints"],
              on: {
                WHEELED: "moveSelectedHandle",
                MOVED_POINTER: "moveSelectedHandle",
                STOPPED_POINTING: {
                  do: ["clearSelectedHandle"],
                  to: "notPointing",
                },
              },
            },
            pointingAnchor: {
              onExit: "saveData",
              on: {
                WHEELED: "moveSelectedAnchor",
                MOVED_POINTER: "moveSelectedAnchor",
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
              },
            },
          },
        },
        cloningNodes: {
          onExit: "saveData",
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
            POINTED_CANVAS: { to: "selecting" },
            SELECTED_NODE: {
              do: "createGlobBetweenNodes",
              to: "selecting",
            },
          },
        },
        branchingNodes: {
          onExit: "saveData",
          on: {
            CANCELLED: { to: "selecting" },
            POINTED_CANVAS: {
              do: ["createNodeAndGlob", "saveData"],
              to: "selecting",
            },
            SELECTED_NODE: {
              to: "selecting",
            },
          },
        },
      },
    },
  },
  results: {
    wheelZoomDelta(data, payload: { ctrlKey: boolean; delta: number[] }) {
      const { camera } = data
      if (payload.ctrlKey) payload.delta = vec.mul(vec.neg(payload.delta), 5)

      return { delta: (payload.delta[1] / 500) * camera.zoom }
    },
    hovering(data) {
      return {
        ids: data.nodeIds.reduce<string[]>((acc, id) => {
          const node = data.nodes[id]
          if (vec.dist(pointer.point, node.point) <= node.radius) {
            acc.push(node.id)
          }
          return acc
        }, []),
      }
    },
  },
  conditions: {
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
    isPinch() {
      return pointer.points.size > 1
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
    hoveringHasChanged(data, payload, result: { ids: string[] }) {
      return (
        data.hoveredNodes.length !== result.ids.length ||
        data.hoveredNodes.some((id) => !result.ids.includes(id))
      )
    },
  },
  actions: {
    // ELEMENT REFERENCES
    mountElement(data, payload: { id: string; elm: SVGPathElement }) {
      elms[payload.id] = payload.elm
    },
    deleteElement(data, payload: { id: string; elm: SVGPathElement }) {
      elms[payload.id] = payload.elm
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
      const { brush } = data
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
        const elm = elms[target.id]

        if (
          rectContainsRect(x0, y0, x1, y1, elm.getBBox()) ||
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
    zoomCamera(data, payload, result: { delta: number }) {
      const { camera, viewport, document } = data
      const { point } = pointer

      const pt0 = vec.add(vec.div(point, camera.zoom), camera.point)

      camera.zoom = Math.max(Math.min(camera.zoom + result.delta, 10), 0.25)
      camera.zoom = Math.round(camera.zoom * 100) / 100

      const pt1 = vec.add(vec.div(point, camera.zoom), camera.point)

      camera.point = vec.round(vec.sub(camera.point, vec.sub(pt1, pt0)))

      document.size = vec.round(vec.div(viewport.size, camera.zoom))
      document.point = camera.point
    },

    // VIEWPORT
    updateViewport(data, payload: { point: number[]; size: number[] }) {
      const { camera, viewport, document } = data
      viewport.point = payload.point
      viewport.size = payload.size
      document.point = [...camera.point]
      document.size = vec.div(payload.size, camera.zoom)
    },

    // SELECTION
    clearSelection(data) {
      data.selectedHandle = undefined
      data.selectedNodes = []
      data.selectedGlobs = []
      data.hoveredNodes = []
      data.hoveredGlobs = []
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
      data.hoveredNodes = [payload.id]
    },
    setHoveredNodes(data, payload, result: { ids: string[] }) {
      data.hoveredNodes = result.ids
    },

    // NODES
    createNode(data) {
      const { nodes, nodeIds, camera } = data
      const point = screenToWorld(pointer.point, camera.point, camera.zoom)
      const node = createNode(point)
      nodeIds.push(node.id)
      nodes[node.id] = node
    },
    resizeNode(data) {
      const { nodes, hoveredNodes, camera, selectedNodes } = data
      if (selectedNodes[0] !== hoveredNodes[0]) return
      const node = nodes[selectedNodes[0]]
      const point = screenToWorld(pointer.point, camera.point, camera.zoom)
      node.radius = round(vec.dist(point, node.point))

      // const delta = screenToWorld(pointer.delta, camera.point, camera.zoom)
      // node.radius = Math.round(
      //   node.radius +
      //     (vec.dist(point, node.point) > node.radius
      //       ? vec.len(delta)
      //       : -vec.len(delta))
      // )

      // node.radius = vec.dist(node.point, point)
    },
    setSelectedNode(data, payload: { id: string }) {
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
    clearSelectedNodes(data) {
      data.selectedNodes = []
    },
    deleteSelectedNodes(data) {
      const { globIds, globs, nodeIds, nodes, selectedNodes } = data
      data.nodeIds = nodeIds.filter((id) => !selectedNodes.includes(id))

      // pull(data.nodeIds, ...data.selectedNodes)
      for (let id of selectedNodes) {
        // pull(nodeIds, id)
        delete nodes[id]

        for (let gid of globIds) {
          if (globs[gid].nodes.includes(id)) {
            data.globIds = data.globIds.filter((g) => g !== gid)
            delete globs[gid]
          }
        }
      }
    },

    // BRANCHING NODES
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

      data.selectedNodes = [newNode.id]
    },

    // GLOBS
    setSelectedGlob(data, payload: { id: string }) {
      data.selectedGlobs = [payload.id]
      data.selectedHandle = undefined
      data.selectedAnchor = undefined
      data.selectedNodes = []
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
    moveSelected(data) {
      const { selectedGlobs, selectedNodes, globs, nodes, snaps, camera } = data
      const delta = vec.div(pointer.delta, camera.zoom)
      const nodesToMove: string[] = [...selectedNodes]
      const originDelta = vec.div(
        vec.sub(pointer.point, pointer.origin),
        camera.zoom
      )

      for (let globId of selectedGlobs) {
        const glob = globs[globId]
        for (let nodeId of glob.nodes) {
          if (nodesToMove.includes(nodeId)) {
            continue
          }
          nodesToMove.push(nodeId)
        }

        glob.options.D = vec.add(glob.options.D, delta)
        glob.options.Dp = vec.add(glob.options.Dp, delta)
      }

      for (let id of nodesToMove) {
        const node = nodes[id]
        if (node.locked) continue

        let next = vec.round(vec.add(nodes[id].point, delta), 2)
        if (!keys.Alt) {
          for (let snapId in snaps.nodes) {
            if (snapId === id) continue
            const snap = snaps.nodes[snapId]
            const d = vec.dist(next, snap) * camera.zoom

            if (vec.isEqual(node.point, snap) && d > 3) {
              // unsnap from point, move to pointer
              next = vec.add(data.initialPoints.nodes[node.id], originDelta)
            } else if (d < 3) {
              // Snap to point
              next = snap
            }
          }
        }

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

        node.point = next
      }

      // Now update the globs!
    },
    splitGlobAtPoint(data) {
      // TODO
    },
    setSelectedGlobOptions(data, payload: Partial<IGlob["options"]>) {
      const { globs, selectedGlobs } = data
      for (let id of selectedGlobs) {
        const glob = globs[id]
        Object.assign(glob.options, payload)
      }
    },
    updateNodeGlobPoints(data) {
      const { globs, nodes, selectedNodes, selectedGlobs } = data
      Object.values(globs)
        .filter((glob) => arrsIntersect(glob.nodes, selectedNodes))
        .forEach((glob) => {
          try {
            const [start, end] = glob.nodes.map((id) => nodes[id])
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
    updateSelectedGlobsPoints(data) {
      const { globs, nodes, selectedNodes, selectedGlobs } = data

      // Update glob points
      for (let id in globs) {
        const glob = globs[id]
        if (
          selectedGlobs.includes(id) ||
          arrsIntersect(selectedNodes, glob.nodes)
        ) {
          try {
            const [start, end] = glob.nodes.map((id) => nodes[id])
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
        }
      }
    },
    createGlobBetweenNodes(data, payload: { id: string }) {
      const { selectedNodes, globs, globIds, nodes } = data
      const globsArr = Object.values(data.globs)

      for (let id of selectedNodes) {
        if (payload.id === id) continue

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

    // HANDLES
    setSelectingHandle(data, payload: { id: string; handle: string }) {
      // const glob = data.globs[payload.id]
      data.selectedGlobs = [payload.id]
      data.selectedHandle = payload
      data.selectedNodes = []
    },
    moveSelectedHandle(data) {
      const { camera, nodes, globs, selectedHandle, snaps } = data
      const glob = globs[selectedHandle.id]
      const [start, end] = glob.nodes

      let next = getSafeHandlePoint(
        nodes[start],
        nodes[end],
        screenToWorld(pointer.point, camera.point, camera.zoom)
      )

      if (!keys.Alt) {
        const originDelta = vec.div(
          vec.sub(pointer.point, pointer.origin),
          camera.zoom
        )

        for (let id in snaps.globs) {
          if (id === selectedHandle.id) continue

          const pts = snaps.globs[id]

          const { E0: a, D: b, E1: c, E0p: ap, Dp: bp, E1p: cp } = globs[
            id
          ].points

          if (Math.abs(vec.distanceToLine(a, b, next)) < 3) {
            next = vec.nearestPointOnLine(a, b, next, false)
          } else if (Math.abs(vec.distanceToLine(b, c, next)) < 3) {
            next = vec.nearestPointOnLine(b, c, next, false)
          } else if (Math.abs(vec.distanceToLine(ap, bp, next)) < 3) {
            next = vec.nearestPointOnLine(ap, bp, next, false)
          } else if (Math.abs(vec.distanceToLine(bp, cp, next)) < 3) {
            next = vec.nearestPointOnLine(bp, cp, next, false)
          }
          for (let snap of pts) {
            const d = vec.dist(next, snap) * camera.zoom

            if (vec.isEqual(next, snap) && d > 3) {
              // unsnap from point, move to pointer
              next = vec.add(glob.options[selectedHandle.handle], originDelta)
            } else if (d < 3) {
              // Snap to point
              next = snap
            }
          }
        }
      }

      // Move the other handle, too.
      if (keys.Meta) {
        const otherHandle = selectedHandle.handle === "D" ? "Dp" : "D"
        glob.options[otherHandle] = getSafeHandlePoint(
          nodes[start],
          nodes[end],
          vec.add(
            glob.options[otherHandle],
            vec.sub(next, glob.options[selectedHandle.handle])
          )
        )
      }

      // Apply the change to the handle
      glob.options[selectedHandle.handle] = vec.round(next)

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
        nodePts[key] = nodes[key].point
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
      localStorage.setItem("glob_aldata_v3", JSON.stringify(data))
    },
    // Setup and Mounting
    setup(data) {
      if (typeof window === "undefined") return
      if (typeof localStorage === "undefined") return
      const saved = localStorage.getItem("glob_aldata_v3")
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
        window.addEventListener("pointermove", handlePointerMove)
        window.addEventListener("pointerdown", handlePointerDown)
        window.addEventListener("pointerup", handlePointerUp)
        window.addEventListener("keydown", handleKeyDown)
        window.addEventListener("keyup", handleKeyUp)
        window.addEventListener("resize", handleResize)
      }
    },
    teardown(data) {
      if (typeof window !== "undefined") {
        window.removeEventListener("pointermove", handlePointerMove)
        window.removeEventListener("pointerdown", handlePointerDown)
        window.removeEventListener("pointerup", handlePointerUp)
        window.removeEventListener("keydown", handleKeyDown)
        window.removeEventListener("keyup", handleKeyUp)
        window.removeEventListener("resize", handleResize)
      }
    },
    setViewport(data, payload: { size: number[] }) {
      const { viewport, camera, document } = data
      viewport.size = payload.size
      document.point = [...camera.point]
      document.size = vec.round(vec.div(viewport.size, camera.zoom))
    },
  },
})

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
  points: new Set<number>(),
}

function updateMvPointer(point: typeof pointer, camera: IData["camera"]) {
  mvPointer.screen.set(pointer.point)
  mvPointer.world.set(screenToWorld(pointer.point, camera.point, camera.zoom))
}

const keys: Record<string, boolean> = {}

/* ------------------ INPUT EVENTS ------------------ */

function handleResize() {
  if (typeof window !== "undefined") {
    state.send("RESIZED", { size: [window.innerWidth, window.innerHeight] })
  }
}

function handlePointerDown(e: PointerEvent) {
  pointer.points.add(e.pointerId)

  Object.assign(pointer, {
    id: e.pointerId,
    type: e.pointerType,
    buttons: e.buttons,
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
  state.send("STOPPED_POINTING")
}

const handlePointerMove = throttle((e: PointerEvent) => {
  if (pointer.id > -1 && e.pointerId !== pointer.id) return
  const x = e.clientX
  const y = e.clientY

  pointer.buttons = e.buttons
  pointer.delta = vec.sub([x, y], pointer.point)
  pointer.point = [x, y]
  state.send("MOVED_POINTER")
}, 16)

const downCommands = {
  Escape: "CANCELLED",
  Enter: "CONFIRMED",
  Delete: "DELETED",
  Backspace: "DELETED",
  " ": "ENABLED_FILL",
  l: "LOCKED_NODES",
}

const upCommands = {
  " ": "DISABLED_FILL",
}

function handleKeyDown(e: KeyboardEvent) {
  if (keys[e.key]) return
  keys[e.key] = true
  state.send("PRESSED_KEY")
  if (e.key in downCommands) {
    state.send(downCommands[e.key])
  }
}

function handleKeyUp(e: KeyboardEvent) {
  keys[e.key] = false
  state.send("RELEASED_KEY")
  if (e.key in upCommands) {
    state.send(upCommands[e.key])
  }
}

function screenToWorld(point: number[], offset: number[], zoom: number) {
  return vec.add(vec.div(point, zoom), offset)
}

function worldToScreen(point: number[], offset: number[], zoom: number) {
  return vec.mul(vec.sub(point, offset), zoom)
}

function createGlob(A: INode, B: INode): IGlob {
  const { point: C0, radius: r0 } = A
  const { point: C1, radius: r1 } = B

  const [E0, E1, E0p, E1p] = getOuterTangents(C0, r0, C1, r1)

  const D = vec.med(E0, E1),
    Dp = vec.med(E0p, E1p),
    a = 0.5,
    b = 0.5,
    ap = 0.5,
    bp = 0.5

  const id = "node_" + Math.random() * Date.now()

  return {
    id,
    name: "Glob",
    nodes: [A.id, B.id],
    options: { D, Dp, a, b, ap, bp },
    points: getGlob(C0, r0, C1, r1, D, Dp, a, b, ap, bp),
    zIndex: 1,
  }
}

function createNode(point: number[]): INode {
  const id = "node_" + Math.random() * Date.now()

  return {
    id,
    name: "Node",
    point,
    type: ICanvasItems.Node,
    radius: 25,
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
