import { IData, IHandle, ISnapTypes } from "lib/types"
import { commands } from "lib/history"
import * as vec from "lib/vec"
import { getSafeHandlePoint, isInView, screenToWorld } from "./session-utils"
import { getGlob, projectPoint } from "lib/utils"
import { keys, pointer } from "lib/state"
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

    this.origin = screenToWorld(pointer.point, data.camera)
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
      glob.points = getGlob(
        start.point,
        start.radius,
        end.point,
        end.radius,
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
  }

  complete = (data: IData) => {
    commands.moveHandle(data, this.globId, this.initial, this.current)
  }

  update = (data: IData) => {
    const { camera, nodes, globs, snaps, document } = data

    const handle = this.initial[this.primary]
    const glob = globs[this.globId]
    const [start, end] = glob.nodes
    snaps.active = []

    let delta = vec.vec(this.origin, screenToWorld(pointer.point, camera))

    // Lock to initial axis
    if (keys.Shift) {
      if (pointer.axis === "x") {
        delta[1] = 0
      } else {
        delta[0] = 0
      }
    }

    let next = vec.add(handle, delta)

    // Snapping
    if (!keys.Alt) {
      let d: number

      const [A0, A1] =
        this.primary === "D"
          ? [glob.points.E0, glob.points.E1]
          : [glob.points.E0p, glob.points.E1p]

      const mp = vec.med(A0, A1)
      const n = vec.uni(vec.vec(A0, A1))

      // Is the near the midpoint of its points?
      d = vec.dist(next, mp) * camera.zoom
      if (d < 5) {
        next = mp
        snaps.active.push({
          type: ISnapTypes.HandleStraight,
          from: vec.sub(next, vec.mul(n, 32 / camera.zoom)),
          to: vec.add(next, vec.mul(n, 32 / camera.zoom)),
          n,
        })
      }

      // Is the handle near to the line between its points?
      if (Math.abs(vec.distanceToLine(A0, A1, next) * camera.zoom) < 3) {
        next = vec.nearestPointOnLine(A0, A1, next, false)

        snaps.active.push({
          type: ISnapTypes.HandleStraight,
          from: vec.sub(next, vec.mul(n, 64 / camera.zoom)),
          to: vec.add(next, vec.mul(n, 64 / camera.zoom)),
          n,
        })
      }

      // Is the handle near the perpendicular of its points?
      const p0 = vec.sub(mp, vec.mul(vec.per(n), 100000))
      const p1 = vec.add(mp, vec.mul(vec.per(n), 100000))

      if (Math.abs(vec.distanceToLine(p0, p1, next) * camera.zoom) < 3) {
        next = vec.nearestPointOnLine(p0, p1, next, false)

        snaps.active.push({
          type: ISnapTypes.Handle,
          from: next,
          to: mp,
        })
      }

      // Is the handle at a right triangle?
      const dd = vec.dist(A0, A1) / 2
      const md = vec.dist(next, mp)

      if (Math.abs(dd - md) * camera.zoom < 3) {
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

      // Snap to other handles
      let snapd = 3,
        snapped = false

      for (let snap of this.snaps) {
        let d = vec.dist(next, snap) * camera.zoom
        if (d < snapd) {
          snapd = d
          next = snap
          snapped = true
        }
      }

      if (!snapped) {
        for (let id of data.globIds) {
          if (globs[id].points === null) continue

          const { E0: a, D: b, E1: c, E0p: ap, Dp: bp, E1p: cp } = globs[
            id
          ].points

          if (
            (isInView(a, document) || isInView(b, document)) &&
            Math.abs(vec.distanceToLine(a, b, next) * camera.zoom) < 3
          ) {
            next = vec.nearestPointOnLine(a, b, next, false)
            snaps.active.push({
              type: ISnapTypes.Handle,
              from: next,
              to: vec.dist(next, a) > vec.dist(next, b) ? a : b,
            })
          } else if (
            (isInView(b, document) || isInView(c, document)) &&
            Math.abs(vec.distanceToLine(b, c, next) * camera.zoom) < 3
          ) {
            next = vec.nearestPointOnLine(b, c, next, false)
            snaps.active.push({
              type: ISnapTypes.Handle,
              from: next,
              to: vec.dist(next, b) > vec.dist(next, c) ? b : c,
            })
          } else if (
            (isInView(ap, document) || isInView(bp, document)) &&
            Math.abs(vec.distanceToLine(ap, bp, next) * camera.zoom) < 3
          ) {
            next = vec.nearestPointOnLine(ap, bp, next, false)
            snaps.active.push({
              type: ISnapTypes.Handle,
              from: next,
              to: vec.dist(next, ap) > vec.dist(next, bp) ? ap : bp,
            })
          } else if (
            (isInView(bp, document) || isInView(cp, document)) &&
            Math.abs(vec.distanceToLine(bp, cp, next) * camera.zoom) < 3
          ) {
            next = vec.nearestPointOnLine(bp, cp, next, false)
            snaps.active.push({
              type: ISnapTypes.Handle,
              from: next,
              to: vec.dist(next, bp) > vec.dist(next, cp) ? bp : cp,
            })
          }
        }
      }

      // Apply the change to the handle
      glob[this.primary] = vec.round(
        getSafeHandlePoint(nodes[start], nodes[end], next)
      )

      // Move the other handle, too.
      if (keys.Meta) {
        glob[this.secondary] = getSafeHandlePoint(
          nodes[start],
          nodes[end],
          vec.add(
            this.initial[this.secondary],
            vec.sub(next, this.initial[this.primary])
          )
        )
      }
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

    for (let key in nodes) {
      const node = nodes[key]
      snaps.push([...node.point])
    }

    for (let key in globs) {
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
}
