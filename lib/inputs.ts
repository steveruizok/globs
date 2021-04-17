import { motionValue } from "framer-motion"
import { KeyCommand } from "types"
import state from "lib/state"
import * as vec from "lib/vec"

export const isDarwin = /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)
export const isWindows = /^Win/.test(window.navigator.platform)

class Inputs {
  keys: Record<string, boolean> = {}

  modifiers: Record<string, boolean> = {}

  pointer = {
    id: -1,
    type: "mouse",
    point: [0, 0],
    delta: [0, 0],
    origin: [0, 0],
    buttons: 0,
    axis: "any" as "any" | "x" | "y",
    points: new Set<number>(),
  }

  mvPointer = {
    screen: motionValue([0, 0]),
    world: motionValue([0, 0]),
  }

  downCommands: Record<string, KeyCommand[]> = {
    z: [
      { eventName: "REDO", modifiers: ["Meta", "Shift"] },
      { eventName: "UNDO", modifiers: ["Meta"] },
    ],
    a: [{ eventName: "SELECTED_ALL", modifiers: ["Meta"] }],
    s: [{ eventName: "SAVED", modifiers: ["Meta"] }],
    c: [
      { eventName: "EXPORTED", modifiers: ["Shift", "Meta"] },
      { eventName: "COPIED", modifiers: ["Meta"] },
    ],
    x: [{ eventName: "CUT", modifiers: ["Meta"] }],
    v: [{ eventName: "PASTED", modifiers: ["Meta"] }],
    g: [{ eventName: "STARTED_GLOBBING_NODES", modifiers: [] }],
    l: [{ eventName: "LOCKED_NODES", modifiers: ["Meta"] }],
    n: [{ eventName: "STARTED_CREATING_NODES", modifiers: [] }],
    Shift: [{ eventName: "PRESSED_SHIFT", modifiers: [] }],
    Option: [{ eventName: "PRESSED_OPTION", modifiers: [] }],
    Alt: [{ eventName: "PRESSED_OPTION", modifiers: [] }],
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

  upCommands: Record<string, KeyCommand[]> = {
    " ": [{ eventName: "RELEASED_SPACE", modifiers: [] }],
    Shift: [{ eventName: "RELEASED_SHIFT", modifiers: [] }],
    Option: [{ eventName: "RELEASED_OPTION", modifiers: [] }],
    Alt: [{ eventName: "PRESSED_OPTION", modifiers: [] }],
    Meta: [{ eventName: "RELEASED_META", modifiers: [] }],
  }

  handlePointerDown = (
    x = 0,
    y = 0,
    id = 1,
    type = "mouse",
    buttons = 1,
    shiftKey = false,
    altKey = false,
    ctrlKey = false,
    metaKey = false
  ) => {
    Object.assign(this.pointer, {
      id,
      type,
      buttons,
      direction: "any",
      origin: [x, y],
      point: [x, y],
      delta: [0, 0],
    })

    Object.assign(this.modifiers, {
      shiftKey: shiftKey,
      optionKey: altKey,
      ctrlKey: ctrlKey,
      metaKey: metaKey || ctrlKey,
    })
  }

  handlePointerMove = (
    x = 0,
    y = 0,
    id = 1,
    type = "mouse",
    buttons = 1,
    shiftKey = false,
    altKey = false,
    ctrlKey = false,
    metaKey = false
  ) => {
    const ox = Math.abs(x - this.pointer.origin[0])
    const oy = Math.abs(y - this.pointer.origin[1])

    Object.assign(this.pointer, {
      id,
      type,
      buttons,
      direction: "any",
      point: [x, y],
      axis: ox > oy ? "x" : "y",
      delta: vec.sub([x, y], this.pointer.point),
    })

    Object.assign(this.modifiers, {
      shiftKey: shiftKey,
      optionKey: altKey,
      ctrlKey: ctrlKey,
      metaKey: metaKey || ctrlKey,
    })
  }

  handlePointerUp = (
    x = 0,
    y = 0,
    type = "mouse",
    buttons = 1,
    shiftKey = false,
    altKey = false,
    ctrlKey = false,
    metaKey = false
  ) => {
    Object.assign(this.pointer, {
      id: -1,
      type,
      buttons,
      direction: "any",
      point: [x, y],
      delta: vec.sub([x, y], this.pointer.point),
    })

    Object.assign(this.modifiers, {
      shiftKey: shiftKey,
      optionKey: altKey,
      ctrlKey: ctrlKey,
      metaKey: metaKey || ctrlKey,
    })
  }

  handlePointerCancel = (
    x = 0,
    y = 0,
    type = "mouse",
    buttons = 1,
    shiftKey = false,
    altKey = false,
    ctrlKey = false,
    metaKey = false
  ) => {
    Object.assign(this.pointer, {
      id: -1,
      type,
      buttons,
      direction: "any",
      point: [x, y],
      delta: vec.sub([x, y], this.pointer.point),
    })

    Object.assign(this.modifiers, {
      shiftKey: shiftKey,
      optionKey: altKey,
      ctrlKey: ctrlKey,
      metaKey: metaKey || ctrlKey,
    })
  }

  handleKeyDown = (
    key: string,
    shiftKey = false,
    altKey = false,
    ctrlKey = false,
    metaKey = false
  ) => {
    if (key === "Control" && !isDarwin) key = "Meta"

    if (this.keys[key] && !["z", "c", "x", "v"].includes(key)) return

    this.keys[key] = true

    Object.assign(this.modifiers, {
      shiftKey: shiftKey,
      optionKey: altKey,
      ctrlKey: ctrlKey,
      metaKey: metaKey || ctrlKey,
    })

    if (key in this.downCommands) {
      for (let { modifiers, eventName } of this.downCommands[key]) {
        if (modifiers.every((command) => this.keys[command])) {
          return eventName
        }
      }
    }

    return false
  }

  handleKeyUp = (
    key: string,
    shiftKey = false,
    altKey = false,
    ctrlKey = false,
    metaKey = false
  ) => {
    if (key === "Control" && !isDarwin) key = "Meta"

    this.keys[key] = false

    Object.assign(this.modifiers, {
      shiftKey: shiftKey,
      optionKey: altKey,
      ctrlKey: ctrlKey,
      metaKey: metaKey || ctrlKey,
    })

    if (key in this.upCommands) {
      for (let { modifiers, eventName } of this.upCommands[key]) {
        if (modifiers.every((command) => this.keys[command])) {
          return eventName
        }
      }
    }

    return false
  }

  handleWindowBlur = () => {
    this.keys = {}
    this.pointer.id = -1
    this.pointer.buttons = 0
    this.pointer.points.clear()
  }

  handleThumbstickMove = (x: number, y: number) => {
    this.pointer.delta = [x, y]
    this.pointer.point = vec.add(this.pointer.point, [x, y])
    const ox = Math.abs(this.pointer[0] - this.pointer.origin[0])
    const oy = Math.abs(this.pointer[1] - this.pointer.origin[1])
    this.pointer.axis = ox > oy ? "x" : "y"
  }
}

export default new Inputs()
