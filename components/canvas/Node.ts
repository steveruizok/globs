import { IBounds, ICanvasItems, INode } from "lib/types"

export default class Node implements INode {
  id: string
  locked = false
  point: number[]
  radius: number

  name = "Node"
  zIndex = 0
  type: ICanvasItems.Node = ICanvasItems.Node
  cap: "round" | "flat" = "round"
  isSelected = false
  isHovered = false
  isInView = false
  paths = {
    outline: new Path2D(),
    dot: new Path2D(),
  }

  constructor(node: INode) {
    this.id = node.id
    this.point = node.point
    this.radius = node.radius
  }

  update(node: INode) {
    this.point = node.point
    this.radius = node.radius
  }

  getBounds(): IBounds {
    const [cx, cy] = this.point
    const r = this.radius

    return {
      x: cx - r,
      y: cy - r,
      maxX: cx + r,
      maxY: cy + r,
      width: r * 2,
      height: r * 2,
    }
  }
}
