// Includes a lot of extras here.
import * as svg from "./svg"
import { IGlob, IGlobPath, INode, IVector } from "./types"
import {
  tangent,
  angle,
  lrp,
  dist,
  sub,
  len,
  add,
  mul,
  per,
  uni,
  div,
  mulV,
} from "./vec"

// A helper for getting tangents.
export function getCircleTangentToPoint(
  A: number[],
  r0: number,
  P: number[],
  side: number
) {
  const B = lrp(A, P, 0.5),
    r1 = dist(A, B),
    delta = sub(B, A),
    d = len(delta)

  if (!(d <= r0 + r1 && d >= Math.abs(r0 - r1))) {
    return
  }

  const a = (r0 * r0 - r1 * r1 + d * d) / (2.0 * d),
    n = 1 / d,
    p = add(A, mul(delta, a * n)),
    h = Math.sqrt(r0 * r0 - a * a),
    k = mul(per(delta), h * n)

  return side === 0 ? add(p, k) : sub(p, k)
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
  const v = sub(C, P)
  return sub(C, mul(div(v, len(v)), r + padding))
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
export function rotatePoint(
  x: number,
  y: number,
  cx: number,
  cy: number,
  angle: number
) {
  const s = Math.sin(angle)
  const c = Math.cos(angle)

  const px = x - cx
  const py = y - cy

  const nx = px * c - py * s
  const ny = px * s + py * c

  return [nx + cx, ny + cy]
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
  return angleDelta(angle(C, A), angle(C, B))
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
): IGlobPath {
  // Get end points
  const E0 = getCircleTangentToPoint(C0, r0, D, 0),
    E0p = getCircleTangentToPoint(C0, r0, Dp, 1),
    E1 = getCircleTangentToPoint(C1, r1, D, 1),
    E1p = getCircleTangentToPoint(C1, r1, Dp, 0)

  // Get control points
  const F0 = lrp(E0, D, a),
    F1 = lrp(E1, D, b),
    F0p = lrp(E0p, Dp, ap),
    F1p = lrp(E1p, Dp, bp)

  // Get inner / outer normal points
  let N0 = tangent(C0, lrp(E0, E0p, 0.5)),
    N0p = mul(N0, -1),
    N1 = tangent(lrp(E1, E1p, 0.5), C1),
    N1p = mul(N1, -1)

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
  }
}

export function deepCompare<T>(a: T, b: T) {
  return JSON.stringify(a) === JSON.stringify(b)
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
  const a0 = angle(C0, C1)
  const d = dist(C0, C1)

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
