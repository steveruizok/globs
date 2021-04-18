import * as vec from "./vec"

// Cubic Bezier Curves

// Evaluate a point along a 1d bezier curve.
export function bez1d(a: number, b: number, c: number, d: number, t: number) {
  return (
    a * (1 - t) * (1 - t) * (1 - t) +
    3 * b * t * (1 - t) * (1 - t) +
    3 * c * t * t * (1 - t) +
    d * t * t * t
  )
}

// Evaluate a point along a 2d bezier curve.
export function bez2d(
  p0: number[],
  c0: number[],
  c1: number[],
  p1: number[],
  t: number
) {
  return [
    bez1d(p0[0], c0[0], c1[0], p1[0], t),
    bez1d(p0[1], c0[1], c1[1], p1[1], t),
  ]
}

// Generate a lookup table by sampling the curve.
function getBezierCurveLUT(
  p0: number[],
  c0: number[],
  c1: number[],
  p1: number[],
  samples = 100
) {
  const lut: number[][] = [p0]
  for (let i = 0; i < samples + 1; i++) {
    lut.push(bez2d(p0, c0, c1, p1, i / samples))
  }
  return lut
}

// Find the closest point among points in a lookup table
function closestPointInLUT(A: number[], LUT: number[][]) {
  let mdist = Math.pow(2, 63),
    mpos: number,
    d: number

  for (let i = 0; i < LUT.length; i++) {
    d = vec.dist(A, LUT[i])

    if (d < mdist) {
      mdist = d
      mpos = i
    }
  }

  return { mdist, mpos }
}

export function computePointOnQuadBezCurve(
  p0: number[],
  c0: number[],
  c1: number[],
  p1: number[],
  t: number
) {
  if (t === 0) {
    return p0
  }

  if (t === 1) {
    return p1
  }

  const mt = 1 - t,
    mt2 = mt * mt,
    t2 = t * t,
    a = mt2 * mt,
    b = mt2 * t * 3,
    c = mt * t2 * 3,
    d = t * t2

  return [
    a * p0[0] + b * c0[0] + c * c1[0] + d * p1[0],
    a * p0[1] + b * c0[1] + c * c1[1] + d * p1[1],
  ]
}

export function getDistanceFromCurve(
  A: number[],
  p0: number[],
  c0: number[],
  c1: number[],
  p1: number[]
) {
  // Create lookup table
  const LUT = getBezierCurveLUT(p0, c0, c1, p1)

  // Step 1: Coarse Check
  const l = LUT.length - 1,
    closest = closestPointInLUT(A, LUT),
    mpos = closest.mpos, // Closest t
    t1 = (mpos - 1) / l,
    t2 = (mpos + 1) / l,
    step = 0.1 / l

  // Step 2: fine check
  let mdist = closest.mdist,
    t = t1,
    ft = t,
    p: number[]

  mdist += 1

  for (let d: number; t < t2 + step; t += step) {
    p = bez2d(p0, c0, c1, p1, t)
    d = vec.dist(A, p)

    if (d < mdist) {
      mdist = d
      ft = t
    }
  }

  ft = ft < 0 ? 0 : ft > 1 ? 1 : ft

  return {
    distance: mdist,
    t: ft,
  }
}

export function getNormalOnCurve(
  p0: number[],
  c0: number[],
  c1: number[],
  p1: number[],
  t: number
) {
  return vec.uni(
    vec.sub(
      bez2d(p0, c0, c1, p1, t + 0.0025),
      bez2d(p0, c0, c1, p1, t - 0.0025)
    )
  )
}

export function getClosestPointOnCurve(
  A: number[],
  p0: number[],
  c0: number[],
  c1: number[],
  p1: number[]
) {
  const { t, distance } = getDistanceFromCurve(A, p0, c0, c1, p1)
  return {
    point: bez2d(p0, c0, c1, p1, t),
    distance,
    t,
  }
}

/**
 * Get the length of a cubic bezier curve.
 * @param p0 The first point
 * @param c0 The first control point
 * @param c1 The second control point
 * @param p1 The last control point
 * @returns
 */
export function getCubicBezLength(
  p0: number[],
  c0: number[],
  c1: number[],
  p1: number[]
) {
  let len = 0
  let prev = p0
  let curr = p0

  for (let i = 1; i < 201; i++) {
    curr = bez2d(p0, c0, c1, p1, i / 200)
    len += vec.dist(prev, curr)
    prev = curr
  }

  return len
}

// Quadratic Bezier Curves

export function getQuadBezPointAt(
  t: number,
  p1: number[],
  pc: number[],
  p2: number[]
) {
  const x = (1 - t) * (1 - t) * p1[0] + 2 * (1 - t) * t * pc[0] + t * t * p2[0]
  const y = (1 - t) * (1 - t) * p1[1] + 2 * (1 - t) * t * pc[1] + t * t * p2[1]

  return { x, y }
}

export function getQuadBezDerivativeAt(
  t: number,
  p1: number[],
  pc: number[],
  p2: number[]
) {
  const d1 = { x: 2 * (pc[0] - p1[0]), y: 2 * (pc[1] - p1[1]) }
  const d2 = { x: 2 * (p2[0] - pc[0]), y: 2 * (p2[1] - pc[1]) }

  const x = (1 - t) * d1[0] + t * d2[0]
  const y = (1 - t) * d1[1] + t * d2[1]

  return { x, y }
}

export function getQuadBezNormalAt(
  t: number,
  p1: number[],
  pc: number[],
  p2: number[]
) {
  const d = getQuadBezDerivativeAt(t, p1, pc, p2)
  const q = Math.sqrt(d[0] * d[0] + d[1] * d[1])

  const x = -d[1] / q
  const y = d[0] / q

  return { x, y }
}
