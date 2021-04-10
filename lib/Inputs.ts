import { motionValue } from "framer-motion"
import { KeyCommand } from "types"
import * as vec from "lib/vec"

class Inputs {
  keys: Record<string, boolean>

  modifiers: Record<string, boolean>

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

  upCommands = {
    " ": [{ eventName: "RELEASED_SPACE", modifiers: [] }],
    Option: [{ eventName: "RELEASED_OPTION", modifiers: [] }],
    Shift: [{ eventName: "RELEASED_SHIFT", modifiers: [] }],
    Alt: [{ eventName: "RELEASED_ALT", modifiers: [] }],
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
    Object.assign(this.pointer, {
      id,
      type,
      buttons,
      direction: "any",
      origin: [x, y],
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
    this.keys[key] = true

    Object.assign(this.modifiers, {
      shiftKey: shiftKey,
      optionKey: altKey,
      ctrlKey: ctrlKey,
      metaKey: metaKey || ctrlKey,
    })
  }

  handleKeyUp = (
    key: string,
    shiftKey = false,
    altKey = false,
    ctrlKey = false,
    metaKey = false
  ) => {
    this.keys[key] = false

    Object.assign(this.modifiers, {
      shiftKey: shiftKey,
      optionKey: altKey,
      ctrlKey: ctrlKey,
      metaKey: metaKey || ctrlKey,
    })
  }
}

export default new Inputs()
