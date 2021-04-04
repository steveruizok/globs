import * as vec from "lib/vec"
import state from "lib/state"
import painter from "./Painter"
import viewport from "./Viewport"
import camera from "./Camera"
import inputs from "./Inputs"
import brush from "./Brush"
import bounds from "./Bounds"
import Node from "./Node"
import { IBounds, ICanvasItems, IGlob, INode } from "lib/types"

interface EngineOptions {
  parent: HTMLElement
}

enum State {
  Selecting = "Selecting",
  DraggingSelection = "DraggingSelection",
  Creating = "Creating",
  EdgeResizing = "EdgeResizing",
  CornerResizing = "CornerResizing",
  CornerRotating = "CornerRotating",
  DraggingHandle = "DraggingHandle",
  DraggingAnchor = "DraggingAnchor",
  BrushSelecting = "BrushSelecting",
}

// Dummy data

let nodes = Array.from(Array(100)).map((_, i) => {
  const id = i.toString()
  return new Node({
    id,
    name: `Node ${id}`,
    zIndex: i,
    type: ICanvasItems.Node,
    point: [64 * (i % 40), 64 * Math.floor(i / 40)],
    radius: 24,
    cap: "round",
    locked: false,
  })
})

/* --------------------- Engine --------------------- */

class Engine {
  cvs: HTMLCanvasElement

  document = { point: [0, 0], size: [0, 0] }

  nodes = new Map<string, Node>(nodes.map((node) => [node.id, node]))
  hoveredNodes = new Set<Node>([])
  selectedNodes = new Set<Node>([])

  state: State = State.Selecting

  constructor(options = {} as Partial<EngineOptions>) {
    this.cvs = document.createElement("canvas")

    if (options.parent) {
      this.mount(options.parent)
    }
  }

  mount(parent: HTMLElement) {
    const { document } = this
    parent.append(this.cvs)
    inputs.setup(parent)
    this.handleResize()
  }

  unmount() {
    inputs.removeEvents()
    this.cvs.parentElement.removeChild(this.cvs)
  }

  handleResize() {
    const parent = this.cvs.parentElement
    painter.setup(this.cvs)
    viewport.setup(parent)
    painter.setup(this.cvs)
    this.document.size = vec.round(vec.div(viewport.size, camera.zoom))

    this.updateInViewNodes()
    this.updateHoveredNodes()
    this.render()
  }

  // Make stuff

  createNode() {}

  deleteNode() {}

  // Update Stuff

  updateBounds() {
    // Update bounds
    if (this.selectedNodes.size < 2) {
      bounds.reset()
    } else {
      const selectedNodes = Array.from(this.selectedNodes.values())
      bounds.start(selectedNodes[0].getBounds())
      for (let i = 1; i < selectedNodes.length; i++) {
        bounds.expand(selectedNodes[i].getBounds())
      }
    }
  }

  updateInViewNodes() {
    this.nodes.forEach((node) => {
      const [x, y] = camera.worldToScreen(node.point)
      const r = node.radius * camera.zoom

      // Update isInView
      node.isInView = viewport.getisInView(x - r, y - r, x + r, y + r)
    })
  }

  updateHoveredNodes() {
    const { point } = inputs.pointer

    const minX = Math.floor(point[0] / 100)
    const minY = Math.floor(point[1] / 100)
    const maxX = minX + 100
    const maxY = minY + 100

    this.nodes.forEach((node) => {
      const [x, y] = camera.worldToScreen(node.point)
      const r = node.radius * camera.zoom

      if (
        !node.isInView ||
        (Math.abs(x - point[0]) > r && Math.abs(y - point[1]) > r)
      ) {
        node.isHovered = false
        this.hoveredNodes.delete(node)
      } else {
        if (vec.dist([x, y], point) < r) {
          node.isHovered = true
          this.hoveredNodes.add(node)
        } else {
          node.isHovered = false
          this.hoveredNodes.delete(node)
        }
      }
    })
  }

  updateNodesPaths() {
    const { zoom } = camera
    const dotR = zoom > 1 ? 2 : 2 * zoom

    this.nodes.forEach((node) => {
      const [x, y] = node.point
      // const [x, y] = camera.worldToScreen(node.point)
      const r = node.radius // * camera.zoom

      if (!node.isInView) {
        node.paths.outline = null
      } else {
        node.paths.outline = new Path2D()
        node.paths.outline.moveTo(x + r, y)
        node.paths.outline.ellipse(x, y, r, r, 0, 0, Math.PI * 2)
        node.paths.outline.closePath()
      }
    })
  }

  // updateNodes() {
  //   const { point } = inputs.pointer

  //   this.nodes.forEach((node) => {
  //     const [x, y] = camera.worldToScreen(node.point)
  //     const r = node.radius * camera.zoom

  //     // Update isInView
  //     node.isInView = viewport.getisInView(x - r, y - r, x + r, y + r)

  //     // Update hovered
  //     if (!node.isInView) {
  //       node.isHovered = false
  //       this.hoveredNodes.delete(node)
  //     } else {
  //       if (vec.dist([x, y], point) < r) {
  //         node.isHovered = true
  //         this.hoveredNodes.add(node)
  //       } else {
  //         node.isHovered = false
  //         this.hoveredNodes.delete(node)
  //       }
  //     }

  //     // Update paths
  //     if (!node.isInView) {
  //       node.paths.outline = null
  //       node.paths.dot = null
  //     } else {
  //       node.paths.outline = new Path2D()
  //       node.paths.outline.moveTo(x + r, y)
  //       node.paths.outline.ellipse(x, y, r, r, 0, 0, Math.PI * 2)
  //       node.paths.outline.closePath()

  //       node.paths.dot = new Path2D()
  //       node.paths.dot.moveTo(x + 2, y)
  //       node.paths.dot.ellipse(x, y, 2, 2, 0, 0, Math.PI * 2)
  //       node.paths.dot.closePath()
  //     }
  //   })
  // }

  // Handle Events

  handlePointerDown() {
    const { point } = inputs.pointer
    const { selectedNodes } = this

    const clicked = this.getClicked()

    switch (this.state) {
      case State.Selecting: {
        if (clicked instanceof Node) {
          // Pointed node
          if (inputs.keys.Shift) {
            if (selectedNodes.has(clicked)) {
              selectedNodes.delete(clicked)
              clicked.isSelected = false
            } else {
              selectedNodes.add(clicked)
              clicked.isSelected = true
            }
          } else {
            this.selectedNodes.forEach((node) => (node.isSelected = false))
            this.selectedNodes.clear()
            this.selectedNodes.add(clicked)
            clicked.isSelected = true
          }

          this.state = State.DraggingSelection
        } else if (clicked === bounds) {
          // Pointed bounds
          this.state = State.DraggingSelection
        } else if (clicked === "canvas") {
          // Pointed canvas
          this.selectedNodes.forEach((node) => (node.isSelected = false))
          this.selectedNodes.clear()

          this.state = State.BrushSelecting
          brush.moveTo(camera.screenToWorld(point))
        }

        this.updateBounds()
        break
      }
      case State.Creating: {
        // Update hovers
        // Update ghost
        break
      }
      case State.DraggingSelection: {
        // Offset Selected Nodes
        // Offset Selected Globs
        break
      }
      case State.DraggingHandle: {
        break
      }
      case State.DraggingAnchor: {
        break
      }
      case State.EdgeResizing: {
        break
      }
      case State.CornerResizing: {
        break
      }
      case State.CornerRotating: {
        break
      }
      case State.BrushSelecting: {
        break
      }
    }

    this.render()
  }

  handlePointerUp() {
    switch (this.state) {
      case State.Selecting: {
        //  Update hovers
        break
      }
      case State.DraggingSelection: {
        this.state = State.Selecting
        this.render()
        break
      }
      case State.DraggingHandle: {
        break
      }
      case State.DraggingAnchor: {
        break
      }
      case State.EdgeResizing: {
        break
      }
      case State.CornerResizing: {
        break
      }
      case State.CornerRotating: {
        break
      }
      case State.BrushSelecting: {
        this.state = State.Selecting
        this.render()
        break
      }
      case State.Creating: {
        // Update hovers
        // Update ghost
        break
      }
    }
  }

  handlePointerMove() {
    const { point, delta } = inputs.pointer

    switch (this.state) {
      case State.Selecting: {
        this.updateHoveredNodes()
        this.render()
        break
      }
      case State.DraggingSelection: {
        const d = vec.div(delta, camera.zoom)
        this.selectedNodes.forEach(
          (node) => (node.point = vec.add(node.point, d))
        )
        bounds.moveBy(d)
        this.updateInViewNodes()
        this.updateNodesPaths()
        this.render()
        break
      }
      case State.DraggingHandle: {
        break
      }
      case State.DraggingAnchor: {
        break
      }
      case State.EdgeResizing: {
        break
      }
      case State.CornerResizing: {
        break
      }
      case State.CornerRotating: {
        break
      }
      case State.BrushSelecting: {
        brush.brushTo(camera.screenToWorld(point))
        this.updateBrushSelected()
        this.updateBounds()
        this.render()
        break
      }
      case State.Creating: {
        // Update hovers
        // Update ghost
        break
      }
    }
  }

  handlePan(delta: number[]) {
    const d = vec.div(vec.neg(delta), camera.zoom)
    camera.point = vec.round(vec.sub(camera.point, d))
    inputs.pointer.delta = vec.mul(vec.neg(d), camera.zoom)
    this.document.point = camera.point

    const { point } = inputs.pointer

    this.updateInViewNodes()
    this.updateNodesPaths()

    switch (this.state) {
      case State.Selecting: {
        break
      }
      case State.DraggingSelection: {
        break
      }
      case State.DraggingHandle: {
        break
      }
      case State.DraggingAnchor: {
        break
      }
      case State.EdgeResizing: {
        break
      }
      case State.CornerResizing: {
        break
      }
      case State.CornerRotating: {
        break
      }
      case State.BrushSelecting: {
        brush.brushTo(camera.screenToWorld(point))
        this.updateBrushSelected()
        this.updateBounds()
        break
      }
      case State.Creating: {
        break
      }
    }

    this.render()
  }

  handleZoom(delta: number) {
    const { point } = inputs.pointer

    delta = ((-delta * 5) / 500) * Math.max(0.25, camera.zoom)

    const pt0 = camera.screenToWorld(point)

    camera.zoom = Math.max(Math.min(camera.zoom + delta, 10), 0.01)
    camera.zoom = Math.round(camera.zoom * 100) / 100

    const pt1 = camera.screenToWorld(point)

    camera.point = vec.round(vec.sub(camera.point, vec.sub(pt1, pt0)))

    this.document.size = vec.round(vec.div(viewport.size, camera.zoom))
    this.document.point = camera.point

    this.updateInViewNodes()
    this.updateNodesPaths()
    this.render()
  }

  handlePointerLeave() {}
  handleKeyDown(key: string) {}
  handleKeyUp(key: string) {}
  handleEvent(eventName: string) {}

  // Generic

  getClicked() {
    if (this.hoveredNodes.size > 0) {
      const nodes = Array.from(this.hoveredNodes.values())
      return nodes[0]
    }

    if (bounds.hitTest(camera.screenToWorld(inputs.pointer.point))) {
      return bounds
    }

    return "canvas"
  }

  updateBrushSelected() {
    this.nodes.forEach((node) => {
      if (brush.intersect(node.getBounds())) {
        if (!brush.selected.has(node)) {
          brush.selected.add(node)
          this.selectedNodes.add(node)
          node.isSelected = true
        }
      } else {
        if (brush.selected.has(node)) {
          brush.selected.delete(node)
          this.selectedNodes.delete(node)
          node.isSelected = false
        }
      }
    })
  }

  render() {
    painter.newFrame()

    painter.ctx.scale(camera.zoom, camera.zoom)
    painter.ctx.translate(-camera.point[0], -camera.point[1])

    this.nodes.forEach((node) => {
      if (node.isInView) {
        painter.paintNode(node)
      }
    })

    if (this.state === State.BrushSelecting) {
      painter.paintBrush()
    }

    if (this.selectedNodes.size > 0) {
      painter.paintBounds()
    }

    painter.ctx.fillText(this.state.toString(), 16, 16)
  }
}

export default new Engine()
