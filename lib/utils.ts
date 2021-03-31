// Includes a lot of extras here.
import * as svg from "./svg"
import {
  IBounds,
  ICanvasItem,
  ICanvasItems,
  IGlob,
  IGlobPoints,
  INode,
  INodeSnapshot,
} from "./types"
import * as vec from "./vec"
import { Intersection, ShapeInfo } from "kld-intersections"

// A helper for getting tangents.
export function getCircleTangentToPoint(
  A: number[],
  r0: number,
  P: number[],
  side: number
) {
  const B = vec.lrp(A, P, 0.5),
    r1 = vec.dist(A, B),
    delta = vec.sub(B, A),
    d = vec.len(delta)

  if (!(d <= r0 + r1 && d >= Math.abs(r0 - r1))) {
    return
  }

  const a = (r0 * r0 - r1 * r1 + d * d) / (2.0 * d),
    n = 1 / d,
    p = vec.add(A, vec.mul(delta, a * n)),
    h = Math.sqrt(r0 * r0 - a * a),
    k = vec.mul(vec.per(delta), h * n)

  return side === 0 ? vec.add(p, k) : vec.sub(p, k)
}

export function circleCircleIntersections(a: number[], b: number[]) {
  var R = a[2],
    r = b[2],
    dx = b[0] - a[0],
    dy = b[1] - a[1],
    d = Math.sqrt(dx * dx + dy * dy),
    x = (d * d - r * r + R * R) / (2 * d),
    y = Math.sqrt(R * R - x * x)
  dx /= d
  dy /= d
  return [
    [a[0] + dx * x - dy * y, a[1] + dy * x + dx * y],
    [a[0] + dx * x + dy * y, a[1] + dy * x - dx * y],
  ]
}

export function getClosestPointOnCircle(
  C: number[],
  r: number,
  P: number[],
  padding = 0
) {
  const v = vec.sub(C, P)
  return vec.sub(C, vec.mul(vec.div(v, vec.len(v)), r + padding))
}

export function projectPoint(p0: number[], a: number, d: number) {
  return [Math.cos(a) * d + p0[0], Math.sin(a) * d + p0[1]]
}

function shortAngleDist(a0: number, a1: number) {
  var max = Math.PI * 2
  var da = (a1 - a0) % max
  return ((2 * da) % max) - da
}

export function lerpAngles(a0: number, a1: number, t: number) {
  return a0 + shortAngleDist(a0, a1) * t
}

export function getBezierCurveSegments(points: number[][], tension = 0.4) {
  const len = points.length,
    cpoints: number[][] = [...points]

  if (len < 2) {
    throw Error("Curve must have at least two points.")
  }

  for (let i = 1; i < len - 1; i++) {
    let p0 = points[i - 1],
      p1 = points[i],
      p2 = points[i + 1]

    const pdx = p2[0] - p0[0],
      pdy = p2[1] - p0[1],
      pd = Math.hypot(pdx, pdy),
      nx = pdx / pd, // normalized x
      ny = pdy / pd, // normalized y
      dp = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), // Distance to previous
      dn = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]) // Distance to next

    cpoints[i] = [
      // tangent start
      p1[0] - nx * dp * tension,
      p1[1] - ny * dp * tension,
      // tangent end
      p1[0] + nx * dn * tension,
      p1[1] + ny * dn * tension,
      // normal
      nx,
      ny,
    ]
  }

  // TODO: Reflect the nearest control points, not average them
  const d0 = Math.hypot(points[0][0] + cpoints[1][0])
  cpoints[0][2] = (points[0][0] + cpoints[1][0]) / 2
  cpoints[0][3] = (points[0][1] + cpoints[1][1]) / 2
  cpoints[0][4] = (cpoints[1][0] - points[0][0]) / d0
  cpoints[0][5] = (cpoints[1][1] - points[0][1]) / d0

  const d1 = Math.hypot(points[len - 1][1] + cpoints[len - 1][1])
  cpoints[len - 1][0] = (points[len - 1][0] + cpoints[len - 2][2]) / 2
  cpoints[len - 1][1] = (points[len - 1][1] + cpoints[len - 2][3]) / 2
  cpoints[len - 1][4] = (cpoints[len - 2][2] - points[len - 1][0]) / -d1
  cpoints[len - 1][5] = (cpoints[len - 2][3] - points[len - 1][1]) / -d1

  const results: {
    start: number[]
    tangentStart: number[]
    normalStart: number[]
    pressureStart: number
    end: number[]
    tangentEnd: number[]
    normalEnd: number[]
    pressureEnd: number
  }[] = []

  for (let i = 1; i < cpoints.length; i++) {
    results.push({
      start: points[i - 1].slice(0, 2),
      tangentStart: cpoints[i - 1].slice(2, 4),
      normalStart: cpoints[i - 1].slice(4, 6),
      pressureStart: 2 + ((i - 1) % 2 === 0 ? 1.5 : 0),
      end: points[i].slice(0, 2),
      tangentEnd: cpoints[i].slice(0, 2),
      normalEnd: cpoints[i].slice(4, 6),
      pressureEnd: 2 + (i % 2 === 0 ? 1.5 : 0),
    })
  }

  return results
}

export function cubicBezier(
  tx: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  // Inspired by Don Lancaster's two articles
  // http://www.tinaja.com/glib/cubemath.pdf
  // http://www.tinaja.com/text/bezmath.html

  // Set start and end point
  let x0 = 0,
    y0 = 0,
    x3 = 1,
    y3 = 1,
    // Convert the coordinates to equation space
    A = x3 - 3 * x2 + 3 * x1 - x0,
    B = 3 * x2 - 6 * x1 + 3 * x0,
    C = 3 * x1 - 3 * x0,
    D = x0,
    E = y3 - 3 * y2 + 3 * y1 - y0,
    F = 3 * y2 - 6 * y1 + 3 * y0,
    G = 3 * y1 - 3 * y0,
    H = y0,
    // Variables for the loop below
    t = tx,
    iterations = 5,
    i: number,
    slope: number,
    x: number,
    y: number

  // Loop through a few times to get a more accurate time value, according to the Newton-Raphson method
  // http://en.wikipedia.org/wiki/Newton's_method
  for (i = 0; i < iterations; i++) {
    // The curve's x equation for the current time value
    x = A * t * t * t + B * t * t + C * t + D

    // The slope we want is the inverse of the derivate of x
    slope = 1 / (3 * A * t * t + 2 * B * t + C)

    // Get the next estimated time value, which will be more accurate than the one before
    t -= (x - tx) * slope
    t = t > 1 ? 1 : t < 0 ? 0 : t
  }

  // Find the y value through the curve's y equation, with the now more accurate time value
  y = Math.abs(E * t * t * t + F * t * t + G * t * H)

  return y
}

export function copyToClipboard(string: string) {
  let textarea: HTMLTextAreaElement
  let result: any

  try {
    textarea = document.createElement("textarea")
    textarea.setAttribute("position", "fixed")
    textarea.setAttribute("top", "0")
    textarea.setAttribute("readonly", "true")
    textarea.setAttribute("contenteditable", "true")
    textarea.style.position = "fixed" // prevent scroll from jumping to the bottom when focus is set.
    textarea.value = string

    document.body.appendChild(textarea)

    textarea.focus()
    textarea.select()

    const range = document.createRange()
    range.selectNodeContents(textarea)

    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)

    textarea.setSelectionRange(0, textarea.value.length)
    result = document.execCommand("copy")
  } catch (err) {
    console.error(err)
    result = null
  } finally {
    document.body.removeChild(textarea)
  }

  // manual copy fallback using prompt
  if (!result) {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
    const copyHotkey = isMac ? "⌘C" : "CTRL+C"
    result = prompt(`Press ${copyHotkey}`, string) // eslint-disable-line no-alert
    if (!result) {
      return false
    }
  }
  return true
}

/**
 * Get a bezier curve data to for a spline that fits an array of points.
 * @param points An array of points formatted as [x, y]
 * @param k Tension
 * @returns An array of points as [cp1x, cp1y, cp2x, cp2y, px, py].
 */
export function getSpline(pts: number[][], k = 0.5, closed = false) {
  let p0: number[],
    [p1, p2, p3] = pts

  const results: number[][] = []

  for (let i = 1, len = pts.length; i < len; i++) {
    p0 = p1
    p1 = p2
    p2 = p3
    p3 = pts[i + 2] ? pts[i + 2] : p2
    results.push([
      p1[0] + ((p2[0] - p0[0]) / 6) * k,
      p1[1] + ((p2[1] - p0[1]) / 6) * k,
      p2[0] - ((p3[0] - p1[0]) / 6) * k,
      p2[1] - ((p3[1] - p1[1]) / 6) * k,
      pts[i][0],
      pts[i][1],
    ])
  }

  return results
}

export function getCurvePoints(
  pts: number[][],
  tension = 0.5,
  isClosed = false,
  numOfSegments = 3
) {
  let _pts = [...pts],
    len = pts.length,
    t1x: number, // tension vectors
    t2x: number,
    t1y: number,
    t2y: number,
    c1: number, // cardinal points
    c2: number,
    c3: number,
    c4: number,
    st: number,
    st2: number,
    st3: number,
    res: number[][] = [] // results

  // The algorithm require a previous and next point to the actual point array.
  // Check if we will draw closed or open curve.
  // If closed, copy end points to beginning and first points to end
  // If open, duplicate first points to befinning, end points to end
  if (isClosed) {
    _pts.unshift(_pts[len - 1])
    _pts.push(_pts[0])
  } else {
    //copy 1. point and insert at beginning
    _pts.unshift(_pts[0])
    _pts.push(_pts[len - 1])
    // _pts.push(_pts[len - 1])
  }

  // For each point, calculate a segment
  for (let i = 1; i < _pts.length - 2; i++) {
    // Calculate points along segment and add to results
    for (let t = 0; t <= numOfSegments; t++) {
      // Step
      st = t / numOfSegments
      st2 = Math.pow(st, 2)
      st3 = Math.pow(st, 3)

      // Cardinals
      c1 = 2 * st3 - 3 * st2 + 1
      c2 = -(2 * st3) + 3 * st2
      c3 = st3 - 2 * st2 + st
      c4 = st3 - st2

      // Tension
      t1x = (_pts[i + 1][0] - _pts[i - 1][0]) * tension
      t2x = (_pts[i + 2][0] - _pts[i][0]) * tension
      t1y = (_pts[i + 1][1] - _pts[i - 1][1]) * tension
      t2y = (_pts[i + 2][1] - _pts[i][1]) * tension

      // Control points
      res.push([
        c1 * _pts[i][0] + c2 * _pts[i + 1][0] + c3 * t1x + c4 * t2x,
        c1 * _pts[i][1] + c2 * _pts[i + 1][1] + c3 * t1y + c4 * t2y,
      ])
    }
  }

  res.push(pts[pts.length - 1])

  return res
}

export function angleDelta(a0: number, a1: number) {
  return shortAngleDist(a0, a1)
}

/**
 * Rotate a point around a center.
 * @param x The x-axis coordinate of the point.
 * @param y The y-axis coordinate of the point.
 * @param cx The x-axis coordinate of the point to rotate round.
 * @param cy The y-axis coordinate of the point to rotate round.
 * @param angle The distance (in radians) to rotate.
 */
export function rotatePoint(A: number[], B: number[], angle: number) {
  const s = Math.sin(angle)
  const c = Math.cos(angle)

  const px = A[0] - B[0]
  const py = A[1] - B[1]

  const nx = px * c - py * s
  const ny = px * s + py * c

  return [nx + B[0], ny + B[1]]
}

export function degreesToRadians(d: number) {
  return (d * Math.PI) / 180
}

export function radiansToDegrees(r: number) {
  return (r * 180) / Math.PI
}

export function getArcLength(C: number[], r: number, A: number[], B: number[]) {
  const sweep = getSweep(C, A, B)
  return r * (2 * Math.PI) * (sweep / (2 * Math.PI))
}

export function getArcDashOffset(
  C: number[],
  r: number,
  A: number[],
  B: number[],
  step: number
) {
  const del0 = getSweep(C, A, B)
  const len0 = getArcLength(C, r, A, B)
  const off0 = del0 < 0 ? len0 : 2 * Math.PI * C[2] - len0
  return -off0 / 2 + step
}

export function getEllipseDashOffset(A: number[], step: number) {
  const c = 2 * Math.PI * A[2]
  return -c / 2 + -step
}

export function getSweep(C: number[], A: number[], B: number[]) {
  return angleDelta(vec.angle(C, A), vec.angle(C, B))
}

export function getGlobPath(glob: IGlob, start: INode, end: INode) {
  const { D, Dp, a, b, ap, bp } = glob.options
  const { point: C0, radius: r0 } = start
  const { point: C1, radius: r1 } = end
  const { E0, E0p, F0, F0p, E1, E1p, F1, F1p } = getGlob(
    C0,
    r0,
    C1,
    r1,
    D,
    Dp,
    a,
    b,
    ap,
    bp
  )

  return [
    svg.moveTo(E0),
    start.cap === "round" ? svg.arcTo(C0, r0, E0, E0p) : svg.lineTo(E0p),
    svg.bezierTo(F0p, F1p, E1p),
    end.cap === "round" ? svg.arcTo(C1, r1, E1p, E1) : svg.lineTo(E1),
    svg.bezierTo(F1, F0, E0),
    svg.closePath(),
  ].join(" ")
}

export function getGlob(
  C0: number[],
  r0: number,
  C1: number[],
  r1: number,
  D: number[],
  Dp: number[],
  a: number,
  b: number,
  ap: number,
  bp: number
): IGlobPoints {
  // Get end points
  const E0 = getCircleTangentToPoint(C0, r0, D, 0),
    E0p = getCircleTangentToPoint(C0, r0, Dp, 1),
    E1 = getCircleTangentToPoint(C1, r1, D, 1),
    E1p = getCircleTangentToPoint(C1, r1, Dp, 0)

  // Get control points
  const F0 = vec.round(vec.lrp(E0, D, a)),
    F1 = vec.round(vec.lrp(E1, D, b)),
    F0p = vec.round(vec.lrp(E0p, Dp, ap)),
    F1p = vec.round(vec.lrp(E1p, Dp, bp))

  // Get inner / outer normal points
  let N0 = vec.tangent(C0, vec.lrp(E0, E0p, 0.5)),
    N0p = vec.mul(N0, -1),
    N1 = vec.tangent(vec.lrp(E1, E1p, 0.5), C1),
    N1p = vec.mul(N1, -1)

  if (getSweep(C0, E0, E0p) > 0) {
    ;[N0, N0p] = [N0p, N0]
  }

  if (getSweep(C1, E1, E1p) > 0) {
    ;[N1, N1p] = [N1p, N1]
  }

  return {
    C0,
    r0,
    C1,
    r1,
    E0,
    E0p,
    E1,
    E1p,
    F0,
    F0p,
    F1,
    F1p,
    N0,
    N0p,
    N1,
    N1p,
    D,
    Dp,
    D1: projectPoint(D, vec.angle(D, E0), vec.dist(D, E0) * 2),
    Dp1: projectPoint(Dp, vec.angle(Dp, E0p), vec.dist(Dp, E0p) * 2),
    D2: projectPoint(D, vec.angle(D, E1), vec.dist(D, E1) * 2),
    Dp2: projectPoint(Dp, vec.angle(Dp, E1p), vec.dist(Dp, E1p) * 2),
  }
}

export function deepCompareArrays<T>(a: T[], b: T[]) {
  if (a?.length !== b?.length) return false
  return deepCompare(a, b)
}

export function deepCompare<T>(a: T, b: T) {
  return a === b || JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Get outer tangents of two circles.
 * @param x0
 * @param y0
 * @param r0
 * @param x1
 * @param y1
 * @param r1
 * @returns [lx0, ly0, lx1, ly1, rx0, ry0, rx1, ry1]
 */
export function getOuterTangents(
  C0: number[],
  r0: number,
  C1: number[],
  r1: number
) {
  const a0 = vec.angle(C0, C1)
  const d = vec.dist(C0, C1)

  // Circles are overlapping, no tangents
  if (d < Math.abs(r1 - r0)) return

  const a1 = Math.acos((r0 - r1) / d),
    t0 = a0 + a1,
    t1 = a0 - a1

  return [
    [C0[0] + r0 * Math.cos(t1), C0[1] + r0 * Math.sin(t1)],
    [C1[0] + r1 * Math.cos(t1), C1[1] + r1 * Math.sin(t1)],
    [C0[0] + r0 * Math.cos(t0), C0[1] + r0 * Math.sin(t0)],
    [C1[0] + r1 * Math.cos(t0), C1[1] + r1 * Math.sin(t0)],
  ]
}

export function arrsIntersect<T, K>(
  a: T[],
  b: K[],
  fn?: (item: K) => T
): boolean
export function arrsIntersect<T>(a: T[], b: T[]): boolean
export function arrsIntersect<T>(
  a: T[],
  b: unknown[],
  fn?: (item: unknown) => T
) {
  return a.some((item) => b.includes(fn ? fn(item) : item))
}

// /**
//  * Will mutate an array to remove items.
//  * @param arr
//  * @param item
//  */
// export function pull<T>(arr: T[], ...items: T[]) {
//   for (let item of items) {
//     arr.splice(arr.indexOf(item), 1)
//   }
//   return arr
// }

// /**
//  * Will mutate an array to remove items, based on a function
//  * @param arr
//  * @param fn
//  * @returns
//  */
// export function pullWith<T>(arr: T[], fn: (item: T) => boolean) {
//   pull(arr, ...arr.filter((item) => fn(item)))
//   return arr
// }

export function rectContainsRect(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  box: { x: number; y: number; width: number; height: number }
) {
  return !(
    x0 > box.x ||
    x1 < box.x + box.width ||
    y0 > box.y ||
    y1 < box.y + box.height
  )
}

export function getTouchDisplay() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  )
}

const rounds = [1, 10, 100, 1000]

export function round(n: number, p = 2) {
  return Math.floor(n * rounds[p]) / rounds[p]
}

/**
 * Linear interpolation betwen two numbers.
 * @param y1
 * @param y2
 * @param mu
 */
export function lerp(y1: number, y2: number, mu: number) {
  mu = clamp(mu, 0, 1)
  return y1 * (1 - mu) + y2 * mu
}

/**
 * Modulate a value between two ranges.
 * @param value
 * @param rangeA from [low, high]
 * @param rangeB to [low, high]
 * @param clamp
 */
export function modulate(
  value: number,
  rangeA: number[],
  rangeB: number[],
  clamp = false
) {
  const [fromLow, fromHigh] = rangeA
  const [v0, v1] = rangeB
  const result = v0 + ((value - fromLow) / (fromHigh - fromLow)) * (v1 - v0)

  return clamp
    ? v0 < v1
      ? Math.max(Math.min(result, v1), v0)
      : Math.max(Math.min(result, v0), v1)
    : result
}

/**
 * Clamp a value into a range.
 * @param n
 * @param min
 */
export function clamp(n: number, min: number): number
export function clamp(n: number, min: number, max: number): number
export function clamp(n: number, min: number, max?: number): number {
  return Math.max(min, typeof max !== "undefined" ? Math.min(n, max) : n)
}

// CURVES
// Mostly adapted from https://github.com/Pomax/bezierjs

export function computePointOnCurve(t: number, points: number[][]) {
  // shortcuts
  if (t === 0) {
    return points[0]
  }

  const order = points.length - 1

  if (t === 1) {
    return points[order]
  }

  const mt = 1 - t
  let p = points // constant?

  if (order === 0) {
    return points[0]
  } // linear?

  if (order === 1) {
    return [mt * p[0][0] + t * p[1][0], mt * p[0][1] + t * p[1][1]]
  } // quadratic/cubic curve?

  if (order < 4) {
    let mt2 = mt * mt,
      t2 = t * t,
      a: number,
      b: number,
      c: number,
      d = 0

    if (order === 2) {
      p = [p[0], p[1], p[2], [0, 0]]
      a = mt2
      b = mt * t * 2
      c = t2
    } else if (order === 3) {
      a = mt2 * mt
      b = mt2 * t * 3
      c = mt * t2 * 3
      d = t * t2
    }

    return [
      a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0],
      a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1],
    ]
  } // higher order curves: use de Casteljau's computation
}

// Generate a lookup table by sampling the curve.
function getBezierCurveLUT(points: number[][], samples = 100) {
  return Array.from(Array(samples)).map((_, i) =>
    computePointOnCurve(i / (samples - 1 - i), points)
  )
}

// Find the closest point among points in a lookup table
function closestPointInLUT(A: number[], LUT: number[][]) {
  let mdist = Math.pow(2, 63),
    mpos: number,
    d: number
  LUT.forEach(function(p, idx) {
    d = vec.dist(A, p)

    if (d < mdist) {
      mdist = d
      mpos = idx
    }
  })
  return {
    mdist: mdist,
    mpos: mpos,
  }
}

export function getNearestPointOnCurve(A: number[], points: number[][]) {
  // Create lookup table
  const LUT = getBezierCurveLUT(points)

  // step 1: coarse check
  const l = LUT.length - 1,
    closest = closestPointInLUT(A, LUT),
    mpos = closest.mpos,
    t1 = (mpos - 1) / l,
    t2 = (mpos + 1) / l,
    step = 0.1 / l // step 2: fine check

  let mdist = closest.mdist,
    t = t1,
    ft = t,
    p: number[]
  mdist += 1

  for (let d: number; t < t2 + step; t += step) {
    p = computePointOnCurve(t, points)
    d = vec.dist(A, p)

    if (d < mdist) {
      mdist = d
      ft = t
    }
  }

  ft = ft < 0 ? 0 : ft > 1 ? 1 : ft
  p = computePointOnCurve(ft, points)
  // p.t = ft
  // p.d = mdist
  return p
}

function distance2(p: DOMPoint, point: number[]) {
  var dx = p.x - point[0],
    dy = p.y - point[1]
  return dx * dx + dy * dy
}

/**
 * Find the closest point on a path to an off-path point.
 * @param pathNode
 * @param point
 * @returns
 */
export function getClosestPointOnPath(
  pathNode: SVGPathElement,
  point: number[]
) {
  var pathLen = pathNode.getTotalLength(),
    p = 8,
    best: DOMPoint,
    bestLen: number,
    bestDist = Infinity

  // linear scan for coarse approximation
  for (
    var scan: DOMPoint, scanLen = 0, scanDist: number;
    scanLen <= pathLen;
    scanLen += p
  ) {
    if (
      (scanDist = distance2(
        (scan = pathNode.getPointAtLength(scanLen)),
        point
      )) < bestDist
    ) {
      ;(best = scan), (bestLen = scanLen), (bestDist = scanDist)
    }
  }

  // binary search for precise estimate
  p /= 2
  while (p > 0.5) {
    var before: DOMPoint,
      after: DOMPoint,
      bl: number,
      al: number,
      bd: number,
      ad: number
    if (
      (bl = bestLen - p) >= 0 &&
      (bd = distance2((before = pathNode.getPointAtLength(bl)), point)) <
        bestDist
    ) {
      ;(best = before), (bestLen = bl), (bestDist = bd)
    } else if (
      (al = bestLen + p) <= pathLen &&
      (ad = distance2((after = pathNode.getPointAtLength(al)), point)) <
        bestDist
    ) {
      ;(best = after), (bestLen = al), (bestDist = ad)
    } else {
      p /= 2
    }
  }

  return {
    point: [best.x, best.y],
    distance: bestDist,
    length: (bl + al) / 2,
    t: (bl + al) / 2 / pathLen,
  }
}

export function det(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  g: number,
  h: number,
  i: number
) {
  return a * e * i + b * f * g + c * d * h - a * f * h - b * d * i - c * e * g
}

// Get a circle from three points.
export function circleFromThreePoints(A: number[], B: number[], C: number[]) {
  var a = det(A[0], A[1], 1, B[0], B[1], 1, C[0], C[1], 1)

  var bx = -det(
    A[0] * A[0] + A[1] * A[1],
    A[1],
    1,
    B[0] * B[0] + B[1] * B[1],
    B[1],
    1,
    C[0] * C[0] + C[1] * C[1],
    C[1],
    1
  )
  var by = det(
    A[0] * A[0] + A[1] * A[1],
    A[0],
    1,
    B[0] * B[0] + B[1] * B[1],
    B[0],
    1,
    C[0] * C[0] + C[1] * C[1],
    C[0],
    1
  )
  var c = -det(
    A[0] * A[0] + A[1] * A[1],
    A[0],
    A[1],
    B[0] * B[0] + B[1] * B[1],
    B[0],
    B[1],
    C[0] * C[0] + C[1] * C[1],
    C[0],
    C[1]
  )
  return [
    -bx / (2 * a),
    -by / (2 * a),
    Math.sqrt(bx * bx + by * by - 4 * a * c) / (2 * Math.abs(a)),
  ]
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
) {
  let inThrottle: boolean, lastFn: any, lastTime: number
  return function() {
    const context = this,
      args = arguments
    if (!inThrottle) {
      fn.apply(context, args)
      lastTime = Date.now()
      inThrottle = true
    } else {
      clearTimeout(lastFn)
      lastFn = setTimeout(function() {
        if (Date.now() - lastTime >= wait) {
          fn.apply(context, args)
          lastTime = Date.now()
        }
      }, Math.max(wait - (Date.now() - lastTime), 0))
    }
  }
}

// Get element bounding boxes
// export const getBounds = (elements: SVGPathElement[]) => {
//   let bounds: IBounds = {
//     x: 0,
//     y: 0,
//     maxX: 0,
//     maxY: 0,
//     width: 0,
//     height: 0,
//   }

//   for (let i = 0; i < elements.length; i++) {
//     const elm = elements[i]

//     const bbox = elm.getBBox()

//     if (i === 0) {
//       bounds = {
//         x: bbox.x,
//         y: bbox.y,
//         maxX: bbox.x + bbox.width,
//         maxY: bbox.y + bbox.height,
//         width: 0,
//         height: 0,
//       }
//       continue
//     }

//     bounds.x = Math.min(bounds.x, bbox.x)
//     bounds.y = Math.min(bounds.y, bbox.y)
//     bounds.maxX = Math.max(bounds.maxX, bbox.x + bbox.width)
//     bounds.maxY = Math.max(bounds.maxY, bbox.y + bbox.height)
//   }

//   bounds.width = Math.abs(bounds.maxX - bounds.x)
//   bounds.height = Math.abs(bounds.maxY - bounds.y)

//   return bounds
// }

function getSnapshots(
  nodes: INode[],
  bounds: IBounds
): Record<string, INodeSnapshot> {
  const acc = {} as Record<string, INodeSnapshot>

  for (let node of nodes) {
    let {
      radius,
      point: [x, y],
    } = node

    acc[node.id] = {
      id: node.id,
      x: x,
      y: y,
      nx: (x - bounds.x) / bounds.width,
      ny: (y - bounds.y) / bounds.height,
      nmx: 1 - (x - bounds.x) / bounds.width,
      nmy: 1 - (y - bounds.y) / bounds.height,
      nw: radius / bounds.width,
      nh: radius / bounds.height,
      radius,
    }
  }

  return acc
}

function getSnapglobs(globs: IGlob[], bounds: IBounds) {
  return Object.fromEntries(
    globs.map((glob) => {
      let {
        D: [dx, dy],
        Dp: [dpx, dpy],
      } = glob.options

      return [
        glob.id,
        {
          D: {
            x: dx,
            y: dy,
            nx: (dx - bounds.x) / bounds.width,
            ny: (dy - bounds.y) / bounds.height,
            nmx: 1 - (dx - bounds.x) / bounds.width,
            nmy: 1 - (dy - bounds.y) / bounds.height,
          },
          Dp: {
            x: dpx,
            y: dpy,
            nx: (dpx - bounds.x) / bounds.width,
            ny: (dpy - bounds.y) / bounds.height,
            nmx: 1 - (dpx - bounds.x) / bounds.width,
            nmy: 1 - (dpy - bounds.y) / bounds.height,
          },
          a: glob.options.a,
          ap: glob.options.ap,
          b: glob.options.b,
          bp: glob.options.bp,
        },
      ]
    })
  )
}

export function getEdgeResizer(
  initialNodes: INode[],
  initialGlobs: IGlob[],
  bounds: IBounds,
  edge: number
) {
  if (initialNodes.length === 0 && initialGlobs.length === 0) {
    throw Error("Must have at least one thing!")
  }

  if (!bounds) {
    throw Error("Must have bounds!")
  }

  const snapshots = getSnapshots(initialNodes, bounds)
  const snapglobs = getSnapglobs(initialGlobs, bounds)

  let { x: x0, y: y0, maxX: x1, maxY: y1 } = bounds
  let { maxX: mx, maxY: my, width: mw, height: mh } = bounds

  return function edgeResize(
    point: number[],
    nodes: INode[],
    globs: IGlob[],
    preserveRadii = false
  ) {
    const [x, y] = point
    if (edge === 0 || edge === 2) {
      edge === 0 ? (y0 = y) : (y1 = y)
      my = y0 < y1 ? y0 : y1
      mh = Math.abs(y1 - y0)

      for (let node of nodes) {
        const { ny, nmy, nw, nh } = snapshots[node.id]
        node.point[1] = round(my + (y1 < y0 ? nmy : ny) * mh)
        if (!preserveRadii) {
          node.radius = (nw * mw + nh * mh) / 2
        } else {
          node.radius = snapshots[node.id].radius
        }
      }

      for (let glob of globs) {
        const { D, Dp, a, b, ap, bp } = snapglobs[glob.id]

        if (y1 < y0) {
          Object.assign(glob.options, {
            D: [Dp.x, my + Dp.nmy * mh],
            Dp: [D.x, my + D.nmy * mh],
            a: ap,
            ap: a,
            b: bp,
            bp: b,
          })
        } else {
          Object.assign(glob.options, {
            D: [D.x, my + D.ny * mh],
            Dp: [Dp.x, my + Dp.ny * mh],
            a,
            ap,
            b,
            bp,
          })
        }
      }
    } else {
      edge === 1 ? (x1 = x) : (x0 = x)
      mx = x0 < x1 ? x0 : x1
      mw = Math.abs(x1 - x0)
      for (let node of nodes) {
        const { nx, nmx, nw, nh } = snapshots[node.id]
        node.point[0] = round(mx + (x1 < x0 ? nmx : nx) * mw)

        if (!preserveRadii) {
          node.radius = (nw * mw + nh * mh) / 2
        } else {
          node.radius = snapshots[node.id].radius
        }
      }

      for (let glob of globs) {
        const { D, Dp, a, b, ap, bp } = snapglobs[glob.id]

        if (x1 < x0) {
          Object.assign(glob.options, {
            D: [mx + Dp.nmx * mw, Dp.y],
            Dp: [mx + D.nmx * mw, D.y],
            a: ap,
            ap: a,
            b: bp,
            bp: b,
          })
        } else {
          Object.assign(glob.options, {
            D: [mx + D.nx * mw, D.y],
            Dp: [mx + Dp.nx * mw, Dp.y],
            a,
            ap,
            b,
            bp,
          })
        }
      }
    }
  }
}

/**
 * Returns a function that can be used to calculate corner resize transforms.
 * @param boxes An array of the boxes being resized.
 * @param corner A number representing the corner being dragged. Top Left: 0, Top Right: 1, Bottom Right: 2, Bottom Left: 3.
 * @example
 * const resizer = getCornerResizer(selectedBoxes, 3)
 * resizer(selectedBoxes, )
 */
export function getCornerResizer(
  initialNodes: INode[],
  initialGlobs: IGlob[],
  bounds: IBounds,
  corner: number
) {
  if (initialNodes.length === 0 && initialGlobs.length === 0) {
    throw Error("Must have at least one thing!")
  }

  if (!bounds) {
    throw Error("Must have bounds!")
  }

  const snapshots = getSnapshots(initialNodes, bounds)
  const snapglobs = getSnapglobs(initialGlobs, bounds)

  let { x: x0, y: y0, maxX: x1, maxY: y1 } = bounds
  let { maxX: mx, maxY: my, width: mw, height: mh } = bounds

  return function cornerResizer(
    point: number[],
    nodes: INode[],
    globs: IGlob[],
    preserveRadii = false
  ) {
    const [x, y] = point
    corner < 2 ? (y0 = y) : (y1 = y)
    my = y0 < y1 ? y0 : y1
    mh = Math.abs(y1 - y0)

    corner === 1 || corner === 2 ? (x1 = x) : (x0 = x)
    mx = x0 < x1 ? x0 : x1
    mw = Math.abs(x1 - x0)

    for (let node of nodes) {
      const { nx, nmx, ny, nmy, nw, nh } = snapshots[node.id]
      node.point = vec.round([
        mx + (x1 < x0 ? nmx : nx) * mw,
        my + (y1 < y0 ? nmy : ny) * mh,
      ])
      if (!preserveRadii) {
        node.radius = (nw * mw + nh * mh) / 2
      } else {
        node.radius = snapshots[node.id].radius
      }
    }

    for (let glob of globs) {
      const { D, Dp, a, ap, b, bp } = snapglobs[glob.id]

      Object.assign(glob.options, {
        a: a,
        ap: ap,
        b: b,
        bp: bp,
      })

      if (x1 < x0 && y1 < y0) {
        Object.assign(glob.options, {
          D: [mx + D.nmx * mw, my + D.nmy * mh],
          Dp: [mx + Dp.nmx * mw, my + Dp.nmy * mh],
          a,
          ap,
          b,
          bp,
        })
      } else if (x1 < x0) {
        Object.assign(glob.options, {
          D: [mx + Dp.nmx * mw, my + Dp.ny * mh],
          Dp: [mx + D.nmx * mw, my + D.ny * mh],
          a: ap,
          ap: a,
          b: bp,
          bp: b,
        })
      } else if (y1 < y0) {
        Object.assign(glob.options, {
          D: [mx + Dp.nx * mw, my + Dp.nmy * mh],
          Dp: [mx + D.nx * mw, my + D.nmy * mh],
          a: ap,
          ap: a,
          b: bp,
          bp: b,
        })
      } else {
        Object.assign(glob.options, {
          D: [mx + D.nx * mw, my + D.ny * mh],
          Dp: [mx + Dp.nx * mw, my + Dp.ny * mh],
          a,
          ap,
          b,
          bp,
        })
      }
    }
  }
}

export function getCornerRotater(
  initialNodes: INode[],
  initialGlobs: IGlob[],
  point: number[],
  bounds: IBounds
) {
  const center = [bounds.x + bounds.width / 2, bounds.y + bounds.height / 2]
  const snapshots = getSnapshots(initialNodes, bounds)
  const snapglobs = getSnapglobs(initialGlobs, bounds)
  const angle = vec.angle(point, center)

  return function cornerRotate(
    point: number[],
    nodes: INode[],
    globs: IGlob[]
  ) {
    const delta = angleDelta(angle, vec.angle(point, center))
    for (let node of nodes) {
      const snap = snapshots[node.id]
      node.point = rotatePoint([snap.x, snap.y], center, delta)
    }

    for (let glob of globs) {
      const snap = snapglobs[glob.id]
      glob.options.D = rotatePoint([snap.D.x, snap.D.y], center, delta)
      glob.options.Dp = rotatePoint([snap.Dp.x, snap.Dp.y], center, delta)
    }
  }
}

export type EdgeResizer = ReturnType<typeof getEdgeResizer>
export type CornerResizer = ReturnType<typeof getCornerResizer>
export type CornerRotater = ReturnType<typeof getCornerRotater>

export function getGlobOutline(
  { C0, r0, C1, r1, E0, E1, F0, F1, E0p, E1p, F0p, F1p }: IGlobPoints,
  startCap: "round" | "flat" = "round",
  endCap: "round" | "flat" = "round"
) {
  return [
    svg.moveTo(E0),
    startCap === "round" ? svg.arcTo(C0, r0, E0, E0p) : svg.lineTo(E0p),
    svg.bezierTo(F0p, F1p, E1p),
    endCap === "round" ? svg.arcTo(C1, r1, E1p, E1) : svg.lineTo(E1),
    svg.bezierTo(F1, F0, E0),
  ].join(" ")
}

export function getBezierCircleIntersections(
  p1: number[],
  p2: number[],
  p3: number[],
  p4: number[],
  center: number[],
  radius: number
) {
  return Intersection.intersect(
    ShapeInfo.cubicBezier({ p1, p2, p3, p4 }),
    ShapeInfo.circle({ center, radius })
  )
}

export function getBezierLineSegmentIntersections(
  p1: number[],
  p2: number[],
  p3: number[],
  p4: number[],
  start: number[],
  end: number[]
) {
  return Intersection.intersect(
    ShapeInfo.cubicBezier({ p1, p2, p3, p4 }),
    ShapeInfo.line({ p1: start, p2: end })
  )
}
