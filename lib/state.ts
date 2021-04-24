import router from "next/router"
import { dark } from "stitches.config"
import { v4 as uuid } from "uuid"
import { MutableRefObject } from "react"
import { motionValue } from "framer-motion"
import { createState, createSelectorHook } from "@state-designer/react"
import * as vec from "lib/vec"
import { current } from "immer"
import { initialData, defaultData } from "./data"
import history from "lib/history"
import inputs from "lib/inputs"
import exports from "lib/exports"
import * as commands from "lib/commands"
import AnchorSession from "lib/sessions/AnchorSession"
import HandleSession from "lib/sessions/HandleSession"
import ResizeSession from "lib/sessions/ResizeSession"
import TranslateSession from "lib/sessions/TranslateSession"
import TransformSession from "lib/sessions/TransformSession"
import RotateSession from "lib/sessions/RotateSession"
import MoveSession from "./sessions/MoveSession"
import {
  IGlob,
  IHandle,
  IAnchor,
  ITranslation,
  INode,
  ICanvasItems,
  IProject,
} from "lib/types"
import {
  getAllSelectedBoundingBox,
  getSelectedBoundingBox,
  screenToWorld,
  throttle,
} from "utils"
import { roundBounds } from "./bounds-utils"
import migrate from "./migrations"
import clipboard from "./clipboard"
import BrushSession from "./sessions/BrushSession"

export const elms: Record<string, MutableRefObject<SVGElement>> = {}

const state = createState({
  data: initialData,
  on: {
    MOUNTED_ELEMENT: { secretlyDo: "mountElement" },
    UNMOUNTED_ELEMENT: { secretlyDo: "deleteElement" },
    UNMOUNTED: { do: "teardown", to: "loading" },
    EXPORTED: "copySvgToClipboard",
    RESIZED: "setViewport",
    PRESSED_SPACE: "toggleFill",
    RELEASED_SPACE: "toggleFill",
    TOGGLED_FILL: "toggleFill",
    MOVED_POINTER: [
      { secretlyDo: "updateMvPointer" },
      { if: "hasMiddleButton", do: "panCamera" },
    ],
    WHEELED: {
      ifAny: ["hasShift", "isTrackpadZoom"],
      do: ["zoomCamera", "updateMvPointer"],
      else: ["wheelPanCamera", "updateMvPointer"],
    },
    STARTED_MOVING_THUMBSTICK: {
      if: "hasSelection",
      to: "draggingWithThumbstick",
      else: { to: "panningWithThumbstick" },
    },
    ZOOMED_TO_FIT: "zoomCameraToFitContent",
    COPIED: "copyToClipboard",
    CUT: ["copyToClipboard", "deleteSelection"],
    OPENED_READ_ONLY_PROJECT: ["setReadonly", "disableHistory"],
    OPENED_EDITABLE_PROJECT: ["clearReadonly", "enableHistory"],
    OPENED_SHARE_LINK: { to: "viewingShareLink" },
    OPENED_SHARE_LINK_MODAL: { to: "shareLinkModal" },
    DOWNLOADED_SHARE_LINK: { do: "mergeSharedLinkToLocal" },
    TOGGLED_THEME: ["toggleTheme", "loadTheme"],
  },
  initial: "loading",
  states: {
    loading: {
      on: {
        MOUNTED: [
          {
            if: "isShareLink",
            do: ["setReadonly", "disableHistory", "loadSharedProject"],
            else: ["clearReadonly", "enableHistory", "loadLocalProject"],
          },
          "setViewport",
          { if: "isShareLink", do: "zoomCameraToFitContent" },
          "loadTheme",
          "setEvents",
          { to: "ready" },
        ],
      },
    },
    ready: {
      on: {
        PASTED: { unless: "isReadOnly", do: "startPasteFromClipboard" },
        FINISHED_PASTE: "finishPasteFromClipboard",
        CHANGED_CODE: "setCode",
        OPENED_CODE_PANEL: "openCodePanel",
        CLOSED_CODE_PANEL: "closeCodePanel",
        INCREASED_CODE_FONT_SIZE: "increaseCodeFontSize",
        DECREASED_CODE_FONT_SIZE: "decreaseCodeFontSize",
      },
      initial: "selecting",
      states: {
        selecting: {
          initial: "notPointing",
          states: {
            notPointing: {
              onEnter: { do: "clearPointingId" },
              on: {
                // Keyboard / Menus
                UNDO: "undo",
                REDO: "redo",
                CANCELLED: "clearSelection",
                SELECTED_ALL: "selectAll",
                DELETED: ["deleteSelection"],
                HARD_RESET: ["hardReset"],
                // Pointer
                TOGGLED_CAP: "toggleSelectedNodesCap",
                HIGHLIT_GLOB: "pushHighlightGlob",
                HIGHLIT_NODE: "pushHighlightNode",
                UNHIGHLIT_GLOB: "pullHighlightGlob",
                UNHIGHLIT_NODE: "pullHighlightNode",
                HOVERED_GLOB: "pushHoveredGlob",
                UNHOVERED_GLOB: "pullHoveredGlob",
                HOVERED_NODE: "pushHoveredNode",
                UNHOVERED_NODE: "pullHoveredNode",
                RIGHT_CLICKED_NODE: [
                  "setPointingId",
                  {
                    unless: "pointingSelectedNode",
                    do: "setPointingToSelectedNodes",
                  },
                ],
                POINTED_NODE: [
                  "setPointingId",
                  {
                    if: "pointingSelectedNode",
                    then: {
                      if: "hasShift",
                      then: {
                        do: "pullPointingFromSelectedNodes",
                        to: "notPointing",
                      },
                      else: {
                        unless: "isReadOnly",
                        if: "hasMeta",
                        to: "resizingNodes",
                        else: { to: "pointingSelectedNode" },
                      },
                    },
                    else: {
                      if: "hasShift",
                      then: {
                        do: "pushPointingToSelectedNodes",
                        to: "pointingSelectedNode",
                      },
                      else: [
                        "setPointingToSelectedNodes",
                        {
                          unless: "isReadOnly",
                          if: "hasMeta",
                          to: "resizingNodes",
                          else: { to: "pointingSelectedNode" },
                        },
                      ],
                    },
                  },
                ],
                RIGHT_CLICKED_GLOB: [
                  "setPointingId",
                  {
                    unless: "pointingSelectedGlob",
                    do: "setPointingToSelectedGlobs",
                  },
                ],
                POINTED_GLOB: [
                  "setPointingId",
                  {
                    if: "pointingSelectedGlob",
                    then: {
                      if: "hasShift",
                      then: {
                        do: "pullPointingFromSelectedGlobs",
                        to: "notPointing",
                      },
                      else: {
                        if: "hasMeta",
                        to: "splittingGlob",
                        else: { to: "pointingSelectedGlob" },
                      },
                    },
                    else: {
                      if: "hasShift",
                      then: {
                        do: "pushPointingToSelectedGlobs",
                        to: "pointingSelectedGlob",
                      },
                      else: {
                        do: "setPointingToSelectedGlobs",
                        to: "pointingSelectedGlob",
                      },
                    },
                  },
                ],
                POINTED_BOUNDS: {
                  if: "hasMeta",
                  to: "brushSelecting",
                  else: {
                    unless: "isReadOnly",
                    to: "draggingSelection",
                  },
                },
                POINTED_CANVAS: [
                  {
                    unless: "hasShift",
                    do: "clearSelection",
                  },
                  { to: "brushSelecting" },
                ],
                POINTED_ANCHOR: {
                  unless: "isReadOnly",
                  do: "setPointingId",
                  to: "pointingAnchor",
                },
                POINTED_HANDLE: {
                  unless: "isReadOnly",
                  do: "setPointingId",
                  to: "pointingHandle",
                },
                POINTED_BOUNDS_EDGE: {
                  unless: "isReadOnly",
                  do: "beginEdgeTransform",
                  to: "transforming",
                },
                POINTED_BOUNDS_CORNER: {
                  unless: "isReadOnly",
                  do: "beginCornerTransform",
                  to: "transforming",
                },
                POINTED_ROTATE_CORNER: {
                  unless: "isReadOnly",
                  to: "rotating",
                },
                // Panel
                STARTED_translating: {
                  unless: "isReadOnly",
                  to: "translating",
                },
                SET_NODES_X: "setPointingToSelectedNodessPointX",
                SET_NODES_Y: "setPointingToSelectedNodessPointY",
                SET_NODES_RADIUS: "setPointingToSelectedNodessRadius",
                SET_NODES_CAP: "setPointingToSelectedNodessCap",
                SET_NODES_LOCKED: "setPointingToSelectedNodessLocked",
                TOGGLED_NODE_LOCKED: "toggleSelectedNodesLocked",
                SET_GLOB_OPTIONS: "setSelectedGlobOptions",
                CHANGED_BOUNDS_X: "changeBoundsX",
                CHANGED_BOUNDS_Y: "changeBoundsY",
                CHANGED_BOUNDS_WIDTH: "changeBoundsWidth",
                CHANGED_BOUNDS_HEIGHT: "changeBoundsHeight",
                LOCKED_NODES: "toggleSelectedNodesLocked",
                GENERATED_ITEMS: "setCanvasItems",
                // Navigator
                MOVED_NODE_ORDER: "moveNodeOrder",
                MOVED_GLOB_ORDER: "moveGlobOrder",
                // Toolbar
                STARTED_CREATING_NODES: {
                  to: "creatingNodes",
                },
                STARTED_GLOBBING_NODES: {
                  if: "hasSelectedNodes",
                  to: "globbingNodes",
                  else: {
                    to: "creatingNodes",
                  },
                },
              },
            },
            pointingSelectedGlob: {
              on: {
                STOPPED_POINTING: { to: "notPointing" },
                MOVED_POINTER: {
                  unless: "isReadOnly",
                  if: "distanceImpliesDrag",
                  to: "draggingSelection",
                },
              },
            },
            pointingSelectedNode: {
              on: {
                STOPPED_POINTING: { to: "notPointing" },
                PRESSED_META: { to: "resizingNodes" },
                MOVED_POINTER: {
                  unless: "isReadOnly",
                  if: "distanceImpliesDrag",
                  to: "draggingSelection",
                },
              },
            },
            draggingSelection: {
              onEnter: "beginMove",
              onExit: "clearSnaps",
              on: {
                CANCELLED: { do: "cancelMove", to: "notPointing" },
                WHEELED: "updateMove",
                PRESSED_OPTION: "updateMove",
                RELEASED_OPTION: "updateMove",
                MOVED_POINTER: "updateMove",
                STOPPED_POINTING: {
                  do: "completeMove",
                  to: "notPointing",
                },
              },
            },
            resizingNodes: {
              onEnter: "beginRadiusMove",
              on: {
                PRESSED_SHIFT: "updateRadiusMove",
                RELEASED_SHIFT: "updateRadiusMove",
                PRESSED_OPTION: "updateRadiusMove",
                RELEASED_OPTION: "updateRadiusMove",
                RELEASED_META: {
                  do: "completeRadiusMove",
                  to: "pointingSelectedNode",
                },
                MOVED_POINTER: "updateRadiusMove",
                STOPPED_POINTING: {
                  do: "completeRadiusMove",
                  to: "notPointing",
                },
              },
            },
            pointingHandle: {
              onEnter: [
                "beginHandleMove",
                "setPointingToSelectedGlobs",
                "setSelectedHandle",
              ],
              onExit: ["clearSnaps", "clearSelectedHandle"],
              on: {
                WHEELED: "updateHandleMove",
                MOVED_POINTER: "updateHandleMove",
                CANCELLED: {
                  do: "cancelHandleMove",
                  to: "notPointing",
                },
                STOPPED_POINTING: {
                  do: "completeHandleMove",
                  to: "notPointing",
                },
              },
            },
            pointingAnchor: {
              onEnter: ["beginAnchorMove", "setPointingToSelectedGlobs"],
              onExit: "clearSnaps",
              on: {
                WHEELED: "updateAnchorMove",
                MOVED_POINTER: "updateAnchorMove",
                CANCELLED: {
                  do: "cancelAnchorMove",
                  to: "notPointing",
                },
                STOPPED_POINTING: {
                  do: "completeAnchorMove",
                  to: "notPointing",
                },
              },
            },
            brushSelecting: {
              onEnter: ["startBrush", "clearHovers"],
              on: {
                HOVERED_GLOB: "pushHoveredGlob",
                UNHOVERED_GLOB: "pullHoveredGlob",
                HOVERED_NODE: "pushHoveredNode",
                UNHOVERED_NODE: "pullHoveredNode",
                MOVED_POINTER: "updateBrush",
                WHEELED: "updateBrush",
                STOPPED_POINTING: {
                  do: "completeBrush",
                  to: "notPointing",
                },
                POINTED_CANVAS: {
                  do: "cancelBrush",
                  to: "notPointing",
                },
                CANCELLED: {
                  do: "cancelBrush",
                  to: "notPointing",
                },
              },
            },
            transforming: {
              on: {
                MOVED_POINTER: "updateTransform",
                WHEELED: "updateTransform",
                STOPPED_POINTING: {
                  do: ["completeTransform"],
                  to: "notPointing",
                },
                CANCELLED: {
                  do: "cancelTransform",
                  to: "notPointing",
                },
              },
            },
            rotating: {
              onEnter: "beginRotate",
              on: {
                MOVED_POINTER: "updateRotate",
                WHEELED: "updateRotate",
                STOPPED_POINTING: {
                  do: "completeRotate",
                  to: "notPointing",
                },
                CANCELLED: { do: "cancelRotate", to: "notPointing" },
              },
            },
            translating: {
              onEnter: "beginTranslation",
              on: {
                MOVED_POINTER_IN_TRANSLATE: {
                  do: "updateTranslation",
                },
                STOPPED_POINTING: {
                  do: "completeTranslation",
                  to: "notPointing",
                },
              },
            },
            panningWithThumbstick: {
              on: {
                MOVED_THUMBSTICK: "panCamera",
                STOPPED_MOVING_THUMBSTICK: { to: "notPointing" },
              },
            },
            draggingWithThumbstick: {
              onEnter: "beginMove",
              on: {
                MOVED_THUMBSTICK: "updateMove",
                STOPPED_MOVING_THUMBSTICK: {
                  do: "completeMove",
                  to: "notPointing",
                },
              },
            },
          },
        },
        creatingNodes: {
          on: {
            CANCELLED: { to: "selecting" },
            STARTED_CREATING_NODES: { to: "selecting" },
            STARTED_GLOBBING_NODES: {
              if: "hasSelectedNodes",
              to: "globbingNodes",
            },
            POINTED_CANVAS: {
              do: ["createNode"],
              to: "selecting",
            },
          },
        },
        globbingNodes: {
          on: {
            CANCELLED: { to: "selecting" },
            STARTED_GLOBBING_NODES: { to: "selecting" },
            STARTED_CREATING_NODES: { to: "creatingNodes" },
            HOVERED_NODE: { do: "pushHoveredNode" },
            UNHOVERED_NODE: { do: "pullHoveredNode" },
            POINTED_NODE: {
              do: "createGlobBetweenNodes",
              to: "selecting",
            },
            POINTED_CANVAS: {
              do: "createGlobToNewNode",
              to: "selecting",
            },
          },
        },
        splittingGlob: {
          on: {
            CANCELLED: { to: "selecting" },
            RELEASED_META: { to: "selecting" },
            SPLIT_GLOB: {
              do: ["splitGlob", "clearSelection"],
              to: "selecting",
            },
            POINTED_CANVAS: {
              unless: "hasMeta",
              to: "selecting",
            },
          },
        },
      },
    },
    shareLinkModal: {
      on: {
        CHANGED_SHARE_LINKS: { do: "setShareLinks" },
        CLOSED_SHARE_LINK_MODAL: { to: "ready" },
      },
    },
  },
  conditions: {
    isReadOnly(data) {
      return data.readOnly
    },
    distanceImpliesDrag() {
      return vec.dist(inputs.pointer.origin, inputs.pointer.point) > 3
    },
    hasSelection(data) {
      const { selectedNodes, selectedGlobs } = data
      return selectedGlobs.length > 0 || selectedNodes.length > 0
    },
    hasBoundsSelection(data) {
      const { selectedNodes, selectedGlobs } = data
      return selectedGlobs.length + selectedNodes.length > 1
    },
    pointingSelectedNode(data) {
      return data.selectedNodes.includes(data.pointingId)
    },
    pointingSelectedGlob(data) {
      return data.selectedGlobs.includes(data.pointingId)
    },
    hasSelectedNodes(data) {
      return data.selectedNodes.length > 0
    },
    isTrackpadZoom(_, payload: { optionKey: boolean; ctrlKey: boolean }) {
      return payload.optionKey || payload.ctrlKey
    },
    hasMiddleButton(_, payload: { isPan: boolean }) {
      return payload.isPan
    },
    hasMeta(_, payload: { metaKey: boolean }) {
      return payload.metaKey
    },
    hasShift(_, payload: { shiftKey: boolean }) {
      return payload.shiftKey
    },
    isShareLink(_, payload: { isShareLink: boolean }) {
      return payload.isShareLink
    },
  },
  actions: {
    // Code panel
    setCanvasItems(
      data,
      payload: { nodes: Record<string, INode>; globs: Record<string, IGlob> }
    ) {
      commands.setCanvasItems(data, payload)
    },

    // Clipboard
    copySvgToClipboard(data) {
      exports.copyToSvg(data, elms)
    },
    copyToClipboard(data) {
      clipboard.copy(data)
    },
    startPasteFromClipboard() {
      clipboard.startPaste()
    },
    finishPasteFromClipboard(data, copied) {
      clipboard.finishPaste(data, copied)
    },

    // Readonly
    setReadonly(data) {
      data.readOnly = true
    },
    clearReadonly(data) {
      data.readOnly = false
    },

    // History
    enableHistory() {
      history.enable()
    },
    disableHistory() {
      history.disable()
    },
    undo(data) {
      history.undo(data)
    },
    redo(data) {
      history.redo(data)
    },

    // Elements (Maybe remove?)
    mountElement(
      data,
      payload: { id: string; elm: MutableRefObject<SVGElement> }
    ) {
      elms[payload.id] = payload.elm
    },
    deleteElement(data, payload: { id: string }) {
      delete elms[payload.id]
    },

    // Display
    toggleTheme(data) {
      data.theme = data.theme === "dark" ? "light" : "dark"
      history.save(data)
    },
    loadTheme(data) {
      document.body.classList.remove(data.theme === "dark" ? "light" : dark)
      document.body.classList.add(data.theme === "dark" ? dark : "light")
    },
    toggleFill(data) {
      data.fill = !data.fill
    },
    updateMvPointer(data) {
      mvPointer.screen.set(inputs.pointer.point)
      mvPointer.world.set(screenToWorld(inputs.pointer.point, data.camera))
    },
    panCamera(data) {
      const { camera, document } = data
      const delta = vec.div(inputs.pointer.delta, camera.zoom)
      camera.point = vec.round(vec.add(camera.point, vec.neg(delta)))
      document.point = camera.point
    },
    wheelPanCamera(data, payload: { delta: number[] }) {
      const { camera, document } = data
      const delta = vec.div(vec.neg(payload.delta), camera.zoom)
      camera.point = vec.round(vec.sub(camera.point, delta))
      inputs.pointer.delta = vec.mul(vec.neg(delta), camera.zoom)
      document.point = camera.point
    },
    zoomCamera(data, payload: { shiftKey: boolean; delta: number[] }) {
      const { camera, viewport, document } = data
      const { point } = inputs.pointer

      const delta =
        (vec.mul(vec.neg(payload.delta), 5)[payload.shiftKey ? 0 : 1] / 500) *
        Math.max(0.1, camera.zoom)

      const pt0 = vec.add(vec.div(point, camera.zoom), camera.point)

      camera.zoom =
        Math.round(Math.max(Math.min(camera.zoom + delta, 10), 0.1) * 100) / 100

      const pt1 = vec.add(vec.div(point, camera.zoom), camera.point)

      camera.point = vec.round(vec.sub(camera.point, vec.sub(pt1, pt0)))

      document.size = vec.round(vec.div(viewport.size, camera.zoom))
      document.point = camera.point
    },
    setViewport(data, payload: { size: number[] }) {
      const { viewport, camera, document } = data
      const c0 = screenToWorld(
        vec.add(document.point, vec.div(viewport.size, 2)),
        camera
      )
      viewport.size = payload.size
      document.size = vec.round(vec.div(viewport.size, camera.zoom))
      const c1 = screenToWorld(
        vec.add(document.point, vec.div(viewport.size, 2)),
        camera
      )
      document.point = vec.sub(document.point, vec.sub(c1, c0))
      camera.point = document.point
    },
    zoomCameraToFitContent(data) {
      const { camera, document, viewport } = data

      const bounds = getAllSelectedBoundingBox(data)

      if (!bounds) {
        // Canvas is empty
        data.camera.zoom = 1
        data.camera.point = vec.neg(vec.div(viewport.size, 2))
        return
      }

      // Find the new camera scale
      const s0 =
        (viewport.size[0] > 720 ? viewport.size[0] - 528 : viewport.size[0]) /
        bounds.width

      const s1 = (viewport.size[1] - 128) / bounds.height

      const smallerZoom = Math.min(s0, s1)

      camera.zoom = smallerZoom ? Math.max(0.1, Math.min(smallerZoom, 1)) : 1

      // Center on the bounds
      document.size = vec.round(vec.div(viewport.size, camera.zoom))

      camera.point = vec.sub(
        [bounds.minX + bounds.width / 2, bounds.minY + bounds.height / 2],
        vec.div(document.size, 2)
      )

      document.point = camera.point
    },

    // Selection
    deleteSelection(data) {
      commands.deleteSelection(data)
    },
    selectAll(data) {
      data.selectedGlobs = [...data.globIds]
      data.selectedNodes = [...data.nodeIds]
    },
    // Brush selection
    startBrush(data) {
      brushSession = new BrushSession(data)
    },
    updateBrush(data) {
      brushSession.update(data)
    },
    cancelBrush(data) {
      brushSession.cancel(data)
      brushSession = undefined
    },
    completeBrush(data) {
      brushSession.complete(data)
      brushSession = undefined
    },
    // Pointing Id
    setPointingId(data, payload: { id: string }) {
      data.pointingId = payload.id
    },
    clearPointingId(data) {
      data.pointingId = undefined
    },
    clearSelection(data) {
      data.bounds = undefined
      data.selectedHandle = undefined
      data.selectedNodes = []
      data.selectedGlobs = []
      data.highlightNodes = []
      data.highlightGlobs = []
      data.pointingId = undefined
    },
    setPointingToSelectedNodes(data) {
      data.bounds = undefined
      data.selectedHandle = undefined
      data.selectedGlobs = []
      data.selectedNodes = [data.pointingId]
    },
    pushPointingToSelectedNodes(data) {
      data.selectedNodes.push(data.pointingId)
    },
    pullPointingFromSelectedNodes(data) {
      data.selectedNodes = data.selectedNodes.filter(
        (id) => id !== data.pointingId
      )
    },
    setPointingToSelectedGlobs(data) {
      data.bounds = undefined
      data.selectedHandle = undefined
      data.selectedNodes = []
      data.selectedGlobs = [data.pointingId]
    },
    pushPointingToSelectedGlobs(data, payload: { id: string }) {
      data.selectedGlobs.push(payload.id)
      data.selectedHandle = undefined
      data.selectedNodes = []
    },
    pullPointingFromSelectedGlobs(data) {
      data.selectedGlobs = data.selectedGlobs.filter(
        (id) => id !== data.pointingId
      )
    },
    // Highlights
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
    clearHovers(data) {
      data.hoveredGlobs = []
      data.hoveredNodes = []
    },

    // Nodes
    createNode(data) {
      commands.createNode(data)
    },
    toggleSelectedNodesLocked(data) {
      commands.toggleSelectionLocked(data)
    },
    toggleSelectedNodesCap(data, payload: { id: string }) {
      commands.toggleSelectedNodesCap(data, payload.id)
    },
    setPointingToSelectedNodessPointX(data, payload: { value: number }) {
      commands.setPropertyOnSelectedNodes(data, { x: payload.value })
    },
    setPointingToSelectedNodessPointY(data, payload: { value: number }) {
      commands.setPropertyOnSelectedNodes(data, { y: payload.value })
    },
    setPointingToSelectedNodessRadius(data, payload: { value: number }) {
      commands.setPropertyOnSelectedNodes(data, { r: payload.value })
    },
    setPointingToSelectedNodessCap(data, payload: { value: "round" | "flat" }) {
      commands.setPropertyOnSelectedNodes(data, { cap: payload.value })
    },
    setPointingToSelectedNodessLocked(data, payload: { value: boolean }) {
      commands.setPropertyOnSelectedNodes(data, { locked: payload.value })
    },
    moveNodeOrder(data, payload: { from: number; to: number }) {
      commands.reorderNodes(data, payload.from, payload.to)
    },
    beginRadiusMove(data) {
      resizeSession = new ResizeSession(data, data.selectedNodes[0])
    },
    updateRadiusMove(data) {
      resizeSession.update(data)
    },
    cancelRadiusMove(data) {
      resizeSession.cancel(data)
      resizeSession = undefined
    },
    completeRadiusMove(data) {
      resizeSession.complete(data)
      resizeSession = undefined
    },

    // Globs
    setSelectedGlobOptions(data, payload: Partial<IGlob>) {
      commands.updateGlobOptions(data, payload)
    },
    createGlobToNewNode(data) {
      commands.createGlobToNewNode(data, inputs.pointer.point)
    },
    createGlobBetweenNodes(data, payload: { id: string }) {
      commands.createGlobBetweenNodes(data, payload.id)
    },
    moveGlobOrder(data, payload: { from: number; to: number }) {
      commands.reorderGlobs(data, payload.from, payload.to)
    },
    splitGlob(data, payload: { id: string }) {
      commands.splitGlob(data, payload.id)
    },

    // Handles
    setSelectedHandle(data, payload: { id: string; handle: IHandle }) {
      data.selectedHandle = payload
    },
    clearSelectedHandle(data) {
      data.selectedHandle = undefined
    },
    beginHandleMove(data, payload: { id: string; handle: IHandle }) {
      data.selectedHandle = payload
      handleSession = new HandleSession(data, payload.id, payload.handle)
    },
    updateHandleMove(data) {
      handleSession.update(data)
    },
    cancelHandleMove(data) {
      handleSession.cancel(data)
      handleSession = undefined
    },
    completeHandleMove(data) {
      handleSession.complete(data)
      handleSession = undefined
    },

    // Anchors
    beginAnchorMove(data, payload: { id: string; anchor: IAnchor }) {
      anchorSession = new AnchorSession(data, payload.id, payload.anchor)
    },
    updateAnchorMove(data) {
      anchorSession.update(data)
    },
    cancelAnchorMove(data) {
      anchorSession.cancel(data)
      anchorSession = undefined
    },
    completeAnchorMove(data) {
      anchorSession.complete(data)
      anchorSession = undefined
    },

    // Moving Stuff
    beginMove(data) {
      moveSession = new MoveSession(data)
    },
    updateMove(data) {
      moveSession.update(data)
    },
    cancelMove(data) {
      moveSession.cancel(data)
      moveSession = undefined
    },
    completeMove(data) {
      moveSession.complete(data)
      moveSession = undefined
    },
    clearSnaps(data) {
      data.snaps.active = []
    },

    // Translations (from the panel)
    beginTranslation(data, payload: ITranslation) {
      translateSession = new TranslateSession(data, payload)
    },
    updateTranslation(data) {
      translateSession.update(data)
    },
    cancelTranslation(data) {
      translateSession.cancel(data)
      translateSession = undefined
    },
    completeTranslation(data) {
      translateSession.complete(data)
      translateSession = undefined
    },

    // Moving bounds (from the panel)
    changeBoundsX(data, payload: { value: number }) {
      commands.moveBounds(data, [payload.value, 0])
    },
    changeBoundsY(data, payload: { value: number }) {
      commands.moveBounds(data, [0, payload.value])
    },
    changeBoundsWidth(data, payload: { value: number }) {
      commands.resizeBounds(data, [payload.value, 0])
    },
    changeBoundsHeight(data, payload: { value: number }) {
      commands.resizeBounds(data, [0, payload.value])
    },

    // Edge or corner transforms
    beginEdgeTransform(data, payload: { edge: number }) {
      transformSession = new TransformSession(data, "edge", payload.edge)
    },
    beginCornerTransform(data, payload: { corner: number }) {
      transformSession = new TransformSession(data, "corner", payload.corner)
    },
    updateTransform(data) {
      transformSession.update(data)
    },
    cancelTransform(data) {
      transformSession.cancel(data)
      transformSession = undefined
    },
    completeTransform(data) {
      transformSession.complete(data)
      transformSession = undefined
    },

    // Rotations
    beginRotate(data) {
      rotateSession = new RotateSession(data)
    },
    updateRotate(data) {
      rotateSession.update(data)
    },
    cancelRotate(data) {
      rotateSession.cancel(data)
      rotateSession = undefined
    },
    completeRotate(data) {
      rotateSession.complete(data)
      rotateSession = undefined
    },

    // Code Panel
    setCode(data, payload: { fileId: string; code: string }) {
      data.code[payload.fileId].code = payload.code
      history.save(data)
    },
    openCodePanel(data) {
      data.codePanel.isOpen = true
      history.save(data)
    },
    closeCodePanel(data) {
      data.codePanel.isOpen = false
      history.save(data)
    },
    increaseCodeFontSize(data) {
      data.codePanel.fontSize++
      history.save(data)
    },
    decreaseCodeFontSize(data) {
      data.codePanel.fontSize--
      history.save(data)
    },

    // SHARE LINKS
    setShareLinks(data, payload: { uuids: string[] }) {
      data.shareUrls = payload.uuids
      history.save(data)
    },
    mergeSharedLinkToLocal(data) {
      if (typeof window === "undefined") return
      if (typeof localStorage === "undefined") return
      const saved = localStorage.getItem("glob_aldata_v6")
      const currentDoc = { ...current(data) }
      currentDoc.shareUrls = []

      if (saved) {
        const localDoc = migrate(JSON.parse(saved))
        const localBounds = getAllSelectedBoundingBox(localDoc)
        const currentBounds = getAllSelectedBoundingBox(currentDoc)

        // Center selection on new canvas
        const delta = [
          localBounds.minX - currentBounds.minX,
          localBounds.maxX + 200 - currentBounds.minY,
        ]

        // Move the incoming items out of the way.

        const { selectedNodes, nodes, selectedGlobs, globs } = currentDoc

        for (const nodeId of selectedNodes) {
          nodes[nodeId].point = vec.round(vec.add(nodes[nodeId].point, delta))
        }

        for (const globId of selectedGlobs) {
          globs[globId].D = vec.round(vec.add(globs[globId].D, delta))
          globs[globId].Dp = vec.round(vec.add(globs[globId].Dp, delta))
        }

        // Merge data into the local document. If items with the same
        // id exist in the local document, we create new ids for the
        // incoming items. Make sure to update references, too (e.g the
        // glob.nodes array).

        let id: string

        const nodeMap: Record<string, string> = {}

        for (const nodeId in currentDoc.nodes) {
          id = nodeId
          nodeMap[nodeId] = nodeId
          const node = { ...currentDoc.nodes[nodeId] }
          if (localDoc.nodes[id]) {
            id = uuid()
            node.id = id
            nodeMap[nodeId] = id
          }
          localDoc.nodes[id] = node
        }

        for (const globId in currentDoc.globs) {
          id = globId
          const glob = { ...currentDoc.globs[globId] }
          if (localDoc.globs[id]) {
            id = uuid()
            glob.id = id
          }
          glob.nodes = glob.nodes.map((nodeId) => nodeMap[nodeId])
          localDoc.globs[id] = glob
        }

        for (const groupId in currentDoc.groups) {
          id = groupId
          const group = { ...currentDoc.groups[groupId] }
          if (localDoc.groups[id]) {
            id = uuid()
            group.id = id
          }
          localDoc.groups[id] = group
        }

        localDoc.nodeIds = Object.keys(localDoc.nodes)
        localDoc.globIds = Object.keys(localDoc.globs)

        localStorage.setItem("glob_aldata_v6", JSON.stringify(localDoc))
      } else {
        localStorage.setItem("glob_aldata_v6", JSON.stringify(currentDoc))
      }

      router.push("/")
    },

    // EVENTS
    loadLocalProject(data) {
      data.readOnly = false

      if (typeof window === "undefined") return
      if (typeof localStorage === "undefined") return
      const saved = localStorage.getItem("glob_aldata_v6")

      Object.assign(data, saved ? migrate(JSON.parse(saved)) : defaultData)
    },
    loadSharedProject(
      data,
      payload: { project: { name: string; document: IProject } }
    ) {
      data.name = payload.project.name
      Object.assign(data, payload.project.document)
    },
    setEvents(data) {
      data.fill = false
      data.selectedNodes = []
      data.selectedGlobs = []
      data.highlightGlobs = []
      data.highlightNodes = []
      data.hoveredNodes = []
      data.hoveredGlobs = []
      data.snaps.active = []
      data.nodeIds = Object.keys(data.nodes)
      data.globIds = Object.keys(data.globs)

      if (typeof window !== "undefined") {
        window.addEventListener("keydown", handleKeyDown)
        window.addEventListener("keyup", handleKeyUp)
        window.addEventListener("resize", handleResize)
        window.addEventListener("blur", handleWindowBlur)
        window.addEventListener("gesturestart", handleGestureStart)
        window.addEventListener("gesturechange", handleGestureEvent)
        window.addEventListener("gestureend", handleGestureEvent)
      }
    },
    teardown(data) {
      if (!data.readOnly) {
        history.save(data)
      }

      if (typeof window !== "undefined") {
        window.removeEventListener("keydown", handleKeyDown)
        window.removeEventListener("keyup", handleKeyUp)
        window.removeEventListener("resize", handleResize)
        window.removeEventListener("blur", handleWindowBlur)
        window.removeEventListener("gesturestart", handleGestureStart)
        window.removeEventListener("gesturechange", handleGestureEvent)
        window.removeEventListener("gestureend", handleGestureEvent)
      }
    },
    hardReset(data) {
      // Document
      data.id = Date.now().toString()
      data.name = "My Project"
      data.pages = {
        0: {
          id: "0",
          name: "Page 1",
          type: ICanvasItems.Page,
          locked: false,
          childIndex: 0,
        },
      }
      data.code = {
        0: {
          id: "0",
          childIndex: 0,
          name: "My Code",
          code: "",
        },
      }
      data.groups = {}
      data.nodes = {}
      data.globs = {}
      // State
      data.nodeIds = []
      data.globIds = []
      data.selectedGlobs = []
      data.selectedNodes = []
      data.highlightNodes = []
      data.highlightGlobs = []
      data.hoveredGlobs = []
      data.hoveredNodes = []
      data.snaps.active = []
      data.selectedHandle = undefined
      data.bounds = undefined
      data.shareUrls = []
      window.alert("Hard Reset!")
    },
  },
  values: {
    selectionBounds(data) {
      if (data.selectedGlobs.length + data.selectedNodes.length) {
        const bounds = getSelectedBoundingBox(data)
        return roundBounds(bounds)
      }

      return null
    },
  },
})

/* -------------------- SESSIONS -------------------- */

let moveSession: MoveSession
let handleSession: HandleSession
let anchorSession: AnchorSession
let resizeSession: ResizeSession
let rotateSession: RotateSession
let translateSession: TranslateSession
let transformSession: TransformSession
let brushSession: BrushSession

/* --------------------- INPUTS --------------------- */

export const isDarwin = () =>
  /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)
export const isWindows = () => /^Win/.test(window.navigator.platform)

export const mvPointer = {
  screen: motionValue([0, 0]),
  world: motionValue([0, 0]),
}

/* ------------------ INPUT EVENTS ------------------ */

let prevScale = 1

const handleGestureStart = (e: Event) => {
  prevScale = 1
  e.preventDefault()
}

const handleGestureEvent = throttle(
  (e: Event & { scale: number }) => {
    const scale = e.scale
    let delta = scale - prevScale
    if (scale < 1) delta *= 2
    prevScale = scale
    state.send("WHEELED", { ctrlKey: true, delta: [0, delta * -50] })
  },
  16,
  true
)

const handleResize = throttle(() => {
  if (typeof window !== "undefined") {
    state.send("RESIZED", { size: [window.innerWidth, window.innerHeight] })
  }
}, 16)

function handleWindowBlur() {
  inputs.handleWindowBlur()
}

function handleKeyDown(e: KeyboardEvent) {
  const eventName = inputs.handleKeyDown(
    e.key,
    e.shiftKey,
    e.altKey,
    e.ctrlKey,
    e.metaKey
  )

  if (eventName) {
    state.send(eventName)
    e.preventDefault()
  }

  state.send("PRESSED_KEY", { key: e.key })

  if (e.key === "s" && (isDarwin() ? e.metaKey : e.ctrlKey)) {
    e.preventDefault()
  }
}

function handleKeyUp(e: KeyboardEvent) {
  const eventName = inputs.handleKeyUp(
    e.key,
    e.shiftKey,
    e.altKey,
    e.ctrlKey,
    e.metaKey
  )

  if (eventName && eventName === "SAVED") {
    e.preventDefault()
  }

  if (eventName) {
    state.send(eventName)
    e.preventDefault()
  }

  state.send("RELEASED_KEY", { key: e.key })
}

export const useSelector = createSelectorHook(state)

export default state

// state.onUpdate((s) => console.log(s.active, s.log[0]))
