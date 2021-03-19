import * as Vec from "lib/vec"
import * as svg from "lib/svg"
import { createState, createSelectorHook } from "@state-designer/react"
import { ICanvasItems, INode, IGlob } from "lib/types"
import intersect from "path-intersection"
import { getClosestPointOnCircle, getGlob, getGlobPath } from "utils"

interface IData {
  viewport: {
    point: number[]
    size: number[]
    scroll: number[]
  }
  document: {
    point: number[]
    size: number[]
  }
  camera: {
    zoom: number
    point: number[]
  }
  brush: {
    start: number[]
    end: number[]
    targets: { id: string; type: "glob" | "handle" | "node"; path: string }[]
  }
  nodeIds: string[]
  nodes: Record<string, INode>
  globIds: string[]
  globs: Record<string, IGlob>
  selectedHandle: { id: string; handle: string } | undefined
  selectedGlobs: string[]
  hovering: string[]
  selected: string[]
  cloning: string[]
}

const initialData: IData = {
  viewport: {
    point: [0, 0],
    size: [0, 0],
    scroll: [0, 0],
  },
  document: {
    point: [0, 0],
    size: [0, 0],
  },
  camera: {
    point: [0, 0],
    zoom: 1,
  },
  brush: undefined,
  nodes: {
    0: {
      id: "0",
      type: ICanvasItems.Node,
      point: [100, 100],
      radius: 50,
      zIndex: 0,
      cap: "round",
    },
    1: {
      id: "1",
      type: ICanvasItems.Node,
      point: [400, 300],
      radius: 25,
      zIndex: 1,
      cap: "round",
    },
    2: {
      id: "2",
      type: ICanvasItems.Node,
      point: [200, 350],
      radius: 10,
      zIndex: 1,
      cap: "round",
    },
    3: {
      id: "3",
      type: ICanvasItems.Node,
      point: [100, 350],
      radius: 20,
      zIndex: 1,
      cap: "round",
    },
  },
  globs: {
    g0: {
      id: "g0",
      start: "0",
      end: "1",
      options: {
        D: [400, 150],
        Dp: [300, 150],
        a: 0.5,
        ap: 0.5,
        b: 0.5,
        bp: 0.5,
      },
      zIndex: 2,
    },
    g1: {
      id: "g1",
      start: "1",
      end: "2",
      options: {
        D: [450, 450],
        Dp: [420, 400],
        a: 0.5,
        ap: 0.5,
        b: 0.5,
        bp: 0.5,
      },
      zIndex: 2,
    },
    g2: {
      id: "g2",
      start: "2",
      end: "3",
      options: {
        D: [250, 550],
        Dp: [220, 500],
        a: 0.5,
        ap: 0.5,
        b: 0.5,
        bp: 0.5,
      },
      zIndex: 3,
    },
  },
  selectedHandle: undefined,
  nodeIds: ["0", "1", "2"],
  globIds: ["g0", "g1", "g2"],
  hovering: [],
  selected: [],
  selectedGlobs: [],
  cloning: [],
}

const state = createState({
  data: initialData,
  on: {
    MOUNTED: { do: ["setup", "setViewport"], to: "selecting" },
    UNMOUNTED: ["teardown"],
    CHANGED_ZOOM: ["zoomCamera"],
    RESIZED: "setViewport",
    WHEELED: {
      ifAny: ["hasShift", "isTrackpadZoom"],
      do: "wheelZoomCamera",
      else: {
        do: "wheelPanCamera",
      },
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
                TOGGLED_CAP: { do: "toggleNodeCap" },
                MOVED_POINTER: {
                  get: "hovering",
                  if: "hoveringHasChanged",
                  do: "setHoveringNodes",
                },
                POINTED_NODE: {
                  do: "setSelectingNodes",
                  to: "pointingNodes",
                },
                POINTED_GLOB: [
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
                  { to: "pointingGlobs" },
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
                QUICK_ZOOMED: {
                  do: "zoomCamera",
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
            pointingGlobs: {
              on: {
                WHEELED: "moveSelectedGlobs",
                MOVED_POINTER: "moveSelectedGlobs",
                STOPPED_POINTING: {
                  // do: "clearSelectedNodes",
                  to: "notPointing",
                },
              },
            },
            pointingNodes: {
              on: {
                WHEELED: "moveSelectedNodes",
                MOVED_POINTER: "moveSelectedNodes",
                STOPPED_POINTING: {
                  // do: "clearSelectedNodes",
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
        creatingNode: {},
        linkingNode: {},
      },
    },
  },
  results: {
    hovering(data) {
      return Object.values(data.nodes).reduce<string[]>((acc, node) => {
        if (Vec.dist(pointer.point, node.point) <= node.radius) {
          acc.push(node.id)
        }
        return acc
      }, [])
    },
  },
  conditions: {
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
    hoveringHasChanged(data, payload, result: string[]) {
      return (
        data.hovering.length !== result.length ||
        data.hovering.some((id) => !result.includes(id))
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
          ...globIds
            .map((id) => globs[id])
            .map((glob) => ({
              id: glob.id,
              type: "glob" as const,
              path: getGlobPath(glob, nodes[glob.start], nodes[glob.end]),
            })),
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
      for (let target of brush.targets) {
        if (intersect(rect, target.path, true)) {
          data.selectedGlobs.push(target.id)
        }
      }
    },
    clearBrush(data) {
      data.brush = undefined
    },
    // CAMERA
    updateCamera(data) {},
    wheelPanCamera(data, payload: { delta: number[] }) {
      const { camera, document } = data
      camera.point = Vec.sub(
        camera.point,
        Vec.div(Vec.neg(payload.delta), camera.zoom)
      )
      document.point = camera.point
    },
    wheelZoomCamera(data, payload: { ctrlKey: boolean; delta: number[] }) {
      const { camera, viewport, document } = data
      const { point } = pointer

      if (payload.ctrlKey) payload.delta = Vec.mul(Vec.neg(payload.delta), 5)

      const pt0 = Vec.add(Vec.div(point, camera.zoom), camera.point)

      camera.zoom += payload.delta[1] / 500
      camera.zoom = Math.max(Math.min(camera.zoom, 10), 0.25)

      const pt1 = Vec.add(Vec.div(point, camera.zoom), camera.point)

      camera.point = Vec.sub(camera.point, Vec.sub(pt1, pt0))

      document.size = Vec.div(viewport.size, camera.zoom)
      document.point = camera.point
    },
    panCamera(data) {
      const { camera, document } = data
      camera.point = Vec.sub(camera.point, Vec.div(pointer.delta, camera.zoom))
      document.point = camera.point
    },
    zoomCamera(data, payload: { delta: number }) {
      const { camera, viewport, document } = data
      const { point } = pointer

      const pt0 = Vec.add(Vec.div(point, camera.zoom), camera.point)

      camera.zoom += payload.delta / 500
      camera.zoom = Math.max(Math.min(camera.zoom, 10), 0.25)

      const pt1 = Vec.add(Vec.div(point, camera.zoom), camera.point)

      camera.point = Vec.sub(camera.point, Vec.sub(pt1, pt0))

      document.size = Vec.div(viewport.size, camera.zoom)
      document.point = camera.point

      // Normalized pointer position
      // const NP0 = Vec.divV(Vec.div(pointer.point, camera.zoom), document.size)
      // const NP1 = Vec.divV(Vec.div(pointer.point, camera.zoom), document.size)

      // camera.point = Vec.mulV(NP, document.size)

      // camera.point[0] +=
      //   ((camera.point[0] + pointer.point[0] / camera.zoom) * delta) / prev
      // camera.point[1] +=
      //   ((camera.point[1] + pointer.point[1] / camera.zoom) * delta) / prev

      // camera.point = Vec.add(
      //   camera.point,
      //   Vec.div(
      //     Vec.mul(Vec.add(camera.point, pointer.point), prev - camera.zoom),
      //     prev
      //   )
      // )
    },
    updateCameraOnViewportChange(
      data,
      payload: { point: number[]; size: number[] }
    ) {
      const { camera, viewport, document } = data
      camera.point = Vec.add(
        camera.point,
        Vec.div(Vec.sub(viewport.size, payload.size), 2)
      )
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

    // GLOBS
    setSelectedGlob(data, payload: { id: string }) {
      data.selectedGlobs = [payload.id]
      data.selected = []
    },
    pushSelectedGlob(data, payload: { id: string }) {
      data.selectedGlobs.push(payload.id)
      data.selected = []
    },
    pullSelectedGlob(data, payload: { id: string }) {
      data.selectedGlobs = data.selectedGlobs.filter((id) => id !== payload.id)
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
          selectedGlobs.some(
            (g) =>
              og.start === g.start ||
              og.start === g.end ||
              og.end === g.start ||
              og.end === g.end
          )
        )

      for (let globId of data.selectedGlobs) {
        if (visited.includes(globId)) continue
        visited.push(globId)

        const glob = globs[globId]

        glob.options.D = Vec.add(glob.options.D, delta)
        glob.options.Dp = Vec.add(glob.options.Dp, delta)

        for (let nodeId of [glob.start, glob.end]) {
          if (visited.includes(nodeId)) continue
          visited.push(nodeId)

          const node = nodes[nodeId]
          node.point = Vec.add(node.point, delta)

          for (let otherGlob of adjacentGlobs) {
            const { point: C0, radius: r0 } = nodes[otherGlob.start]
            const { point: C1, radius: r1 } = nodes[otherGlob.end]

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

      let next = screenToWorld(pointer.point, camera.point, camera.zoom)

      const { point: C0, radius: r0 } = nodes[glob.start]
      const { point: C1, radius: r1 } = nodes[glob.end]

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

    // NODES
    setSelectingNodes(data, payload: { id: string }) {
      data.selected = [payload.id]
    },
    moveSelectedNodes(data) {
      const { camera, globs } = data
      for (let id of data.selected) {
        const node = data.nodes[id]

        const next = screenToWorld(pointer.point, camera.point, camera.zoom)

        const backupPt = [...node.point]
        node.point = next

        for (let gid in globs) {
          const glob = globs[gid]

          if (!(glob.start === id || glob.end === id)) continue

          const { point: C0, radius: r0 } = data.nodes[glob.start]
          const { point: C1, radius: r1 } = data.nodes[glob.end]

          const backup = {
            D: [...glob.options.D],
            Dp: [...glob.options.Dp],
          }

          for (let i = 0; i < 2; i++) {
            let handle = glob.options[i === 1 ? "Dp" : "D"]

            if (Vec.dist(handle, C0) < r0 + 5) {
              glob.options[i === 1 ? "Dp" : "D"] = getClosestPointOnCircle(
                C0,
                r0,
                handle,
                5
              )
            }

            if (Vec.dist(handle, C1) < r1 + 5) {
              glob.options[i === 1 ? "Dp" : "D"] = getClosestPointOnCircle(
                C1,
                r1,
                handle,
                5
              )
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
    setHoveringNodes(data, payload, result: string[]) {
      data.hovering = result
    },
    toggleNodeCap(data, payload: { id: string }) {
      const node = data.nodes[payload.id]
      node.cap = node.cap === "round" ? "flat" : "round"
    },
    saveData(data) {
      if (typeof window === "undefined") return
      if (typeof localStorage === "undefined") return
      localStorage.setItem("glob_editor_v1", JSON.stringify(data))
    },
    // Setup and Mounting
    setup(data) {
      if (typeof window === "undefined") return
      if (typeof localStorage === "undefined") return
      const saved = localStorage.getItem("glob_editor_v1")
      if (saved) {
        Object.assign(data, JSON.parse(saved))
      }

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
      if (!camera.point) {
        console.log(data)
        return
      }
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

function handleKeyDown(e: KeyboardEvent) {
  keys[e.key] = true
  state.send("PRESSED_KEY")
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
