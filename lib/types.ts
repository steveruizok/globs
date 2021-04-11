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

export interface IGlob extends ICanvasItem {
  id: string
  nodes: string[]
  points?: IGlobPoints
  p0?: number[]
  D: number[]
  Dp: number[]
  a: number
  ap: number
  b: number
  bp: number
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
  Handle = "Handle",
  HandleStraight = "HandleStraight",
}

export interface IBaseSnap {
  type: ISnapTypes
  from: number[]
  to: number[]
}

interface NodeCentersSnap extends IBaseSnap {
  type: ISnapTypes.NodesCenter
}

interface NodeXSnap extends IBaseSnap {
  type: ISnapTypes.NodesX
}

interface NodeYSnap extends IBaseSnap {
  type: ISnapTypes.NodesY
}

interface HandleSnap extends IBaseSnap {
  type: ISnapTypes.Handle
}

interface HandleStraightSnap extends IBaseSnap {
  type: ISnapTypes.HandleStraight
  n: number[]
}

export type ISnap =
  | NodeCentersSnap
  | NodeXSnap
  | NodeYSnap
  | HandleSnap
  | HandleStraightSnap

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
  snaps: {
    active: ISnap[]
  }
  fill: boolean
  nodeIds: string[]
  globIds: string[]
  nodes: Record<string, INode>
  globs: Record<string, IGlob>
  selectedGlobs: string[]
  hoveredNodes: string[]
  hoveredGlobs: string[]
  highlightNodes: string[]
  highlightGlobs: string[]
  selectedNodes: string[]
  selectedHandle?: { id: string; handle: IHandle }
}

export type IAnchor = "a" | "ap" | "b" | "bp"
export type IHandle = "D" | "Dp"

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

export interface ISelectionSnapshot {
  selectedNodes: string[]
  selectedGlobs: string[]
  hoveredNodes: string[]
  hoveredGlobs: string[]
  nodes: Record<
    string,
    {
      id: string
      point: number[]
      radius: number
    }
  >
  globs: Record<
    string,
    {
      id: string
      D: number[]
      Dp: number[]
      a: number
      b: number
      ap: number
      bp: number
    }
  >
}

export type ITranslation =
  | { type: "anchor"; anchor: IAnchor }
  | { type: "handle"; axis: "x" | "y"; handle: IHandle }
  | { type: "point"; axis: "x" | "y" }
  | { type: "radius" }
