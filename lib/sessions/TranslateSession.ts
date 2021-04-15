import state, { mvPointer } from "lib/state"
import inputs from "lib/inputs"
import {
  IAnchor,
  IData,
  IHandle,
  ISelectionSnapshot,
  ITranslation,
} from "lib/types"
import * as vec from "lib/vec"
import BaseSession from "./BaseSession"
import {
  clamp,
  getSelectionSnapshot,
  round,
  screenToWorld,
  updateGlobPoints,
} from "lib/utils"
import { moveSelection } from "lib/commands"

function updatePosition(e: PointerEvent) {
  inputs.pointer.point[0] += e.movementX

  mvPointer.world.set(screenToWorld(inputs.pointer.point, state.data.camera))

  const width = window.innerWidth

  const screen = vec.add(mvPointer.screen.get(), [e.movementX, 0])

  screen[0] = (screen[0] + width) % width

  mvPointer.screen.set(screen)

  state.send("MOVED_POINTER_IN_TRANSLATE", {
    isPan: e.buttons === 4,
    shiftKey: e.shiftKey,
    optionKey: e.altKey,
    metaKey: e.metaKey || e.ctrlKey,
    ctrlKey: e.ctrlKey,
  })
}

function releasePointer() {
  document.exitPointerLock()
  state.send("STOPPED_POINTING")
}

export default class TranslateSession extends BaseSession {
  delta = [0, 0]
  origin: number[]
  snapshot: ISelectionSnapshot
  translation: ITranslation

  constructor(data: IData, translation: ITranslation) {
    super(data)
    this.origin = screenToWorld(inputs.pointer.point, data.camera)
    this.snapshot = getSelectionSnapshot(data)
    this.translation = translation

    document.body.requestPointerLock()
    document.addEventListener("pointermove", updatePosition, false)
    document.addEventListener("pointerup", releasePointer, false)
  }

  update = (data: IData) => {
    const { camera } = data

    this.delta = vec.vec(
      this.origin,
      screenToWorld(inputs.pointer.point, camera)
    )

    switch (this.translation.type) {
      case "anchor":
        TranslateSession.translateAnchor(
          data,
          this.delta,
          this.translation.anchor,
          this.snapshot
        )
        break
      case "handle":
        TranslateSession.translateHandleXY(
          data,
          this.delta,
          this.translation.handle,
          this.translation.axis,
          this.snapshot
        )
        break
      case "point":
        TranslateSession.translateXY(
          data,
          this.delta,
          this.translation.axis,
          this.snapshot
        )
        break
      case "radius":
        TranslateSession.translateRadius(data, this.delta, this.snapshot)
        break
    }
  }

  cancel = (data: IData) => {
    const { snapshot } = this
    const { nodes, globs, selectedNodes, selectedGlobs } = data

    for (let nodeId of selectedNodes) {
      nodes[nodeId].point = snapshot.nodes[nodeId].point
    }

    for (let globId of selectedGlobs) {
      globs[globId].D = snapshot.globs[globId].D
      globs[globId].Dp = snapshot.globs[globId].Dp
    }

    document.removeEventListener("pointermove", updatePosition, false)
    document.removeEventListener("pointerup", releasePointer, false)
  }

  complete = (data: IData) => {
    // Create a command
    moveSelection(data, this.delta, this.snapshot)

    document.removeEventListener("pointermove", updatePosition, false)
    document.removeEventListener("pointerup", releasePointer, false)
  }

  static getSnapshot(data: IData) {
    return getSelectionSnapshot(data)
  }

  static translateXY(
    data: IData,
    delta: number[],
    axis: "x" | "y",
    snapshot: ISelectionSnapshot
  ) {
    const { nodes, globs, selectedNodes, selectedGlobs } = data

    if (axis === "x") {
      delta[1] = 0
    } else {
      delta[1] = delta[0]
      delta[0] = 0
    }

    for (let nodeId of selectedNodes) {
      nodes[nodeId].point = vec.round(
        vec.add(snapshot.nodes[nodeId].point, delta)
      )
    }

    for (let globId of selectedGlobs) {
      globs[globId].D = vec.round(vec.add(snapshot.globs[globId].D, delta))
      globs[globId].Dp = vec.round(vec.add(snapshot.globs[globId].Dp, delta))
    }

    updateGlobPoints(data)
  }

  static translateHandleXY(
    data: IData,
    delta: number[],
    handle: IHandle,
    axis: "x" | "y",
    snapshot: ISelectionSnapshot
  ) {
    const { globs, selectedGlobs } = data

    if (axis === "x") {
      delta[1] = 0
    } else {
      delta[1] = delta[0]
      delta[0] = 0
    }

    for (let globId of selectedGlobs) {
      const sGlob = snapshot.globs[globId]
      globs[globId][handle] = vec.round(vec.add(sGlob[handle], delta))
    }

    updateGlobPoints(data)
  }

  static translateAnchor(
    data: IData,
    delta: number[],
    anchor: IAnchor,
    snapshot: ISelectionSnapshot
  ) {
    const { globs, selectedGlobs } = data

    for (let globId of selectedGlobs) {
      const sGlob = snapshot.globs[globId]
      let next = sGlob[anchor] + delta[0] / 100
      if (!inputs.keys.Meta && Math.abs(0.5 - next) < 0.025) next = 0.5
      globs[globId][anchor] = round(clamp(next, 0, 1))
    }

    updateGlobPoints(data)
  }

  static translateRadius(
    data: IData,
    delta: number[],
    snapshot: ISelectionSnapshot
  ) {
    const { nodes, selectedNodes } = data

    for (let nodeId of selectedNodes) {
      const sNode = snapshot.nodes[nodeId]
      nodes[nodeId].radius = round(clamp(sNode.radius + delta[0], 0))
    }

    updateGlobPoints(data)
  }
}
