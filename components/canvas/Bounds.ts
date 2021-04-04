import { IBounds } from "lib/types"

class Bounds {
  x = 0
  y = 0
  maxX = 0
  maxY = 0

  constructor() {}

  start(bounds: IBounds) {
    this.x = bounds.x
    this.y = bounds.y
    this.maxX = bounds.maxX
    this.maxY = bounds.maxY
  }

  expand(b: IBounds) {
    this.x = Math.min(b.x, this.x)
    this.y = Math.min(b.y, this.y)
    this.maxX = Math.max(b.maxX, this.maxX)
    this.maxY = Math.max(b.maxY, this.maxY)
  }

  reset() {
    this.x = 0
    this.y = 0
    this.maxX = 0
    this.maxY = 0
  }

  moveBy(delta: number[]) {
    this.x += delta[0]
    this.maxX += delta[0]
    this.y += delta[1]
    this.maxY += delta[1]
  }

  hitTest(point: number[]) {
    const [x, y] = point
    return !(x < this.x || x > this.maxX || y < this.y || y > this.maxY)
  }
}

export default new Bounds()
