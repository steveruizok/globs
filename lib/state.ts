import * as Vec from "lib/vec"
import * as svg from "lib/svg"
import { createState, createSelectorHook } from "@state-designer/react"
import { ICanvasItems, INode, IGlob } from "lib/types"
import intersect from "path-intersection"
import {
  arrsIntersect,
  getCircleTangentToPoint,
  getClosestPointOnCircle,
  getGlob,
  getGlobPath,
  getOuterTangents,
  rectContainsRect,
} from "utils"
import { initialData } from "./data"
import { getGlobOutline } from "components/canvas/glob"

/*
- [x] Delete nodes
- [x] Delete globs
- [x] Branch nodes
- [ ] Change radius
*/

const elms: Record<string, SVGSVGElement> = {}

const state = createState({
  data: initialData,
  on: {
    MOUNTED_ELEMENT: (d, p) => (elms[p.id] = p.elm),
    MOUNTED: { do: ["setup", "setViewport"], to: "selecting" },
    UNMOUNTED: ["teardown"],
    RESIZED: "setViewport",
    WHEELED: {
      ifAny: ["hasShift", "isTrackpadZoom"],
      get: "wheelZoomDelta",
      do: "zoomCamera",
      else: "wheelPanCamera",
    },
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
  },
  onEnter: ["setup"],
  states: {
    tool: {
      initial: "selecting",
      states: {
        selecting: {
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
                TOGGLED_CAP: { do: "toggleNodeCap" },
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
                POINTED_HANDLE: {
                  do: "setSelectingHandle",
                  to: "pointingHandle",
                },
                POINTED_CANVAS: [
                  "clearSelection",
                  {
                    if: "hasSpace",
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
              on: {
                WHEELED: "moveSelectedMixed",
                MOVED_POINTER: "moveSelectedMixed",
                STOPPED_POINTING: {
                  to: "notPointing",
                },
              },
            },
            pointingNodes: {
              on: {
                WHEELED: "moveSelectedMixed",
                MOVED_POINTER: "moveSelectedMixed",
                STOPPED_POINTING: {
                  to: "notPointing",
                },
              },
            },
            pointingHandle: {
              on: {
                WHEELED: "moveSelectedHandle",
                MOVED_POINTER: "moveSelectedHandle",
                STOPPED_POINTING: {
                  do: "clearSelectedHandle",
                  to: "notPointing",
                },
              },
            },
            brushSelecting: {
              onEnter: "startBrush",
              onExit: "clearBrush",
              on: {
                MOVED_POINTER: ["updateBrush", "updateBrushSelection"],
                STOPPED_POINTING: { to: "notPointing" },
              },
            },
          },
        },
        cloningNodes: {},
        creatingNodes: {
          on: {
            CANCELLED: { to: "selecting" },
            POINTED_CANVAS: {
              do: ["createNode", "saveData"],
              to: "selecting",
            },
          },
        },
        linkingNodes: {
          on: {
            CANCELLED: { to: "selecting" },
            POINTED_CANVAS: { to: "selecting" },
            SELECTED_NODE: {
              do: ["createGlobBetweenNodes", "saveData"],
              to: "selecting",
            },
          },
        },
        branchingNodes: {
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
    shiftZoomDelta(data) {},
    wheelZoomDelta(data, payload: { ctrlKey: boolean; delta: number[] }) {
      const { camera } = data
      if (payload.ctrlKey) payload.delta = Vec.mul(Vec.neg(payload.delta), 5)

      return { delta: (payload.delta[1] / 500) * camera.zoom }
    },
    hovering(data) {
      return {
        ids: data.nodeIds.reduce<string[]>((acc, id) => {
          const node = data.nodes[id]
          if (Vec.dist(pointer.point, node.point) <= node.radius) {
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
      return data.selected.includes(payload.id)
    },
    hasSelectedNodes(data) {
      return data.selected.length > 0
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
    hasShift() {
      return keys.Shift
    },
    hasSpace() {
      return keys[" "]
    },
    hoveringHasChanged(data, payload, result: { ids: string[] }) {
      return (
        data.hoveredNodes.length !== result.ids.length ||
        data.hoveredNodes.some((id) => !result.ids.includes(id))
      )
    },
  },
  actions: {
    // BRUSH
    startBrush(data) {
      const { nodes, nodeIds, globs, globIds, camera } = data
      data.brush = {
        start: screenToWorld(pointer.point, camera.point, camera.zoom),
        end: screenToWorld(pointer.point, camera.point, camera.zoom),
        targets: [
          ...nodeIds
            .map((id) => nodes[id])
            .map((node) => {
              return {
                id: node.id,
                type: "node" as const,
                path: svg.ellipse(node.point, node.radius),
              }
            }),
          ...globIds
            .map((id) => globs[id])
            .map((glob) => {
              return {
                id: glob.id,
                type: "glob" as const,
                path: getGlobPath(
                  glob,
                  nodes[glob.nodes[0]],
                  nodes[glob.nodes[1]]
                ),
              }
            }),
        ],
      }
    },
    updateBrush(data) {
      const { brush, camera } = data
      brush.end = screenToWorld(pointer.point, camera.point, camera.zoom)
    },
    updateBrushSelection(data) {
      const { nodes, nodeIds, brush } = data
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
      data.selected = []

      for (let target of brush.targets) {
        const elm = elms[target.id]

        if (
          rectContainsRect(x0, y0, x1, y1, elm.getBBox()) ||
          intersect(rect, target.path, true)
        ) {
          if (target.type === "glob") {
            data.selectedGlobs.push(target.id)
          } else if (target.type === "node") {
            data.selected.push(target.id)
          }
        }
      }
    },
    clearBrush(data) {
      data.brush = undefined
    },

    // CAMERA
    updateCamera(data) {},
    panCamera(data) {
      const { camera, document } = data
      camera.point = Vec.sub(camera.point, Vec.div(pointer.delta, camera.zoom))
      document.point = camera.point
    },
    wheelPanCamera(data, payload: { delta: number[] }) {
      const { camera, document } = data
      const delta = Vec.div(Vec.neg(payload.delta), camera.zoom)
      camera.point = Vec.sub(camera.point, delta)
      pointer.delta = Vec.mul(Vec.neg(delta), camera.zoom)
      document.point = camera.point
    },
    zoomCamera(data, payload, result: { delta: number }) {
      const { camera, viewport, document } = data
      const { point } = pointer

      const pt0 = Vec.add(Vec.div(point, camera.zoom), camera.point)

      camera.zoom = Math.max(Math.min(camera.zoom + result.delta, 10), 0.25)

      const pt1 = Vec.add(Vec.div(point, camera.zoom), camera.point)

      camera.point = Vec.sub(camera.point, Vec.sub(pt1, pt0))

      document.size = Vec.div(viewport.size, camera.zoom)
      document.point = camera.point
    },

    // VIEWPORT
    updateViewport(data, payload: { point: number[]; size: number[] }) {
      const { camera, viewport, document } = data
      viewport.point = payload.point
      viewport.size = payload.size
      document.point = [...camera.point]
      document.size = Vec.div(payload.size, camera.zoom)
    },

    // SELECTION
    clearSelection(data) {
      data.selectedHandle = undefined
      data.selected = []
      data.selectedGlobs = []
    },

    // HOVERS / HIGHLIGHTS
    pushHighlightGlob(data, payload: { id: string }) {
      data.highlightGlobs.push(payload.id)
    },
    pullHighlightGlob(data, payload: { id: string }) {
      const index = data.highlightGlobs.indexOf(payload.id)
      data.highlightGlobs.splice(index, 1)
    },
    pushHoveredGlob(data, payload: { id: string }) {
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
      data.highlightNodes.push(payload.id)
    },
    pullHighlightNode(data, payload: { id: string }) {
      const index = data.highlightNodes.indexOf(payload.id)
      data.highlightNodes.splice(index, 1)
    },
    pushHoveredNode(data, payload: { id: string }) {
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
    resizedNode(data, payload: { id: string }) {
      const { nodes, camera } = data
      const node = data.nodes[payload.id]
      const point = screenToWorld(pointer.point, camera.point, camera.zoom)

      node.radius = Vec.dist(node.point, point)
    },
    setSelectedNode(data, payload: { id: string }) {
      data.selectedHandle = undefined
      data.selectedGlobs = []
      data.selected = [payload.id]
    },
    pushSelectedNode(data, payload: { id: string }) {
      data.selected.push(payload.id)
    },
    pullSelectedNode(data, payload: { id: string }) {
      data.selected = data.selected.filter((id) => id !== payload.id)
    },
    toggleNodeCap(data, payload: { id: string }) {
      const node = data.nodes[payload.id]
      node.cap = node.cap === "round" ? "flat" : "round"
    },
    moveSelectedNodes(data) {
      const { camera, globs } = data
      for (let id of data.selected) {
        const node = data.nodes[id]

        const backupPt = [...node.point]

        node.point = Vec.add(node.point, Vec.div(pointer.delta, camera.zoom))

        for (let gid in globs) {
          const glob = globs[gid]
          const [start, end] = glob.nodes

          if (!(start === id || end === id)) continue

          const { point: C0, radius: r0 } = data.nodes[start]
          const { point: C1, radius: r1 } = data.nodes[end]

          const backup = {
            D: [...glob.options.D],
            Dp: [...glob.options.Dp],
          }

          for (let i = 0; i < 2; i++) {
            const h = i === 1 ? "Dp" : "D"
            let handle = glob.options[h]

            if (Vec.dist(handle, C0) < r0 + 5) {
              glob.options[h] = getClosestPointOnCircle(C0, r0, handle, 5)
            }

            if (Vec.dist(handle, C1) < r1 + 5) {
              glob.options[h] = getClosestPointOnCircle(C1, r1, handle, 5)
            }

            try {
              const { D, Dp, a, b, ap, bp } = glob.options
              getGlob(C0, r0, C1, r1, D, Dp, a, b, ap, bp)
            } catch (e) {
              node.point = backupPt
              glob.options.D = backup.D
              glob.options.Dp = backup.Dp
            }
          }
        }
      }
    },
    clearSelectedNodes(data) {
      data.selected = []
    },
    deleteSelectedNodes(data) {
      const { globIds, globs, nodeIds, nodes, selected } = data
      data.nodeIds = nodeIds.filter((id) => !selected.includes(id))

      // pull(data.nodeIds, ...data.selected)
      for (let id of selected) {
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
      const { selected, nodes, globs, globIds, camera } = data

      const minRadius = selected.reduce(
        (a, c) => (nodes[c].radius < a ? nodes[c].radius : a),
        nodes[selected[0]].radius
      )

      const newNode = createNode(
        screenToWorld(pointer.point, camera.point, camera.zoom)
      )

      const id = "node_" + Date.now()

      data.nodeIds.push(newNode.id)
      data.nodes[newNode.id] = newNode

      for (let nodeId of selected) {
        const glob = createGlob(nodes[nodeId], nodes[id])
        globIds.push(glob.id)
        data.globs[glob.id] = glob
      }
    },

    // GLOBS
    setSelectedGlob(data, payload: { id: string }) {
      data.selectedGlobs = [payload.id]
      data.selectedHandle = undefined
      data.selected = []
    },
    pushSelectedGlob(data, payload: { id: string }) {
      data.selectedGlobs.push(payload.id)
      data.selectedHandle = undefined
      data.selected = []
    },
    pullSelectedGlob(data, payload: { id: string }) {
      data.selectedGlobs = data.selectedGlobs.filter((id) => id !== payload.id)
    },
    moveSelectedMixed(data) {
      const { selectedGlobs, selected, globs, nodes, nodeIds, camera } = data
      const delta = Vec.div(pointer.delta, camera.zoom)
      const nodesToMove: string[] = [...selected]

      for (let globId of selectedGlobs) {
        const glob = globs[globId]
        for (let nodeId of glob.nodes) {
          if (nodesToMove.includes(nodeId)) {
            continue
          }
          nodesToMove.push(nodeId)
        }

        glob.options.D = Vec.add(glob.options.D, delta)
        glob.options.Dp = Vec.add(glob.options.Dp, delta)
      }

      for (let id of nodesToMove) {
        nodes[id].point = Vec.add(nodes[id].point, delta)
      }
    },
    moveSelectedGlobs(data, payload: { id: string }) {
      const { globs, nodes, camera } = data
      const delta = Vec.div(pointer.delta, camera.zoom)

      const selectedGlobs = data.selectedGlobs.map((id) => data.globs[id])

      let visited: string[] = []

      const adjacentGlobs = Object.keys(globs)
        .filter((id) => !data.selectedGlobs.includes(id))
        .map((id) => data.globs[id])
        .filter((og) =>
          selectedGlobs.some((g) => arrsIntersect(og.nodes, g.nodes))
        )

      for (let globId of data.selectedGlobs) {
        if (visited.includes(globId)) continue
        visited.push(globId)

        const glob = globs[globId]

        glob.options.D = Vec.add(glob.options.D, delta)
        glob.options.Dp = Vec.add(glob.options.Dp, delta)

        for (let nodeId of glob.nodes) {
          if (visited.includes(nodeId)) continue
          visited.push(nodeId)

          const node = nodes[nodeId]
          node.point = Vec.add(node.point, delta)

          for (let otherGlob of adjacentGlobs) {
            const [start, end] = otherGlob.nodes
            const { point: C0, radius: r0 } = nodes[start]
            const { point: C1, radius: r1 } = nodes[end]

            for (let i = 0; i < 2; i++) {
              let handle = otherGlob.options[i === 1 ? "Dp" : "D"]

              if (Vec.dist(handle, C0) < r0 + 5) {
                otherGlob.options[
                  i === 1 ? "Dp" : "D"
                ] = getClosestPointOnCircle(C0, r0, handle, 5)
              }

              if (Vec.dist(handle, C1) < r1 + 5) {
                otherGlob.options[
                  i === 1 ? "Dp" : "D"
                ] = getClosestPointOnCircle(C1, r1, handle, 5)
              }
            }
          }
        }
      }
    },
    createGlobBetweenNodes(data, payload: { id: string }) {
      const { selected, globs, globIds, nodes } = data
      const globsArr = Object.values(data.globs)

      for (let id of selected) {
        // for (let id1 of selected) {
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

    // HANDLES
    setSelectingHandle(data, payload: { id: string; handle: string }) {
      // const glob = data.globs[payload.id]
      data.selectedGlobs = [payload.id]
      data.selectedHandle = payload
      data.selected = []
    },
    moveSelectedHandle(data) {
      const { camera, nodes, globs, selectedHandle } = data
      const glob = globs[selectedHandle.id]
      const handle = glob.options[selectedHandle.handle]
      const backup = [...handle]

      let next = screenToWorld(pointer.point, camera.point, camera.zoom) //Vec.add(handle, Vec.div(pointer.delta, camera.zoom))

      const [start, end] = glob.nodes
      const { point: C0, radius: r0 } = nodes[start]
      const { point: C1, radius: r1 } = nodes[end]

      if (Vec.dist(next, C0) < r0) {
        next = getClosestPointOnCircle(C0, r0, next)
      }

      if (Vec.dist(next, C1) < r1) {
        next = getClosestPointOnCircle(C1, r1, next)
      }

      glob.options[selectedHandle.handle] = next

      try {
        const { D, Dp, a, b, ap, bp } = glob.options
        getGlob(C0, r0, C1, r1, D, Dp, a, b, ap, bp)
      } catch (e) {
        glob.options[selectedHandle.handle] = backup
      }
    },
    clearSelectedHandle(data) {
      data.selectedHandle = undefined
    },

    // DATA
    saveData(data) {
      if (typeof window === "undefined") return
      if (typeof localStorage === "undefined") return
      localStorage.setItem("glob_aldata_v1", JSON.stringify(data))
    },
    // Setup and Mounting
    setup(data) {
      if (typeof window === "undefined") return
      if (typeof localStorage === "undefined") return
      const saved = localStorage.getItem("glob_aldata_v1")
      if (saved) {
        // Object.assign(data, JSON.parse(saved))
      }

      data.selected = []
      data.selectedGlobs = []
      data.highlightGlobs = []
      data.highlightNodes = []
      data.hoveredNodes = []
      data.hoveredGlobs = []

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
      document.size = Vec.div(viewport.size, camera.zoom)
    },
  },
})

/* --------------------- INPUTS --------------------- */

const pointer = {
  id: -1,
  type: "mouse",
  point: [0, 0],
  delta: [0, 0],
  origin: [0, 0],
  buttons: 0,
  points: new Set<number>(),
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
  pointer.delta = Vec.sub([x, y], pointer.point)
  pointer.point = [x, y]
  state.send("STOPPED_POINTING")
}

function handlePointerMove(e: PointerEvent) {
  if (pointer.id > -1 && e.pointerId !== pointer.id) return
  const x = e.clientX
  const y = e.clientY

  pointer.buttons = e.buttons
  pointer.delta = Vec.sub([x, y], pointer.point)
  pointer.point = [x, y]
  state.send("MOVED_POINTER")
}

const commands = {
  Escape: "CANCELLED",
  Enter: "CONFIRMED",
  Delete: "DELETED",
  Backspace: "DELETED",
}

function handleKeyDown(e: KeyboardEvent) {
  keys[e.key] = true
  state.send("PRESSED_KEY")
  if (e.key in commands) {
    state.send(commands[e.key])
  }
}

function handleKeyUp(e: KeyboardEvent) {
  keys[e.key] = false
  state.send("RELEASED_KEY")
}

export const useSelector = createSelectorHook(state)
export default state

function screenToWorld(point: number[], offset: number[], zoom: number) {
  return Vec.add(Vec.div(point, zoom), offset)
}

function worldToScreen(point: number[], offset: number[], zoom: number) {
  return Vec.mul(Vec.sub(point, offset), zoom)
}

// state.onUpdate((s) => console.log(s.active, s.log[0]))

function createGlob(A: INode, B: INode): IGlob {
  const { point: C0, radius: r0 } = A
  const { point: C1, radius: r1 } = B

  const [E0, E1, E0p, E1p] = getOuterTangents(C0, r0, C1, r1)

  return {
    id: "glob_" + Date.now(),
    name: "Glob",
    nodes: [A.id, B.id],
    options: {
      D: Vec.med(E0, E1),
      Dp: Vec.med(E0p, E1p),
      a: 0.5,
      b: 0.5,
      ap: 0.5,
      bp: 0.5,
    },
    zIndex: 1,
  }
}

function createNode(point: number[]): INode {
  const id = "node_" + Date.now()

  return {
    id,
    name: "Node",
    point,
    type: ICanvasItems.Node,
    radius: 25,
    cap: "round",
    zIndex: 1,
  }
}
