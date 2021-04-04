import * as vec from "lib/vec"

class Camera {
  point = [0, 0]
  zoom = 1

  constructor() {}

  setup({ point, zoom }: { point: number[]; zoom: number }) {
    this.point = point
    this.zoom = zoom
  }

  screenToWorld(point: number[]) {
    return vec.add(vec.div(point, this.zoom), this.point)
  }

  worldToScreen(point: number[]) {
    return vec.mul(vec.sub(point, this.point), this.zoom)
  }
}

export default new Camera()
