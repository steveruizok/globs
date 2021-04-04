export interface IGlobParams {
  C0: number[]
  r0: number
  C1: number[]
  r1: number
  D: number[]
  Dp: number[]
  a: number
  ap: number
  b: number
  bp: number
}

export interface IGlobPoints {
  C0: number[]
  r0: number
  C1: number[]
  r1: number
  E0: number[]
  E1: number[]
  F0: number[]
  F1: number[]
  E0p: number[]
  E1p: number[]
  F0p: number[]
  F1p: number[]
  N0: number[]
  N0p: number[]
  N1: number[]
  N1p: number[]
  D: number[]
  Dp: number[]
  D1: number[]
  Dp1: number[]
  D2: number[]
  Dp2: number[]
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
  D: number[]
  Dp: number[]
  a: number
  ap: number
  b: number
  bp: number
}

export interface IGlob extends ICanvasItem {
  id: string
  nodes: string[]
  points?: IGlobPoints
  options: IGlobOptions
  p0?: number[]
}

export interface INode extends ICanvasItem {
  type: ICanvasItems.Node
  point: number[]
  radius: number
  cap: "round" | "flat"
  locked: boolean
}

export enum ISnapTypes {
  NodesCenter = "NodesCenter",
  NodesX = "NodesX",
  NodesY = "NodesY",
}

export interface IBaseSnap {
  type: ISnapTypes
}

interface NodeCentersSnap extends IBaseSnap {
  type: ISnapTypes.NodesCenter
  from: number[]
  to: number[]
}

interface NodeXSnap extends IBaseSnap {
  type: ISnapTypes.NodesX
  from: number[]
  to: number[]
}

interface NodeYSnap extends IBaseSnap {
  type: ISnapTypes.NodesY
  from: number[]
  to: number[]
}

type ISnap = NodeCentersSnap | NodeXSnap | NodeYSnap

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
  brush?: {
    start: number[]
    end: number[]
    targets: { id: string; type: "glob" | "handle" | "node"; path: string }[]
  }
  bounds?: IBounds
  initialPoints: {
    nodes: Record<string, number[]>
    globs: Record<string, { D: number[]; Dp: number[] }>
  }
  snaps: {
    nodes: Record<string, { point: number[]; radius: number }>
    globs: Record<string, number[][]>
    active: ISnap[]
  }
  fill: boolean
  nodeIds: string[]
  nodes: Record<string, INode>
  initialNodes: Record<string, INode>
  globIds: string[]
  globs: Record<string, IGlob>
  initialGlobs: Record<string, IGlob>
  selectedAnchor: { id: string; anchor: string }
  selectedHandle?: { id: string; handle: string }
  selectedGlobs: string[]
  hoveredNodes: string[]
  hoveredGlobs: string[]
  highlightNodes: string[]
  highlightGlobs: string[]
  selectedNodes: string[]
  cloningNodes: string[]
  cloningGlobs: string[]
}

export type IBounds = {
  x: number
  y: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export interface INodeSnapshot {
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

export interface KeyCommand {
  eventName: string
  modifiers: string[]
}

// export interface IGlobSnapshot {
//   id: string
// 	x: number
// 	y: number
//   nx: number
//   ny: number
// }
