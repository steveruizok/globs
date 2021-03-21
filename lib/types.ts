export type IVector = number[]

export interface IGlobParams {
  C0: IVector
  r0: number
  C1: IVector
  r1: number
  D: IVector
  Dp: IVector
  a: number
  ap: number
  b: number
  bp: number
}

export interface IGlobPath {
  C0: IVector
  r0: number
  C1: IVector
  r1: number
  E0: IVector
  E1: IVector
  F0: IVector
  F1: IVector
  E0p: IVector
  E1p: IVector
  F0p: IVector
  F1p: IVector
}

export enum ICanvasItems {
  Node,
  Handle,
  Anchor,
  Radius,
  Glob,
}

export interface ICanvasItem {
  id: string
  name: string
  zIndex: number
}

export interface IGlobOptions {
  D: IVector
  Dp: IVector
  a: number
  ap: number
  b: number
  bp: number
}

export interface IGlob extends ICanvasItem {
  id: string
  nodes: string[]
  options: IGlobOptions
}

export interface INode extends ICanvasItem {
  type: ICanvasItems.Node
  point: IVector
  radius: number
  cap: "round" | "flat"
  locked: boolean
}

export interface IData {
  viewport: {
    point: number[]
    size: number[]
    scroll: number[]
  }
  document: {
    point: number[]
    size: number[]
  }
  camera: {
    zoom: number
    point: number[]
  }
  brush: {
    start: number[]
    end: number[]
    targets: { id: string; type: "glob" | "handle" | "node"; path: string }[]
  }
  initialPoints: {
    nodes: Record<string, number[]>
    globs: Record<string, { D: number[]; Dp: number[] }>
  }
  snaps: {
    nodes: Record<string, number[]>
    globs: Record<string, { D: number[]; Dp: number[] }>
  }
  fill: boolean
  nodeIds: string[]
  nodes: Record<string, INode>
  globIds: string[]
  globs: Record<string, IGlob>
  selectedHandle: { id: string; handle: string } | undefined
  selectedGlobs: string[]
  hoveredNodes: string[]
  hoveredGlobs: string[]
  highlightNodes: string[]
  highlightGlobs: string[]
  selectedNodes: string[]
  cloning: string[]
}
