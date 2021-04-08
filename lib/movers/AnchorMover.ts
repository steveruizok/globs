import { IAnchor, IData } from "lib/types"
import BaseMover from "./BaseMover"
import * as vec from "lib/vec"
import { screenToWorld } from "./mover-utils"
import { keys, pointer } from "lib/state"
import { getGlob } from "lib/utils"
import { commands } from "lib/history"

export interface AnchorMoverSnapshot {
  a: number
  b: number
  ap: number
  bp: number
}

export default class AnchorMover extends BaseMover {
  globId: string
  primary: IAnchor
  secondary: IAnchor
  snapshot: AnchorMoverSnapshot
  origin: number[]

  constructor(data: IData, globId: string, primary: IAnchor) {
    super()
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
    this.snapshot = AnchorMover.getSnapshot(data, globId)
    this.origin = screenToWorld(pointer.point, data.camera)
  }

  update(data: IData) {
    const { camera, nodes, globs } = data
    const glob = globs[this.globId]
    const {
      points: { E0, D, E1, E0p, Dp, E1p },
      nodes: [start, end],
    } = glob

    let next = screenToWorld(pointer.point, camera)
    let n: number

    if (this.primary === "a") {
      next = vec.nearestPointOnLine(E0, D, next)
      n = vec.dist(E0, next) / vec.dist(E0, D)
    } else if (this.primary === "b") {
      next = vec.nearestPointOnLine(E1, D, next)
      n = vec.dist(E1, next) / vec.dist(E1, D)
    } else if (this.primary === "ap") {
      next = vec.nearestPointOnLine(E0p, Dp, next)
      n = vec.dist(E0p, next) / vec.dist(E0p, Dp)
    } else if (this.primary === "bp") {
      next = vec.nearestPointOnLine(E1p, Dp, next)
      n = vec.dist(E1p, next) / vec.dist(E1p, Dp)
    }

    n = Math.round(n * 100) / 100

    // Round to midpoint
    if (!keys.Alt) {
      if (Math.abs(n - 0.5) < 0.025) {
        n = 0.5
      }
    }

    glob.options.a = this.snapshot.a
    glob.options.b = this.snapshot.b
    glob.options.ap = this.snapshot.ap
    glob.options.bp = this.snapshot.bp

    if (keys.Meta) {
      if (keys.Shift) {
        glob.options.a = n
        glob.options.b = n
        glob.options.ap = n
        glob.options.bp = n
      } else {
        glob.options[this.primary] = n
        glob.options[this.secondary] = n
      }
    } else {
      glob.options[this.primary] = n
    }

    glob.points = getGlob(
      nodes[start].point,
      nodes[start].radius,
      nodes[end].point,
      nodes[end].radius,
      glob.options.D,
      glob.options.Dp,
      glob.options.a,
      glob.options.b,
      glob.options.ap,
      glob.options.bp
    )
  }

  cancel(data: IData) {
    const glob = data.globs[this.globId]
    Object.assign(glob.options, this.snapshot)
  }

  complete(data: IData) {
    commands.moveAnchor(data, this.globId, this.snapshot)
  }
  static getSnapshot(data: IData, globId: string): AnchorMoverSnapshot {
    const glob = data.globs[globId]
    return {
      a: glob.options.a,
      b: glob.options.b,
      ap: glob.options.ap,
      bp: glob.options.bp,
    }
  }
}
