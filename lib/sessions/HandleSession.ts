import { IData, IHandle, ISnapTypes, IGlob } from "lib/types"
import { moveHandle } from "lib/commands"
import * as vec from "lib/vec"
import { getSafeHandlePoint, isInView, screenToWorld } from "lib/utils"
import { getGlob, getGlobPoints, projectPoint } from "lib/utils"
import inputs from "lib/inputs"
import BaseSession from "./BaseSession"

export default class HandleSession extends BaseSession {
  globId: string
  primary: IHandle
  secondary: IHandle
  snaps: number[][]
  origin: number[]

  initial: {
    D: number[]
    Dp: number[]
  }

  current: {
    D: number[]
    Dp: number[]
  }

  constructor(data: IData, globId: string, primary: IHandle) {
    super(data)
    const glob = data.globs[globId]

    this.origin = screenToWorld(inputs.pointer.point, data.camera)
    this.globId = globId
    this.primary = primary
    this.secondary = primary === "D" ? "Dp" : "D"
    this.initial = {
      D: [...glob.D],
      Dp: [...glob.Dp],
    }
    this.current = {
      D: [...glob.D],
      Dp: [...glob.Dp],
    }

    this.snaps = HandleSession.getSnapPoints(data)
  }

  cancel = (data: IData) => {
    const glob = data.globs[this.globId]
    glob.D = this.initial.D
    glob.Dp = this.initial.Dp
    const [start, end] = glob.nodes.map((id) => data.nodes[id])
    data.snaps.active = []

    try {
      // Rebuild the glob points
      glob.points = getGlobPoints(glob, start, end)
    } catch (e) {
      glob.points = null
    }
  }

  complete = (data: IData) => {
    moveHandle(data, this.globId, this.initial, this.current)
  }

  update = (data: IData) => {
    const { camera, nodes, globs } = data

    const handle = this.initial[this.primary]
    const glob = globs[this.globId]
    const [start, end] = glob.nodes

    const delta = vec.vec(
      this.origin,
      screenToWorld(inputs.pointer.point, camera)
    )

    // TODO: Make sure that extra snaps don't get added. Once a snap has been found,
    // then any other snap must be compatible with the first one. For example, if a
    // handle can snap to a point in line with the handle on adjacent glob A, and
    // also can snap to a point in line with the handle on adjacent glob B, then the
    // final snap should be the intersection of those two lines.

    // Lock to initial axis
    if (inputs.modifiers.shiftKey) {
      if (inputs.pointer.axis === "x") {
        delta[1] = 0
      } else {
        delta[0] = 0
      }
    }

    let next = vec.add(handle, delta)

    // Snapping
    if (!inputs.keys.Alt) {
      next = this.findSnap(glob, next, data)
    }

    // Apply the change to the handle
    glob[this.primary] = vec.round(
      inputs.keys.Alt
        ? next
        : getSafeHandlePoint(nodes[start], nodes[end], next)
    )

    // Move the other handle, too.
    if (inputs.keys.Meta) {
      const nextSecondary = vec.add(
        this.initial[this.secondary],
        vec.sub(next, this.initial[this.primary])
      )

      glob[this.secondary] = inputs.keys.Alt
        ? nextSecondary
        : getSafeHandlePoint(nodes[start], nodes[end], nextSecondary)
    } else {
      glob[this.secondary] = this.initial[this.secondary]
    }

    try {
      glob.points = getGlob(
        nodes[start].point,
        nodes[start].radius,
        nodes[end].point,
        nodes[end].radius,
        glob.D,
        glob.Dp,
        glob.a,
        glob.b,
        glob.ap,
        glob.bp
      )
    } catch (e) {
      glob.points = null
    }

    this.current.D = [...glob.D]
    this.current.Dp = [...glob.Dp]
  }

  static getSnapPoints(data: IData) {
    const { nodes, globs } = data
    const snaps: number[][] = []

    for (const key in nodes) {
      const node = nodes[key]
      snaps.push([...node.point])
    }

    for (const key in globs) {
      const { D, Dp, points } = globs[key]

      snaps.push([...D], [...Dp])

      if (points) {
        snaps.push(
          projectPoint(D, vec.angle(D, points.E0), vec.dist(D, points.E0) * 2),
          projectPoint(
            Dp,
            vec.angle(Dp, points.E0p),
            vec.dist(Dp, points.E0p) * 2
          ),
          projectPoint(D, vec.angle(D, points.E1), vec.dist(D, points.E1) * 2),
          projectPoint(
            Dp,
            vec.angle(Dp, points.E1p),
            vec.dist(Dp, points.E1p) * 2
          )
        )
      }
    }

    return snaps
  }

  findSnap = (glob: IGlob, next: number[], data: IData) => {
    const { snaps, document, camera } = data

    snaps.active = []

    // Snap
    let snapd = 3,
      d = 0

    const [A0, A1] =
      this.primary === "D"
        ? [glob.points.E0, glob.points.E1]
        : [glob.points.E0p, glob.points.E1p]

    const mp = vec.med(A0, A1)
    const n = vec.uni(vec.vec(A0, A1))

    // Is the near the midpoint of its points?
    d = vec.dist(next, mp) * camera.zoom

    if (d < 5) {
      snapd = d
      next = mp

      snaps.active.push({
        type: ISnapTypes.HandleStraight,
        from: vec.sub(next, vec.mul(n, 32 / camera.zoom)),
        to: vec.add(next, vec.mul(n, 32 / camera.zoom)),
        n,
      })
    }

    // Is the handle near to the line between its points?
    const ptOnLine = vec.nearestPointOnLineThroughPoint(mp, n, next)

    d = vec.dist(ptOnLine, next) * camera.zoom
    if (d < snapd) {
      snapd = d
      next = ptOnLine

      snaps.active.push({
        type: ISnapTypes.HandleStraight,
        from: vec.sub(next, vec.mul(n, 64 / camera.zoom)),
        to: vec.add(next, vec.mul(n, 64 / camera.zoom)),
        n,
      })
    }

    // Is the handle near to the perpendicular of the line between its points?
    const ptOnPerLine = vec.nearestPointOnLineThroughPoint(mp, vec.per(n), next)

    d = vec.dist(ptOnPerLine, next) * camera.zoom
    if (d < snapd) {
      snapd = d
      next = ptOnPerLine

      snaps.active.push({
        type: ISnapTypes.Handle,
        from: next,
        to: mp,
      })
    }

    // Is the handle at a right triangle?
    const dd = vec.dist(A0, A1) / 2
    const md = vec.dist(next, mp)

    d = Math.abs(dd - md) * camera.zoom
    if (d < snapd) {
      snapd = d
      next = vec.add(mp, vec.mul(vec.vec(mp, next), dd / md))

      snaps.active.push({
        type: ISnapTypes.Handle,
        from: next,
        to: A0,
      })

      snaps.active.push({
        type: ISnapTypes.Handle,
        from: next,
        to: A1,
      })
    }

    for (const snapPoint of this.snaps) {
      d = vec.dist(next, snapPoint) * camera.zoom
      if (d < snapd) {
        snapd = d
        next = snapPoint
      }
    }

    for (const id of data.globIds) {
      if (data.globs[id].points === null) continue
      if (glob.id === id) continue

      const { E0: a, D: b, E1: c, E0p: ap, Dp: bp, E1p: cp } = data.globs[
        id
      ].points

      if (
        (isInView(a, document) || isInView(b, document)) &&
        Math.abs(vec.distanceToLineSegment(a, b, next, false) * camera.zoom) <
          snapd
      ) {
        next = vec.nearestPointOnLineSegment(a, b, next, false)
        snaps.active.push({
          type: ISnapTypes.Handle,
          from: next,
          to: vec.dist(next, a) > vec.dist(next, b) ? a : b,
        })
      }

      if (
        (isInView(b, document) || isInView(c, document)) &&
        Math.abs(vec.distanceToLineSegment(b, c, next, false) * camera.zoom) <
          snapd
      ) {
        next = vec.nearestPointOnLineSegment(b, c, next, false)
        snaps.active.push({
          type: ISnapTypes.Handle,
          from: next,
          to: vec.dist(next, b) > vec.dist(next, c) ? b : c,
        })
      }

      if (
        (isInView(ap, document) || isInView(bp, document)) &&
        Math.abs(vec.distanceToLineSegment(ap, bp, next, false) * camera.zoom) <
          snapd
      ) {
        next = vec.nearestPointOnLineSegment(ap, bp, next, false)
        snaps.active.push({
          type: ISnapTypes.Handle,
          from: next,
          to: vec.dist(next, ap) > vec.dist(next, bp) ? ap : bp,
        })
      }

      if (
        (isInView(bp, document) || isInView(cp, document)) &&
        Math.abs(vec.distanceToLineSegment(bp, cp, next, false) * camera.zoom) <
          snapd
      ) {
        next = vec.nearestPointOnLineSegment(bp, cp, next, false)
        snaps.active.push({
          type: ISnapTypes.Handle,
          from: next,
          to: vec.dist(next, bp) > vec.dist(next, cp) ? bp : cp,
        })
      }
    }

    snaps.active = snaps.active.map((snap) => ({ ...snap, from: next }))

    return next
  }
}
