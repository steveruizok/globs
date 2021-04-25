import { motionValue } from "framer-motion"
import { KeyCommand } from "types"
import state from "lib/state"
import * as vec from "lib/vec"

export const isDarwin = () =>
  /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)

export const isWindows = () => /^Win/.test(window.navigator.platform)

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
    ArrowLeft: [
      { eventName: "NUDGED_LEFT", modifiers: ["shiftKey"] },
      { eventName: "NUDGED_LEFT", modifiers: [] },
    ],
    ArrowRight: [
      { eventName: "NUDGED_RIGHT", modifiers: ["shiftKey"] },
      { eventName: "NUDGED_RIGHT", modifiers: [] },
    ],
    ArrowDown: [
      { eventName: "NUDGED_DOWN", modifiers: ["shiftKey"] },
      { eventName: "NUDGED_DOWN", modifiers: [] },
    ],
    ArrowUp: [
      { eventName: "NUDGED_UP", modifiers: ["shiftKey"] },
      { eventName: "NUDGED_UP", modifiers: [] },
    ],
    z: [
      { eventName: "REDO", modifiers: ["metaKey", "shiftKey"] },
      { eventName: "UNDO", modifiers: ["metaKey"] },
    ],
    a: [{ eventName: "SELECTED_ALL", modifiers: ["metaKey"] }],
    s: [{ eventName: "SAVED", modifiers: ["metaKey"] }],
    c: [
      { eventName: "EXPORTED", modifiers: ["shiftKey", "metaKey"] },
      { eventName: "COPIED", modifiers: ["metaKey"] },
    ],
    o: [{ eventName: "HARD_RESET", modifiers: ["shiftKey", "metaKey"] }],
    x: [{ eventName: "CUT", modifiers: ["metaKey"] }],
    v: [{ eventName: "PASTED", modifiers: ["metaKey"] }],
    g: [{ eventName: "STARTED_GLOBBING_NODES", modifiers: [] }],
    l: [{ eventName: "TOGGLED_LOCKED", modifiers: [] }],
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
    "]": [{ eventName: "MOVED_FORWARD", modifiers: ["metaKey"] }],
    "[": [{ eventName: "MOVED_BACKWARD", modifiers: ["metaKey"] }],
    "‘": [{ eventName: "MOVED_TO_FRONT", modifiers: ["metaKey", "shiftKey"] }],
    "“": [{ eventName: "MOVED_TO_BACK", modifiers: ["metaKey", "shiftKey"] }],
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

    const modifiers = {
      shiftKey: shiftKey,
      optionKey: altKey,
      ctrlKey: ctrlKey,
      metaKey: isDarwin() ? metaKey : ctrlKey,
    }

    Object.assign(this.modifiers, modifiers)
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

    const modifiers = {
      shiftKey: shiftKey,
      optionKey: altKey,
      ctrlKey: ctrlKey,
      metaKey: isDarwin() ? metaKey : ctrlKey,
    }

    Object.assign(this.modifiers, modifiers)
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

    const modifiers = {
      shiftKey: shiftKey,
      optionKey: altKey,
      ctrlKey: ctrlKey,
      metaKey: isDarwin() ? metaKey : ctrlKey,
    }

    Object.assign(this.modifiers, modifiers)
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

    const modifiers = {
      shiftKey: shiftKey,
      optionKey: altKey,
      ctrlKey: ctrlKey,
      metaKey: isDarwin() ? metaKey : ctrlKey,
    }

    Object.assign(this.modifiers, modifiers)
  }

  handleKeyDown = (
    key: string,
    shiftKey = false,
    altKey = false,
    ctrlKey = false,
    metaKey = false
  ) => {
    if (key === "Control" && !isDarwin()) key = "Meta"

    if (this.keys[key] && !["z", "c", "x", "v"].includes(key)) return

    this.keys[key] = true

    if (shiftKey && !this.modifiers.shiftKey) state.send("PRESSED_SHIFT")
    if (altKey && !this.modifiers.altKey) state.send("PRESSED_OPTION")
    if (ctrlKey && !this.modifiers.ctrlKey) state.send("PRESSED_CONTROL")
    if (metaKey && !this.modifiers.metaKey) state.send("PRESSED_META")

    const modifiers = {
      shiftKey: shiftKey,
      optionKey: altKey,
      ctrlKey: ctrlKey,
      metaKey: isDarwin() ? metaKey : ctrlKey,
    }

    Object.assign(this.modifiers, modifiers)

    if (key in this.downCommands) {
      for (const { modifiers, eventName } of this.downCommands[key]) {
        if (modifiers.every((command) => this.modifiers[command])) {
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
    if (key === "Control" && !isDarwin()) key = "Meta"

    this.keys[key] = false

    if (shiftKey && !this.modifiers.shiftKey) state.send("RELEASED_SHIFT")
    if (altKey && !this.modifiers.altKey) state.send("RELEASED_OPTION")
    if (ctrlKey && !this.modifiers.ctrlKey) state.send("RELEASED_CONTROL")
    if (metaKey && !this.modifiers.metaKey) state.send("RELEASED_META")

    const modifiers = {
      shiftKey: shiftKey,
      optionKey: altKey,
      ctrlKey: ctrlKey,
      metaKey: isDarwin() ? metaKey : ctrlKey,
    }

    Object.assign(this.modifiers, modifiers)

    if (key in this.upCommands) {
      for (const { modifiers, eventName } of this.upCommands[key]) {
        if (modifiers.every((command) => modifiers[command])) {
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
