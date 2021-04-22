import * as monaco from "monaco-editor/esm/vs/editor/editor.api"
/**
 * The JSON schema for a shared project.
 */
export interface IProject {
  id: string
  name: string
  globs: Record<string, IGlob>
  nodes: Record<string, INode>
  groups: Record<string, IGroup>
  pages: Record<string, IPage>
  code: Record<string, ICode>
  version: string
  shareUrl?: string
}

export interface IData extends IProject {
  // State
  theme: "dark" | "light"
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
  brush?: IBounds
  bounds?: IBounds
  fill: boolean
  pageId: string
  nodeIds: string[]
  globIds: string[]
  selectedGlobs: string[]
  pointingId: string
  hoveredNodes: string[]
  hoveredGlobs: string[]
  highlightNodes: string[]
  highlightGlobs: string[]
  selectedNodes: string[]
  selectedHandle?: { id: string; handle: IHandle }
  snaps: {
    active: ISnap[]
  }
  generated: {
    nodeIds: string[]
    globIds: string[]
  }
  codePanel: {
    fontSize: number
  }
}

export interface ICode {
  id: string
  name: string
  code: string
  childIndex: 0
}

export enum ICanvasItems {
  Page,
  Node,
  Glob,
  Group,
  Point,
  Line,
}

export interface ICanvasItem {
  id: string
  name: string
  type: ICanvasItems
  childIndex: number
  locked: boolean
}

export interface IPage extends ICanvasItem {
  type: ICanvasItems.Page
}

export interface IGroup extends ICanvasItem {
  type: ICanvasItems.Group
  parentId: string
}

export interface IGlob extends ICanvasItem {
  type: ICanvasItems.Glob
  parentId: string
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
  parentId: string
  point: number[]
  radius: number
  cap: "round" | "flat"
  locked: boolean
}

export interface IPoint extends ICanvasItem {
  type: ICanvasItems.Point
  parentId: string
  point: number[]
  locked: boolean
}

export type IMonaco = typeof monaco
export type IMonacoEditor = monaco.editor.IStandaloneCodeEditor

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

export type IAnchor = "a" | "ap" | "b" | "bp"
export type IHandle = "D" | "Dp"

export type IBounds = {
  minX: number
  minY: number
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

export interface ResizeSessionSnapshot {
  radius: number
}

export type INodeAdjacentHandleSnapshot = Record<
  string,
  {
    D: number[]
    Dp: number[]
    E0: number[]
    E0p: number[]
    E1: number[]
    E1p: number[]
    cw: boolean
    cwp: boolean
    type: "end" | "start" | "both"
  }
>
