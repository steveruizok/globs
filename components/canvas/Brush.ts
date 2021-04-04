import state from "lib/state"
import { IBounds } from "lib/types"
import Node from "./Node"

class Brush {
  start = [0, 0]
  end = [0, 0]
  selected = new Set<Node>([])

  constructor() {}

  moveTo(point: number[]) {
    this.start = [...point]
    this.end = [...point]
  }

  brushTo(point: number[]) {
    this.end = [...point]
  }

  getBounds() {
    let [minX, minY] = this.start
    let [maxX, maxY] = this.end

    if (minX > maxX) [minX, maxX] = [maxX, minX]
    if (minY > maxY) [minY, maxY] = [maxY, minY]

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.abs(maxY - minY),
      height: Math.abs(maxY - minY),
    }
  }

  intersect(b: IBounds) {
    return !(
      b.x > this.maxX ||
      b.maxX < this.x ||
      b.y > this.maxY ||
      b.maxY < this.y
    )
  }

  get x() {
    return Math.min(this.start[0], this.end[0])
  }

  get y() {
    return Math.min(this.start[1], this.end[1])
  }

  get maxX() {
    return Math.max(this.start[0], this.end[0])
  }

  get maxY() {
    return Math.max(this.start[1], this.end[1])
  }

  get width() {
    return Math.abs(this.start[0] - this.end[0])
  }

  get height() {
    return Math.abs(this.start[1] - this.end[1])
  }
}

export default new Brush()
