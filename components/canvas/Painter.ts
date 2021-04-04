import * as vec from "lib/vec"
import state from "lib/state"
import camera from "./Camera"
import brush from "./Brush"
import viewport from "./Viewport"
import bounds from "./Bounds"
import Node from "./Node"
import { IBounds, INode } from "lib/types"

class Painter {
  cvs: HTMLCanvasElement
  ctx: CanvasRenderingContext2D

  constructor(cvs?: HTMLCanvasElement) {
    if (cvs) {
      this.setup(cvs)
    }
  }

  setup(cvs: HTMLCanvasElement) {
    this.cvs = cvs
    this.ctx = cvs.getContext("2d")

    const parent = cvs.parentElement
    if (!parent) return

    const rect = cvs.parentElement.getBoundingClientRect()
    const dpr = window.devicePixelRatio
    cvs.width = rect.width * dpr
    cvs.height = rect.height * dpr
    cvs.style.setProperty("transform-origin", `top left`)
    cvs.style.setProperty("transform", `scale(${1 / dpr})`)
  }

  newFrame() {
    const { ctx, cvs } = this
    const dpr = window.devicePixelRatio
    ctx.resetTransform()
    ctx.clearRect(0, 0, cvs.width, cvs.height)
    ctx.scale(dpr, dpr)
  }

  paintNode(node: Node) {
    const { ctx, u } = this

    const {
      radius: r,
      point: [x, y],
    } = node

    // Circle

    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.ellipse(x, y, r, r, 0, 0, Math.PI * 2)
    ctx.closePath()

    if (node.isHovered) {
      ctx.save()
      ctx.fillStyle = colors.hover
      ctx.fill()
      ctx.restore()
    }

    ctx.save()
    ctx.lineWidth = u
    ctx.strokeStyle = node.isSelected ? colors.selected : colors.outline
    ctx.stroke()
    ctx.restore()

    // Dot
    ctx.beginPath()
    ctx.moveTo(x + node.radius, y)
    ctx.ellipse(x, y, u * 2, u * 2, 0, 0, Math.PI * 2)
    ctx.closePath()

    ctx.save()
    ctx.fillStyle = colors.outline
    ctx.fill()
    ctx.restore()
  }

  paintBrush() {
    const { ctx, u } = this

    const { x, y, maxX, maxY } = brush

    ctx.save()
    ctx.fillStyle = colors.brushFill
    ctx.fillRect(x, y, maxX - x, maxY - y)
    ctx.strokeStyle = colors.brush
    ctx.lineWidth = u
    ctx.strokeRect(x, y, maxX - x, maxY - y)
    ctx.restore()
  }

  paintBounds() {
    const { ctx, u } = this

    const { x, y, maxX, maxY } = bounds

    ctx.save()
    ctx.strokeStyle = colors.brush
    ctx.lineWidth = u
    ctx.strokeRect(x, y, maxX - x, maxY - y)
    ctx.restore()
  }

  get u() {
    return camera.zoom > 1 ? 1 / camera.zoom : 1
  }
}

const colors = {
  text: "#000",
  outline: "#000",
  selected: "#f00",
  brush: "rgba(0, 144, 255, 1)",
  brushFill: "rgba(0, 144, 255, .1)",
  hover: "rgba(0, 144, 255, .2)",
}

export default new Painter()
