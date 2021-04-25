import { IAnchor, IData } from "lib/types"
import BaseSession from "./BaseSession"
import * as vec from "lib/vec"
import inputs from "lib/inputs"
import { screenToWorld, getGlobPoints } from "lib/utils"
import { moveAnchor } from "lib/commands"

export interface AnchorSessionSnapshot {
  a: number
  b: number
  ap: number
  bp: number
}

export default class AnchorSession extends BaseSession {
  globId: string
  primary: IAnchor
  secondary: IAnchor
  snapshot: AnchorSessionSnapshot
  origin: number[]

  constructor(data: IData, globId: string, primary: IAnchor) {
    super(data)
    this.globId = globId
    this.primary = primary
    this.secondary =
      primary === "a"
        ? "b"
        : primary === "b"
        ? "a"
        : primary === "ap"
        ? "bp"
        : "ap"
    this.snapshot = AnchorSession.getSnapshot(data, globId)
    this.origin = screenToWorld(inputs.pointer.point, data.camera)
  }

  update = (data: IData) => {
    const { camera, nodes, globs } = data
    const glob = globs[this.globId]
    const {
      points: { E0, D, E1, E0p, Dp, E1p },
    } = glob

    let next = screenToWorld(inputs.pointer.point, camera)
    let n: number

    if (this.primary === "a") {
      next = vec.nearestPointOnLineSegment(E0, D, next)
      n = vec.dist(E0, next) / vec.dist(E0, D)
    } else if (this.primary === "b") {
      next = vec.nearestPointOnLineSegment(E1, D, next)
      n = vec.dist(E1, next) / vec.dist(E1, D)
    } else if (this.primary === "ap") {
      next = vec.nearestPointOnLineSegment(E0p, Dp, next)
      n = vec.dist(E0p, next) / vec.dist(E0p, Dp)
    } else if (this.primary === "bp") {
      next = vec.nearestPointOnLineSegment(E1p, Dp, next)
      n = vec.dist(E1p, next) / vec.dist(E1p, Dp)
    }

    n = Math.round(n * 100) / 100

    // Round to midpoint
    if (!inputs.keys.Alt) {
      if (Math.abs(n - 0.5) < 0.025) {
        n = 0.5
      }
    }

    glob.a = this.snapshot.a
    glob.b = this.snapshot.b
    glob.ap = this.snapshot.ap
    glob.bp = this.snapshot.bp

    if (inputs.keys.Meta) {
      if (inputs.modifiers.shiftKey) {
        glob.a = n
        glob.b = n
        glob.ap = n
        glob.bp = n
      } else {
        glob[this.primary] = n
        glob[this.secondary] = n
      }
    } else {
      glob[this.primary] = n
    }

    const [start, end] = glob.nodes.map((id) => nodes[id])
    glob.points = getGlobPoints(glob, start, end)
  }

  cancel = (data: IData) => {
    const glob = data.globs[this.globId]
    Object.assign(glob, this.snapshot)
  }

  complete = (data: IData) => {
    moveAnchor(data, this.globId, this.snapshot)
  }

  static getSnapshot(data: IData, globId: string): AnchorSessionSnapshot {
    const glob = data.globs[globId]
    return {
      a: glob.a,
      b: glob.b,
      ap: glob.ap,
      bp: glob.bp,
    }
  }
}
