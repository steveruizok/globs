import { motionValue } from "framer-motion"
import { createState, createSelectorHook } from "@state-designer/react"
import * as vec from "lib/vec"

import { initialData } from "./data"
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
} from "lib/types"
import { getSelectedBoundingBox, screenToWorld, throttle } from "utils"
import { roundBounds } from "./bounds-utils"
import migrate from "./migrations"
import clipboard from "./clipboard"
import { MutableRefObject } from "react"
import BrushSession from "./sessions/BrushSession"

export const elms: Record<string, MutableRefObject<SVGElement>> = {}

const state = createState({
  data: initialData,
  onEnter: "setup",
  on: {
    MOUNTED_ELEMENT: { secretlyDo: "mountElement" },
    UNMOUNTED_ELEMENT: { secretlyDo: "deleteElement" },
    UNMOUNTED: { do: "teardown", to: "loading" },
  },
  initial: "loading",
  states: {
    loading: {
      on: {
        MOUNTED: { do: ["setup", "setViewport"], to: "ready" },
      },
    },
    ready: {
      on: {
        UNMOUNTED: { do: "teardown", to: "loading" },
        EXPORTED: "copySvgToClipboard",
        RESIZED: "setViewport",
        PRESSED_SPACE: "toggleFill",
        RELEASED_SPACE: "toggleFill",
        TOGGLED_FILL: "toggleFill",
        WHEELED: {
          ifAny: ["hasShift", "isTrackpadZoom"],
          do: ["zoomCamera", "updateMvPointer"],
          else: ["wheelPanCamera", "updateMvPointer"],
        },
        MOVED_POINTER: [
          { secretlyDo: "updateMvPointer" },
          { if: "hasMiddleButton", do: "panCamera" },
        ],
        STARTED_MOVING_THUMBSTICK: {
          to: "draggingThumbstick",
        },
        ZOOMED_TO_FIT: "zoomToFit",
        COPIED: "copyToClipboard",
        CUT: ["copyToClipboard", "deleteSelection", "saveData"],
        PASTED: ["startPasteFromClipboard", "saveData"],
        FINISHED_PASTE: "finishPasteFromClipboard",
      },
      initial: "selecting",
      states: {
        selecting: {
          initial: "notPointing",
          states: {
            notPointing: {
              onEnter: { do: "clearPointingId" },
              repeat: {
                onRepeat: "saveData",
                delay: 5,
              },
              on: {
                UNDO: "undo",
                REDO: "redo",
                CANCELLED: "clearSelection",
                DELETED: ["deleteSelection", "saveData"],
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
                SET_NODES_X: "setPointingToSelectedNodessPointX",
                SET_NODES_Y: "setPointingToSelectedNodessPointY",
                SET_NODES_RADIUS: "setPointingToSelectedNodessRadius",
                SET_NODES_CAP: "setPointingToSelectedNodessCap",
                SET_NODES_LOCKED: "setPointingToSelectedNodessLocked",
                TOGGLED_NODE_LOCKED: "toggleNodeLocked",
                SET_GLOB_OPTIONS: "setPointingToSelectedGlobsOptions",
                CHANGED_BOUNDS_X: "changeBoundsX",
                CHANGED_BOUNDS_Y: "changeBoundsY",
                CHANGED_BOUNDS_WIDTH: "changeBoundsWidth",
                CHANGED_BOUNDS_HEIGHT: "changeBoundsHeight",
                HARD_RESET: ["hardReset", "saveData"],
                SELECTED_ALL: "selectAll",
                LOCKED_NODES: "lockSelectedNodes",
                GENERATED_ITEMS: "refreshGeneratedItems",
                POINTED_NODE: [
                  { unless: "isLeftClick", break: true },
                  "setPointingId",
                  {
                    if: "nodeIsHovered",
                    to: "pointingNode",
                    else: {
                      if: "hasShift",
                      then: {
                        if: "pointingIsSelectedNode",
                        do: "pullPointingFromSelectedNodes",
                        else: "pushPointingToSelectedNodes",
                      },
                      else: "setPointingToSelectedNodes",
                    },
                  },
                ],
                POINTED_GLOB: [
                  { unless: "isLeftClick", break: true },
                  "setPointingId",
                  {
                    if: ["globIsHovered", "pointingIsSelectedGlob", "hasMeta"],
                    to: "splittingGlob",
                  },
                  {
                    if: "globIsHovered",
                    to: "pointingGlob",
                    else: {
                      if: "hasShift",
                      then: {
                        if: "pointingIsSelectedGlob",
                        do: "pullPointingFromSelectedGlobs",
                        else: "pushPointingToSelectedGlobs",
                      },
                      else: "setPointingToSelectedGlobs",
                    },
                  },
                ],
                POINTED_CANVAS: [
                  { unless: "isLeftClick", break: true },
                  { to: "pointingCanvas" },
                ],
                POINTED_ANCHOR: [
                  {
                    if: "isLeftClick",
                    do: "setPointingId",
                    to: "pointingAnchor",
                  },
                ],
                POINTED_HANDLE: {
                  if: "isLeftClick",
                  do: "setPointingId",
                  to: "pointingHandle",
                },
                POINTED_BOUNDS: [
                  {
                    if: ["hasMeta", "isLeftClick"],
                    to: "brushSelecting",
                  },
                  {
                    if: "isLeftClick",
                    to: "draggingSelection",
                  },
                ],
                POINTED_BOUNDS_EDGE: {
                  if: "isLeftClick",
                  to: "edgeResizing",
                },
                POINTED_BOUNDS_CORNER: {
                  if: "isLeftClick",
                  to: "cornerResizing",
                },
                POINTED_ROTATE_CORNER: {
                  if: "isLeftClick",
                  to: "cornerRotating",
                },
                STARTED_TRANSLATING: {
                  to: "translating",
                },
                STARTED_CREATING_NODES: {
                  to: "creatingNodes",
                },
                PRESSED_TOOLBAR_BUTTON_GLOBBING_NODES: {
                  if: "hasSelectedNodes",
                  to: "globbingNodes",
                  else: {
                    to: "creatingNodes.glob",
                  },
                },
                STARTED_GLOBBING_NODES: {
                  if: "hasSelectedNodes",
                  to: "globbingNodes",
                  else: {
                    to: "creatingNodes.glob",
                  },
                },
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
            pointingCanvas: {
              onEnter: { unless: "hasShift", do: "clearSelection" },
              on: {
                MOVED_POINTER: {
                  if: "distanceImpliesDrag",
                  to: "brushSelecting",
                },
                STOPPED_POINTING: {
                  to: "notPointing",
                },
              },
            },
            draggingSelection: {
              onExit: ["clearSnaps"],
              onEnter: "beginMove",
              on: {
                CANCELLED: { do: "cancelMove", to: "notPointing" },
                WHEELED: "updateMove",
                PRESSED_OPTION: "updateMove",
                RELEASED_OPTION: "updateMove",
                MOVED_POINTER: "updateMove",
                STOPPED_POINTING: {
                  do: ["completeMove", "saveData"],
                  to: "notPointing",
                },
              },
            },
            draggingThumbstick: {
              onEnter: "beginMove",
              on: {
                MOVED_THUMBSTICK: {
                  if: "hasSelection",
                  do: "updateMove",
                  else: "panCamera",
                },
                STOPPED_MOVING_THUMBSTICK: {
                  do: ["completeMove", "saveData"],
                  to: "notPointing",
                },
              },
            },
            pointingGlob: {
              initial: "maybeSelecting",
              states: {
                maybeSelecting: {
                  onEnter: [
                    {
                      if: ["hasBoundsSelection", "pointingIsSelectedGlob"],
                      to: "pointingGlobInBounds",
                    },
                    {
                      if: "hasShift",
                      then: {
                        if: "pointingIsSelectedGlob",
                        do: "pullPointingFromSelectedGlobs",
                        else: "pushPointingToSelectedGlobs",
                      },
                      else: "setPointingToSelectedGlobs",
                    },
                    {
                      to: "pointingSelectedGlob",
                    },
                  ],
                },
                pointingSelectedGlob: {
                  on: {
                    MOVED_POINTER: {
                      if: "distanceImpliesDrag",
                      to: "draggingSelection",
                    },
                    STOPPED_POINTING: { to: "notPointing" },
                  },
                },
                pointingGlobInBounds: {
                  on: {
                    MOVED_POINTER: {
                      if: "distanceImpliesDrag",
                      to: "draggingSelection",
                    },
                    STOPPED_POINTING: [
                      {
                        if: "hasShift",
                        then: "pullPointingFromSelectedGlobs",
                        else: "setPointingToSelectedGlobs",
                      },
                      { to: "notPointing" },
                    ],
                  },
                },
              },
            },
            pointingNode: {
              initial: "maybeSelecting",
              states: {
                maybeSelecting: {
                  onEnter: [
                    {
                      if: "pointingIsSelectedNode",
                      to: "pointingNodeInBounds",
                    },
                    {
                      if: "hasShift",
                      then: {
                        if: "pointingIsSelectedNode",
                        do: "pullPointingFromSelectedNodes",
                        else: "pushPointingToSelectedNodes",
                      },
                      else: "setPointingToSelectedNodes",
                    },
                    {
                      if: ["hasOneSelectedNode", "hasMeta"],
                      to: "changingRadius",
                      else: {
                        to: "pointingSelectedNode",
                      },
                    },
                  ],
                },

                // Possibly combine with pointingNodeInBounds
                pointingSelectedNode: {
                  on: {
                    STOPPED_POINTING: { to: "notPointing" },
                    PRESSED_META: { to: "changingRadius" },
                    MOVED_POINTER: {
                      if: "distanceImpliesDrag",
                      to: "draggingSelection",
                    },
                  },
                },

                pointingNodeInBounds: {
                  onEnter: {
                    if: "hasMeta",
                    to: "resizingAllNodesInBounds",
                  },
                  on: {
                    MOVED_POINTER: {
                      if: "distanceImpliesDrag",
                      to: "draggingSelection",
                    },
                    PRESSED_META: {
                      if: "hasOneSelectedNode",
                      to: "resizingAllNodesInBounds",
                    },
                    STOPPED_POINTING: [
                      {
                        if: "hasShift",
                        then: {
                          if: "pointingIsSelectedNode",
                          do: "pullPointingFromSelectedNodes",
                          else: "pushPointingToSelectedNodes",
                        },
                        else: "setPointingToSelectedNodes",
                      },
                      { to: "notPointing" },
                    ],
                  },
                },
                changingRadius: {
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
                      do: ["completeRadiusMove", "saveData"],
                      to: "notPointing",
                    },
                  },
                },
                resizingAllNodesInBounds: {
                  onEnter: "beginRadiusMove",
                  on: {
                    PRESSED_SHIFT: "updateRadiusMove",
                    RELEASED_SHIFT: "updateRadiusMove",
                    PRESSED_OPTION: "updateRadiusMove",
                    RELEASED_OPTION: "updateRadiusMove",
                    RELEASED_META: {
                      do: "completeRadiusMove",
                      to: "draggingSelection",
                    },
                    MOVED_POINTER: "updateRadiusMove",
                    STOPPED_POINTING: {
                      do: ["completeRadiusMove", "saveData"],
                      to: "notPointing",
                    },
                  },
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
                WHEELED: ["updateHandleMove"],
                MOVED_POINTER: "updateHandleMove",
                CANCELLED: { do: "cancelHandleMove", to: "notPointing" },
                STOPPED_POINTING: {
                  do: ["completeHandleMove", "saveData"],
                  to: "notPointing",
                },
              },
            },
            pointingAnchor: {
              onEnter: ["beginAnchorMove", "setPointingToSelectedGlobs"],
              onExit: ["clearSnaps"],
              on: {
                WHEELED: "updateAnchorMove",
                MOVED_POINTER: "updateAnchorMove",
                CANCELLED: { do: "cancelAnchorMove", to: "notPointing" },
                STOPPED_POINTING: {
                  do: ["completeAnchorMove", "saveData"],
                  to: "notPointing",
                },
              },
            },
            brushSelecting: {
              onEnter: "startBrush",
              on: {
                HOVERED_GLOB: "pushHoveredGlob",
                UNHOVERED_GLOB: "pullHoveredGlob",
                HOVERED_NODE: "pushHoveredNode",
                UNHOVERED_NODE: "pullHoveredNode",
                MOVED_POINTER: "updateBrush",
                WHEELED: "updateBrush",
                STOPPED_POINTING: { do: "completeBrush", to: "notPointing" },
                POINTED_CANVAS: { do: "cancelBrush", to: "notPointing" },
                CANCELLED: { do: "cancelBrush", to: "notPointing" },
              },
            },
            edgeResizing: {
              onEnter: ["beginEdgeTransform"],
              on: {
                MOVED_POINTER: "updateTransform",
                WHEELED: "updateTransform",
                STOPPED_POINTING: {
                  do: ["completeTransform", "saveData"],
                  to: "notPointing",
                },
                CANCELLED: { do: "cancelTransform", to: "notPointing" },
              },
            },
            cornerResizing: {
              onEnter: ["beginCornerTransform"],
              on: {
                MOVED_POINTER: ["updateTransform"],
                WHEELED: ["updateTransform"],
                STOPPED_POINTING: {
                  do: ["completeTransform", "saveData"],
                  to: "notPointing",
                },
                CANCELLED: { do: "cancelTransform", to: "notPointing" },
              },
            },
            cornerRotating: {
              onEnter: "beginRotate",
              on: {
                MOVED_POINTER: "updateRotate",
                WHEELED: "updateRotate",
                STOPPED_POINTING: {
                  do: ["completeRotate", "saveData"],
                  to: "notPointing",
                },
                CANCELLED: { do: "cancelRotate", to: "notPointing" },
              },
            },
          },
        },
        creatingNodes: {
          on: {
            STARTED_CREATING_NODES: {
              to: "selecting",
            },
            STARTED_GLOBBING_NODES: {
              if: "hasSelectedNodes",
              to: "globbingNodes",
            },
            CANCELLED: { to: "selecting" },
          },
          initial: "node",
          states: {
            node: {
              on: {
                POINTED_CANVAS: [
                  "createNode",
                  "saveData",
                  {
                    to: "selecting",
                  },
                ],
              },
            },
            glob: {
              on: {
                POINTED_CANVAS: [
                  "createNode",
                  "saveData",
                  {
                    to: "globbingNodes",
                  },
                ],
              },
            },
          },
        },
        globbingNodes: {
          on: {
            CANCELLED: { to: "selecting" },
            PRESSED_TOOLBAR_BUTTON_GLOBBING_NODES: {
              to: "selecting",
            },
            STARTED_CREATING_NODES: {
              to: "creatingNodes",
            },
            POINTED_CANVAS: {
              do: ["createGlobToNewNode", "saveData"],
              to: "selecting",
            },
            POINTED_NODE: [
              "createGlobBetweenNodes",
              "saveData",
              {
                to: "selecting",
              },
            ],
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
    nodeIsHovered(data, payload: { id: string }) {
      return data.hoveredNodes.includes(payload.id)
    },
    pointingIsSelectedNode(data) {
      return data.selectedNodes.includes(data.pointingId)
    },
    pointingIsSelectedGlob(data) {
      return data.selectedGlobs.includes(data.pointingId)
    },
    hasOneSelectedNode(data) {
      return data.selectedNodes.length === 1
    },
    hasSelectedNodes(data) {
      return data.selectedNodes.length > 0
    },
    hasSelectedGlobs(data) {
      return data.selectedGlobs.length > 0
    },
    globIsHovered(data, payload: { id: string }) {
      return data.hoveredGlobs.includes(payload.id)
    },
    globIsSelected(data, payload: { id: string }) {
      return data.selectedGlobs.includes(payload.id)
    },
    isTrackpadZoom(_, payload: { ctrlKey: boolean }) {
      return inputs.keys.Alt || payload.ctrlKey
    },
    isScaleZoom(_, payload: { scale: number }) {
      return payload.scale !== undefined
    },
    hasMiddleButton(_, payload: { isPan: boolean }) {
      return payload.isPan
    },
    isLeftClick() {
      return inputs.pointer.buttons === 1
    },
    hasMeta() {
      return inputs.keys.Meta
    },
    hasShift() {
      return inputs.keys.Shift
    },
    hasSpace() {
      return inputs.keys[" "]
    },
    isMultitouch() {
      return inputs.pointer.points.size > 1
    },
  },
  actions: {
    copySvgToClipboard(data) {
      exports.copyToSvg(data, elms)
    },

    // CODE GENERATED ITEMS
    refreshGeneratedItems(
      data,
      payload: { nodes: Record<string, INode>; globs: Record<string, IGlob> }
    ) {
      commands.refreshGeneratedItems(data, payload)
    },

    // CLIPBOARD
    copyToClipboard(data) {
      clipboard.copy(data)
    },
    startPasteFromClipboard() {
      clipboard.startPaste()
    },
    finishPasteFromClipboard(data, copied) {
      clipboard.finishPaste(data, copied)
    },

    // HISTORY
    undo(data) {
      history.undo(data)
    },
    redo(data) {
      history.redo(data)
    },

    // ELEMENT REFERENCES
    mountElement(
      data,
      payload: { id: string; elm: MutableRefObject<SVGElement> }
    ) {
      elms[payload.id] = payload.elm
    },
    deleteElement(data, payload: { id: string }) {
      delete elms[payload.id]
    },

    // POINTER
    updateMvPointer(data) {
      mvPointer.screen.set(inputs.pointer.point)
      mvPointer.world.set(screenToWorld(inputs.pointer.point, data.camera))
    },

    // DISPLAY
    enableFill(data) {
      data.fill = true
    },
    disableFill(data) {
      data.fill = false
    },
    toggleFill(data) {
      data.fill = !data.fill
    },

    // CAMERA / VIEWPORT
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
    zoomCamera(data, payload: { delta: number[] }) {
      const { camera, viewport, document } = data
      const { point } = inputs.pointer

      const delta =
        (vec.mul(vec.neg(payload.delta), 5)[1] / 500) *
        Math.max(0.1, camera.zoom)

      const pt0 = vec.add(vec.div(point, camera.zoom), camera.point)

      camera.zoom = Math.max(Math.min(camera.zoom + delta, 10), 0.01)
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

    // SELECTION / HOVERS / HIGHLIGHTS

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
    setPointingId(data, payload: { id: string }) {
      data.pointingId = payload.id
    },
    clearPointingId(data) {
      data.pointingId = undefined
    },
    deleteSelection(data) {
      commands.deleteSelection(data)
    },
    selectAll(data) {
      data.selectedGlobs = [...data.globIds]
      data.selectedNodes = [...data.nodeIds]
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
    // highlights
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
    setHoveredNode(data) {
      data.hoveredNodes = []
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
    setHoveredGlobs(data, payload: { ids: string[] }) {
      data.hoveredGlobs = payload.ids
      data.highlightGlobs = []
    },
    setHoveredGlob(data, payload: { id: string }) {
      data.hoveredGlobs = [payload.id]
      data.highlightGlobs = []
    },
    clearHovers(data) {
      data.hoveredGlobs = []
      data.hoveredNodes = []
    },

    // NODES
    createNode(data) {
      commands.createNode(data)
    },
    lockSelectedNodes(data) {
      commands.toggleSelectionLocked(data)
    },
    toggleNodeCap(data, payload: { id: string }) {
      commands.toggleNodeCap(data, payload.id)
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
    // TODO: Make a command
    toggleNodeLocked(data, payload: { id: string }) {
      data.nodes[payload.id].locked = !data.nodes[payload.id].locked
    },

    // GLOBS
    setPointingToSelectedGlobsOptions(data, payload: Partial<IGlob>) {
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

    // HANDLES
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
    setSelectedHandle(data, payload: { id: string; handle: IHandle }) {
      data.selectedHandle = payload
    },
    clearSelectedHandle(data) {
      data.selectedHandle = undefined
    },

    // ANCHORS
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

    // Dragging
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
    // Translations (single properties)
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
    // Moving bounds (single properties)
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
    // Edge / Corner Transforms
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

    // DATA
    saveData(data) {
      if (typeof window === "undefined") return
      if (typeof localStorage === "undefined") return
      localStorage.setItem("glob_aldata_v6", JSON.stringify(data))
    },

    // EVENTS
    setup(data) {
      if (typeof window === "undefined") return
      if (typeof localStorage === "undefined") return
      const saved = localStorage.getItem("glob_aldata_v6")
      if (saved) {
        Object.assign(data, migrate(JSON.parse(saved)))
      }

      data.selectedNodes = []
      data.selectedGlobs = []
      data.highlightGlobs = []
      data.highlightNodes = []
      data.hoveredNodes = []
      data.hoveredGlobs = []
      data.snaps.active = []
      // data.generated.nodeIds = []
      // data.generated.globIds = []
      data.fill = false

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
    teardown() {
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

export const isDarwin = /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)
export const isWindows = /^Win/.test(window.navigator.platform)

export const mvPointer = {
  screen: motionValue([0, 0]),
  world: motionValue([0, 0]),
}

// export const pointer = {
//   id: -1,
//   type: "mouse",
//   point: [0, 0],
//   delta: [0, 0],
//   origin: [0, 0],
//   buttons: 0,
//   axis: "any" as "any" | "x" | "y",
//   points: new Set<number>(),
// }

// export const keys: Record<string, boolean> = {}

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
}

function handleKeyUp(e: KeyboardEvent) {
  const eventName = inputs.handleKeyUp(
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

  state.send("RELEASED_KEY", { key: e.key })
}

export const useSelector = createSelectorHook(state)
export default state

// state.onUpdate((s) => console.log(s.active, s.log[0]))
