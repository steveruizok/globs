import { IBounds, IData } from "lib/types"
import BaseSession from "./BaseSession"
import * as vec from "lib/vec"
import {
  getSelectionSnapshot,
  getSelectedBoundingBox,
  screenToWorld,
  updateGlobPoints,
} from "lib/utils"
import { keys, pointer } from "lib/state"
import { transformBounds } from "lib/commands"

export interface TransformSessionSnapshot {
  point: number[]
  bounds: IBounds
  nodes: Record<
    string,
    {
      id: string
      x: number
      y: number
      nx: number
      ny: number
      nmx: number
      nmy: number
      nw: number
      nh: number
      radius: number
    }
  >
  globs: Record<
    string,
    {
      D: {
        x: number
        y: number
        nx: number
        ny: number
        nmx: number
        nmy: number
      }
      Dp: {
        x: number
        y: number
        nx: number
        ny: number
        nmx: number
        nmy: number
      }
      a: number
      b: number
      ap: number
      bp: number
    }
  >
}

export interface TransformValues {
  x0: number
  y0: number
  x1: number
  y1: number
  mx: number
  my: number
  mw: number
  mh: number
}

export default class TransformSession extends BaseSession {
  type: "edge" | "corner"
  value: number
  snapshot: TransformSessionSnapshot
  current: TransformValues
  restore: ReturnType<typeof getSelectionSnapshot>

  constructor(data: IData, type: "edge" | "corner", value: number) {
    super(data)
    this.type = type
    this.snapshot = TransformSession.getSnapshot(data)
    this.value = value
    this.restore = getSelectionSnapshot(data)

    const { x: x0, y: y0, maxX: x1, maxY: y1 } = this.snapshot.bounds
    const { maxX: mx, maxY: my, width: mw, height: mh } = this.snapshot.bounds

    this.current = {
      x0,
      y0,
      x1,
      y1,
      mx,
      my,
      mw,
      mh,
    }
  }

  update = (data: IData) => {
    TransformSession.transformSelection(
      data,
      this.type,
      screenToWorld(pointer.point, data.camera),
      this.value,
      this.current,
      this.snapshot,
      keys.Shift
    )
    updateGlobPoints(data)
  }

  cancel = (data: IData) => {
    for (let id in this.restore.nodes) {
      const sNode = this.restore.nodes[id]
      const node = data.nodes[id]
      node.point = sNode.point
      node.radius = sNode.radius
    }

    for (let id in this.restore.globs) {
      const sGlob = this.restore.globs[id]
      const glob = data.globs[id]
      Object.assign(glob, sGlob)
    }

    updateGlobPoints(data)
  }

  complete = (data: IData) => {
    transformBounds(
      data,
      this.type,
      this.value,
      this.restore,
      this.snapshot,
      keys.Shift
    )
  }

  static transformSelection(
    data: IData,
    type: "corner" | "edge",
    point: number[],
    value: number,
    v: TransformValues,
    snapshot: TransformSessionSnapshot,
    preserveRadii: boolean
  ) {
    const nodes = data.selectedNodes.map((id) => data.nodes[id])
    const globs = data.selectedGlobs.map((id) => data.globs[id])
    const { nodes: sNodes, globs: sGlobs } = snapshot
    let [x, y] = point

    switch (value) {
      case 0: // Top Edge or Top-Left Corner
        v.y0 = y
        if (type === "corner") v.x0 = x
        break

      case 1: // Right Edge or Top-Right Corner
        v.x1 = x
        if (type === "corner") v.y0 = y
        break

      case 2: // Bottom Edge or Bottom-Right corner
        v.y1 = y
        if (type === "corner") v.x1 = x
        break

      case 3: // Left Edge or Bottom-Left Corner
        v.x0 = x
        if (type === "corner") v.y1 = y
        break
    }

    v.my = v.y0 < v.y1 ? v.y0 : v.y1
    v.mh = Math.abs(v.y1 - v.y0)
    v.mx = v.x0 < v.x1 ? v.x0 : v.x1
    v.mw = Math.abs(v.x1 - v.x0)

    for (let node of nodes) {
      const { nx, nmx, ny, nmy, nw, nh } = sNodes[node.id]
      node.point = vec.round([
        v.mx + (v.x1 < v.x0 ? nmx : nx) * v.mw,
        v.my + (v.y1 < v.y0 ? nmy : ny) * v.mh,
      ])
      if (!preserveRadii) {
        node.radius = (nw * v.mw + nh * v.mh) / 2
      } else {
        node.radius = sNodes[node.id].radius
      }
    }

    for (let glob of globs) {
      const { D, Dp, a, ap, b, bp } = sGlobs[glob.id]

      Object.assign(glob, {
        a: a,
        ap: ap,
        b: b,
        bp: bp,
      })

      if (v.x1 < v.x0 && v.y1 < v.y0) {
        Object.assign(glob, {
          D: [v.mx + D.nmx * v.mw, v.my + D.nmy * v.mh],
          Dp: [v.mx + Dp.nmx * v.mw, v.my + Dp.nmy * v.mh],
          a,
          ap,
          b,
          bp,
        })
      } else if (v.x1 < v.x0) {
        Object.assign(glob, {
          D: [v.mx + Dp.nmx * v.mw, v.my + Dp.ny * v.mh],
          Dp: [v.mx + D.nmx * v.mw, v.my + D.ny * v.mh],
          a: ap,
          ap: a,
          b: bp,
          bp: b,
        })
      } else if (v.y1 < v.y0) {
        Object.assign(glob, {
          D: [v.mx + Dp.nx * v.mw, v.my + Dp.nmy * v.mh],
          Dp: [v.mx + D.nx * v.mw, v.my + D.nmy * v.mh],
          a: ap,
          ap: a,
          b: bp,
          bp: b,
        })
      } else {
        Object.assign(glob, {
          D: [v.mx + D.nx * v.mw, v.my + D.ny * v.mh],
          Dp: [v.mx + Dp.nx * v.mw, v.my + Dp.ny * v.mh],
          a,
          ap,
          b,
          bp,
        })
      }
    }
  }

  static getSnapshot(data: IData): TransformSessionSnapshot {
    const bounds = getSelectedBoundingBox(data)

    const nodes = Object.fromEntries(
      data.selectedNodes.map((id) => {
        let {
          radius,
          point: [x, y],
        } = data.nodes[id]

        return [
          id,
          {
            id,
            x: x,
            y: y,
            nx: (x - bounds.x) / bounds.width,
            ny: (y - bounds.y) / bounds.height,
            nmx: 1 - (x - bounds.x) / bounds.width,
            nmy: 1 - (y - bounds.y) / bounds.height,
            nw: radius / bounds.width,
            nh: radius / bounds.height,
            radius,
          },
        ]
      })
    )

    const globs = Object.fromEntries(
      data.selectedGlobs.map((id) => {
        let {
          D: [dx, dy],
          Dp: [dpx, dpy],
          a,
          b,
          ap,
          bp,
        } = data.globs[id]

        return [
          id,
          {
            D: {
              x: dx,
              y: dy,
              nx: (dx - bounds.x) / bounds.width,
              ny: (dy - bounds.y) / bounds.height,
              nmx: 1 - (dx - bounds.x) / bounds.width,
              nmy: 1 - (dy - bounds.y) / bounds.height,
            },
            Dp: {
              x: dpx,
              y: dpy,
              nx: (dpx - bounds.x) / bounds.width,
              ny: (dpy - bounds.y) / bounds.height,
              nmx: 1 - (dpx - bounds.x) / bounds.width,
              nmy: 1 - (dpy - bounds.y) / bounds.height,
            },
            a,
            ap,
            b,
            bp,
          },
        ]
      })
    )

    return {
      point: screenToWorld(pointer.point, data.camera),
      bounds,
      nodes,
      globs,
    }
  }
}
