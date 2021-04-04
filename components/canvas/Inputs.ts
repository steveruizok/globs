import { KeyCommand } from "lib/types"
import * as vec from "lib/vec"
import engine from "./Engine"

class Inputs {
  keys: Record<string, boolean> = {}
  pointer = {
    id: -1,
    type: "mouse",
    point: [0, 0],
    delta: [0, 0],
    origin: [0, 0],
    buttons: 0,
    points: new Set<number>(),
  }
  element: HTMLElement

  constructor() {}

  setup(element: HTMLElement) {
    this.element = element
    element.addEventListener("pointerleave", this.handlePointerLeave)
    element.addEventListener("pointermove", this.handlePointerMove)
    element.addEventListener("pointerdown", this.handlePointerDown)
    element.addEventListener("pointerup", this.handlePointerUp)
    element.addEventListener("keydown", this.handleKeyDown)
    element.addEventListener("keyup", this.handleKeyUp)
    element.addEventListener("wheel", this.handleWheel)
    window.addEventListener("resize", this.handleResize)
  }

  removeEvents() {
    const { element } = this
    element.removeEventListener("pointerleave", this.handlePointerLeave)
    element.removeEventListener("pointermove", this.handlePointerMove)
    element.removeEventListener("pointerdown", this.handlePointerDown)
    element.removeEventListener("pointerup", this.handlePointerUp)
    element.removeEventListener("keydown", this.handleKeyDown)
    element.removeEventListener("keyup", this.handleKeyUp)
    element.removeEventListener("wheel", this.handleWheel)
    window.removeEventListener("resize", this.handleResize)
  }

  handlePointerLeave = () => {
    const { keys } = this
    for (let id in keys) {
      keys[id] = false
    }

    engine.handlePointerLeave()
  }

  handlePointerDown = (e: PointerEvent) => {
    const { pointer } = this
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

    engine.handlePointerDown()
    // state.send("STARTED_POINTING")
  }

  handlePointerUp = (e: PointerEvent) => {
    const { pointer } = this
    pointer.points.delete(e.pointerId)

    if (e.pointerId !== pointer.id) return
    const x = e.clientX
    const y = e.clientY

    pointer.id = -1
    pointer.buttons = e.buttons
    pointer.delta = vec.sub([x, y], pointer.point)
    pointer.point = [x, y]

    document.body.style.cursor = "default"

    engine.handlePointerUp()
  }

  handlePointerMove = (e: PointerEvent) => {
    const { pointer } = this

    if (pointer.id > -1 && e.pointerId !== pointer.id) return
    const x = e.clientX
    const y = e.clientY

    pointer.buttons = e.buttons
    pointer.delta = vec.sub([x, y], pointer.point)
    pointer.point = [x, y]

    engine.handlePointerMove()
  }

  handleKeyDown = (e: KeyboardEvent) => {
    const { keys } = this
    keys[e.key] = true
    if (e.key in downCommands) {
      for (let { modifiers, eventName } of downCommands[e.key]) {
        if (modifiers.every((command) => keys[command])) {
          e.preventDefault()

          engine.handleEvent(eventName)
          break
        }
      }
    }

    engine.handleKeyDown(e.key)
  }

  handleKeyUp = (e: KeyboardEvent) => {
    const { keys } = this

    keys[e.key] = false
    if (e.key in upCommands) {
      for (let { modifiers, eventName } of upCommands[e.key]) {
        if (modifiers.every((command) => keys[command])) {
          e.preventDefault()
          engine.handleEvent(eventName)
          break
        }
      }
    }

    engine.handleKeyUp(e.key)
  }

  handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey) {
      engine.handleZoom(e.deltaY)
    } else {
      engine.handlePan([e.deltaX, e.deltaY])
    }
  }

  handleResize() {
    engine.handleResize()
  }
}

// Keyboard commands

const downCommands: Record<string, KeyCommand[]> = {
  z: [
    { eventName: "UNDID", modifiers: ["Meta"] },
    { eventName: "REDID", modifiers: ["Meta", "Shift"] },
  ],
  c: [
    {
      eventName: "COPIED",
      modifiers: ["Meta"],
    },
  ],
  v: [
    {
      eventName: "PASTED",
      modifiers: ["Meta"],
    },
  ],
  g: [
    {
      eventName: "STARTED_LINKING_NODES",
      modifiers: [],
    },
  ],
  l: [
    {
      eventName: "LOCKED_NODES",
      modifiers: ["Meta"],
    },
  ],
  n: [
    {
      eventName: "STARTED_CREATING_NODES",
      modifiers: [],
    },
  ],
  Option: [
    {
      eventName: "PRESSED_OPTION",
      modifiers: [],
    },
  ],
  Shift: [
    {
      eventName: "PRESSED_SHIFT",
      modifiers: [],
    },
  ],
  Alt: [
    {
      eventName: "PRESSED_ALT",
      modifiers: [],
    },
  ],
  Meta: [
    {
      eventName: "PRESSED_META",
      modifiers: [],
    },
  ],
  Escape: [
    {
      eventName: "CANCELLED",
      modifiers: [],
    },
  ],
  Enter: [
    {
      eventName: "CONFIRMED",
      modifiers: [],
    },
  ],
  Delete: [
    {
      eventName: "DELETED",
      modifiers: [],
    },
  ],
  Backspace: [
    {
      eventName: "DELETED",
      modifiers: [],
    },
  ],
  " ": [
    {
      eventName: "PRESSED_SPACE",
      modifiers: [],
    },
  ],
  "]": [
    {
      eventName: "MOVED_FORWARD",
      modifiers: ["Meta"],
    },
  ],
  "[": [
    {
      eventName: "MOVED_BACKWARD",
      modifiers: ["Meta"],
    },
  ],
  "‘": [
    {
      eventName: "MOVED_TO_FRONT",
      modifiers: ["Meta", "Shift"],
    },
  ],
  "“": [
    {
      eventName: "MOVED_TO_BACK",
      modifiers: ["Meta", "Shift"],
    },
  ],
}

const upCommands: Record<string, KeyCommand[]> = {
  " ": [
    {
      eventName: "RELEASED_SPACE",
      modifiers: [],
    },
  ],
  Option: [
    {
      eventName: "RELEASED_OPTION",
      modifiers: [],
    },
  ],
  Shift: [
    {
      eventName: "RELEASED_SHIFT",
      modifiers: [],
    },
  ],
  Alt: [
    {
      eventName: "RELEASED_ALT",
      modifiers: [],
    },
  ],
  Meta: [
    {
      eventName: "RELEASED_META",
      modifiers: [],
    },
  ],
}

export default new Inputs()
