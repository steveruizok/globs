import { IBounds, IData } from "lib/types"
import BaseSession from "./BaseSession"
import * as vec from "lib/vec"
import {
  getPositionSnapshot,
  getSelectedBoundingBox,
  screenToWorld,
  updateGlobPoints,
} from "./session-utils"
import { keys, pointer } from "lib/state"
import { commands } from "lib/history"
import { angleDelta, rotatePoint } from "lib/utils"

export default class RotateSession extends BaseSession {
  snapshot: ReturnType<typeof getPositionSnapshot>
  center: number[]
  angle: number

  constructor(data: IData) {
    super(data)
    this.snapshot = getPositionSnapshot(data)
    const bounds = getSelectedBoundingBox(data)
    const point = screenToWorld(pointer.point, data.camera)
    this.center = [bounds.x + bounds.width / 2, bounds.y + bounds.height / 2]
    this.angle = vec.angle(point, this.center)
  }

  update = (data: IData) => {
    RotateSession.rotate(data, this.center, this.angle, this.snapshot)
    updateGlobPoints(data)
  }

  cancel = (data: IData) => {
    for (let id in this.snapshot.nodes) {
      const sNode = this.snapshot.nodes[id]
      const node = data.nodes[id]
      node.point = sNode.point
      node.radius = sNode.radius
    }

    for (let id in this.snapshot.globs) {
      const sGlob = this.snapshot.globs[id]
      const glob = data.globs[id]
      Object.assign(glob, sGlob)
    }

    updateGlobPoints(data)
  }

  complete = (data: IData) => {
    commands.rotateSelection(data, this.center, this.angle, this.snapshot)
  }

  static rotate(
    data: IData,
    center: number[],
    angle: number,
    snapshots: ReturnType<typeof getPositionSnapshot>
  ) {
    const point = screenToWorld(pointer.point, data.camera)
    const delta = angleDelta(angle, vec.angle(point, center))

    console.log(delta)

    for (let nodeId of data.selectedNodes) {
      const snap = snapshots.nodes[nodeId]
      data.nodes[nodeId].point = rotatePoint(snap.point, center, delta)
    }

    for (let globId of data.selectedGlobs) {
      const snap = snapshots.globs[globId]
      Object.assign(data.globs[globId], {
        D: rotatePoint(snap.D, center, delta),
        Dp: rotatePoint(snap.Dp, center, delta),
      })
    }
  }

  static getSnapshot(data: IData) {}
}
