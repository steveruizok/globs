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
  start: string
  end: string
  options: IGlobOptions
}

export interface INode extends ICanvasItem {
  type: ICanvasItems.Node
  point: IVector
  radius: number
  cap: "round" | "flat"
}
