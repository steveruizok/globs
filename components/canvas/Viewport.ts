class Viewport {
  point: number[]
  size: number[]
  scroll: number[]

  constructor() {}

  setup(element: HTMLElement) {
    const rect = element.getBoundingClientRect()
    this.point = [rect.x, rect.y]
    this.size = [rect.width, rect.height]
    this.scroll = [0, 0]
  }

  getisInView(minX: number, minY: number, maxX: number, maxY: number) {
    return !(maxX < 0 || minX > this.size[0] || maxY < 0 || minY > this.size[1])
  }
}

export default new Viewport()
