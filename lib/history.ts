import { IData } from "./types"

/* ------------------ Command Class ----------------- */

export type CommandFn<T> = (data: T, initial?: boolean) => void

export enum CommandType {
  ChangeBounds,
  CreateGlob,
  CreateNode,
  Delete,
  Split,
  Move,
  MoveAnchor,
  ReorderGlobs,
  ReorderNodes,
  Paste,
  ToggleCap,
  ToggleLocked,
  SetProperty,
  SetItems,
  Transform,
}

/**
 * A command makes changes to some applicate state. Every command has an "undo"
 * method to reverse its changes. The apps history is a series of commands.
 */
class BaseCommand<T extends any> {
  timestamp = Date.now()
  private undoFn: CommandFn<T>
  private doFn: CommandFn<T>
  protected restoreBeforeSelectionState: (data: T) => void
  protected restoreAfterSelectionState: (data: T) => void
  protected saveSelectionState: (data: T) => (data: T) => void
  protected manualSelection: boolean

  constructor(options: {
    type: CommandType
    do: CommandFn<T>
    undo: CommandFn<T>
    manualSelection?: boolean
  }) {
    this.doFn = options.do
    this.undoFn = options.undo
    this.manualSelection = options.manualSelection || false
    this.restoreBeforeSelectionState = () => () => {
      null
    }
    this.restoreAfterSelectionState = () => () => {
      null
    }
  }

  undo = (data: T) => {
    if (this.manualSelection) {
      this.undoFn(data)
      return
    }

    // We need to set the selection state to what it was before we after we did the command
    this.restoreAfterSelectionState(data)
    this.undoFn(data)
    this.restoreBeforeSelectionState(data)
  }

  redo = (data: T, initial = false) => {
    if (initial) {
      this.restoreBeforeSelectionState = this.saveSelectionState(data)
    } else {
      this.restoreBeforeSelectionState(data)
    }

    // We need to set the selection state to what it was before we did the command
    this.doFn(data, initial)

    if (initial) {
      this.restoreAfterSelectionState = this.saveSelectionState(data)
    }
  }
}

class BaseHistory<T> {
  private stack: BaseCommand<T>[] = []
  private pointer = -1
  private maxLength = 100
  private _enabled = true

  execute = (data: T, command: BaseCommand<T>) => {
    if (this.disabled) return
    this.stack = this.stack.slice(0, this.pointer + 1)
    this.stack.push(command)
    command.redo(data, true)
    this.pointer++

    if (this.stack.length > this.maxLength) {
      this.stack = this.stack.slice(this.stack.length - this.maxLength)
      this.pointer = this.maxLength - 1
    }

    this.save(data)
  }

  undo = (data: T) => {
    if (this.disabled) return
    if (this.pointer === -1) return
    const command = this.stack[this.pointer]
    command.undo(data)
    this.pointer--
    this.save(data)
  }

  redo = (data: T) => {
    if (this.disabled) return
    if (this.pointer === this.stack.length - 1) return
    const command = this.stack[this.pointer + 1]
    command.redo(data, false)
    this.pointer++
    this.save(data)
  }

  save = (data: T) => {
    if (typeof window === "undefined") return
    if (typeof localStorage === "undefined") return

    localStorage.setItem("glob_aldata_v6", JSON.stringify(data))
  }

  disable = () => {
    this._enabled = false
  }

  enable = () => {
    this._enabled = true
  }

  get disabled() {
    return !this._enabled
  }
}

/* ---------------- Project Specific ---------------- */

/**
 * A subclass of BaseCommand that sends events to our state. In our case, we want our actions
 * to mutate the state's data. Actions do not effect the "active states" in
 * the app.
 */
export class Command extends BaseCommand<IData> {
  saveSelectionState = (data: IData) => {
    const sSelectedNodes = [...data.selectedNodes]
    const sSelectedGlobs = [...data.selectedGlobs]

    return (data: IData) => {
      data.highlightNodes = []
      data.hoveredNodes = []
      data.highlightGlobs = []
      data.hoveredGlobs = []
      data.selectedNodes = sSelectedNodes
      data.selectedGlobs = sSelectedGlobs
    }
  }
}

export default new BaseHistory<IData>()
