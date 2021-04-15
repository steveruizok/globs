import { INode, IGlob, IBounds, ICanvasItem } from "types"
import { round } from "./utils"
import { clamp } from "./vec"

// Evaluate a 2D bezier curve
export function bez2d(
  A: number[],
  B: number[],
  C: number[],
  D: number[],
  t: number
) {
  return [bez1d(A[0], B[0], C[0], D[0], t), bez1d(A[1], B[1], C[1], D[1], t)]
}

// Evaluate a point along a 1d bezier curve.
export function bez1d(a: number, b: number, c: number, d: number, t: number) {
  return (
    a * (1 - t) * (1 - t) * (1 - t) +
    3 * b * t * (1 - t) * (1 - t) +
    3 * c * t * t * (1 - t) +
    d * t * t * t
  )
}

/**
 * Get the bounding box of a cubic bezier curve.
 * @param p0 The first point.
 * @param c0 The first control point.
 * @param c1 The second control point.
 * @param p1 The second point.
 * @returns
 */
export function getCubicBezierBounds(
  p0: number[],
  c0: number[],
  c1: number[],
  p1: number[]
) {
  // solve for x
  let a = 3 * p1[0] - 9 * c1[0] + 9 * c0[0] - 3 * p0[0]
  let b = 6 * p0[0] - 12 * c0[0] + 6 * c1[0]
  let c = 3 * c0[0] - 3 * p0[0]
  let disc = b * b - 4 * a * c
  let xl = p0[0]
  let xh = p0[0]

  if (p1[0] < xl) xl = p1[0]
  if (p1[0] > xh) xh = p1[0]

  if (disc >= 0) {
    var t1 = (-b + Math.sqrt(disc)) / (2 * a)
    if (t1 > 0 && t1 < 1) {
      var x1 = bez1d(p0[0], c0[0], c1[0], p1[0], t1)
      if (x1 < xl) xl = x1
      if (x1 > xh) xh = x1
    }
    var t2 = (-b - Math.sqrt(disc)) / (2 * a)
    if (t2 > 0 && t2 < 1) {
      var x2 = bez1d(p0[0], c0[0], c1[0], p1[0], t2)
      if (x2 < xl) xl = x2
      if (x2 > xh) xh = x2
    }
  }

  // Solve for y
  a = 3 * p1[1] - 9 * c1[1] + 9 * c0[1] - 3 * p0[1]
  b = 6 * p0[1] - 12 * c0[1] + 6 * c1[1]
  c = 3 * c0[1] - 3 * p0[1]
  disc = b * b - 4 * a * c
  let yl = p0[1]
  let yh = p0[1]
  if (p1[1] < yl) yl = p1[1]
  if (p1[1] > yh) yh = p1[1]
  if (disc >= 0) {
    var t1 = (-b + Math.sqrt(disc)) / (2 * a)
    if (t1 > 0 && t1 < 1) {
      var y1 = bez1d(p0[1], c0[1], c1[1], p1[1], t1)
      if (y1 < yl) yl = y1
      if (y1 > yh) yh = y1
    }
    var t2 = (-b - Math.sqrt(disc)) / (2 * a)
    if (t2 > 0 && t2 < 1) {
      var y2 = bez1d(p0[1], c0[1], c1[1], p1[1], t2)
      if (y2 < yl) yl = y2
      if (y2 > yh) yh = y2
    }
  }

  return {
    minX: xl,
    minY: yl,
    maxX: xh,
    maxY: yh,
    width: Math.abs(xl - xh),
    height: Math.abs(yl - yh),
  }
}

/**
 * Get the bounding box of a circle.
 */
export function getCircleBounds(cx: number, cy: number, r: number): IBounds {
  return {
    minX: cx - r,
    minY: cy - r,
    maxX: cx + r,
    maxY: cy + r,
    width: r * 2,
    height: r * 2,
  }
}

/**
 * Get the bounds of a node.
 * @param node
 * @returns
 */
export function getNodeBounds(node: INode, zoom = 1): IBounds {
  const {
    point: [x, y],
    radius,
  } = node
  return getCircleBounds(x, y, radius * zoom)
}

/**
 * Get the bounds of a glob's inner curves.
 * @param glob
 * @returns
 */
export function getGlobInnerBounds(glob: IGlob) {
  const { E0, F0, F1, E1, E0p, F0p, F1p, E1p } = glob.points

  const b = getCubicBezierBounds(E0, F0, F1, E1)
  const bp = getCubicBezierBounds(E0p, F0p, F1p, E1p)
  return getCommonBounds(b, bp)
}

/**
 * Get a bounding box that includes two bounding boxes.
 * @param a Bounding box
 * @param b Bounding box
 * @returns
 */
export function getExpandedBounds(a: IBounds, b: IBounds) {
  const minX = Math.min(a.minX, b.minX),
    minY = Math.min(a.minY, b.minY),
    maxX = Math.max(a.maxX, b.maxX),
    maxY = Math.max(a.maxY, b.maxY),
    width = Math.abs(maxX - minX),
    height = Math.abs(maxY - minY)

  return { minX, minY, maxX, maxY, width, height }
}

/**
 * Get the common bounds of a group of bounds.
 * @param b
 * @returns
 */
export function getCommonBounds(...b: IBounds[]) {
  if (b.length < 2) return b[0]

  let bounds = b[0]

  for (let i = 1; i < b.length; i++) {
    bounds = getExpandedBounds(bounds, b[i])
  }

  return bounds
}

export function roundBounds(b: IBounds) {
  return {
    minX: round(b.minX),
    maxX: round(b.maxX),
    minY: round(b.minY),
    maxY: round(b.maxY),
    width: round(b.width),
    height: round(b.height),
  }
}

/**
 * Get the bounding box for a glob.
 * @param glob The glob
 * @param start The glob's start node (as a node)
 * @param end The glob's end node (as a node)
 * @returns
 */
export function getGlobBounds(glob: IGlob, start: INode, end: INode, zoom = 1) {
  if (glob.points === null) {
    throw Error("Can't get bounds of a glob without points!")
  }

  const { E0, F0, F1, E1, E0p, F0p, F1p, E1p } = glob.points
  const b = getCubicBezierBounds(E0, F0, F1, E1)
  const bp = getCubicBezierBounds(E0p, F0p, F1p, E1p)
  const sb = getNodeBounds(start, zoom)
  const eb = getNodeBounds(end, zoom)

  return getCommonBounds(b, bp, sb, eb)
}

export function getBoundsBetweenPoints(a: number[], b: number[]): IBounds {
  const x0 = Math.min(a[0], b[0])
  const y0 = Math.min(a[1], b[1])
  const x1 = Math.max(a[0], b[0])
  const y1 = Math.max(a[1], b[1])

  return {
    minX: x0,
    minY: y0,
    maxX: x1,
    maxY: y1,
    width: Math.abs(x0 - x1),
    height: Math.abs(y0 - y1),
  }
}

/**
 * Get whether two bounds collide.
 * @param a Bounds
 * @param b Bounds
 * @returns
 */
export function boundsCollide(a: IBounds, b: IBounds) {
  return !(
    a.maxX < b.minX ||
    a.minX > b.maxX ||
    a.maxY < b.minY ||
    a.minY > b.maxY
  )
}

/**
 * Get whether the bounds of A contain the bounds of B. A perfect match will return true.
 * @param a Bounds
 * @param b Bounds
 * @returns
 */
export function boundsContain(a: IBounds, b: IBounds) {
  return (
    a.minX < b.minX && a.minY < b.minY && a.maxY > b.maxY && a.maxX > b.maxX
  )
}

/**
 * Get whether the bounds of A are contained by the bounds of B.
 * @param a Bounds
 * @param b Bounds
 * @returns
 */
export function boundsContained(a: IBounds, b: IBounds) {
  return boundsContain(b, a)
}

/**
 * Get whether two bounds are identical.
 * @param a Bounds
 * @param b Bounds
 * @returns
 */
export function boundsAreEqual(a: IBounds, b: IBounds) {
  return !(
    b.maxX !== a.maxX ||
    b.minX !== a.minX ||
    b.maxY !== a.maxY ||
    b.minY !== a.minY
  )
}

/**
 * Get whether a point is inside of a bounds.
 * @param A
 * @param b
 * @returns
 */
export function pointInBounds(A: number[], b: IBounds) {
  return !(A[0] < b.minX || A[0] > b.maxX || A[1] < b.minY || A[1] > b.maxY)
}
