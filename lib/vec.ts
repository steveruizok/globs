// Vector Class
export type IVector = number[]

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

/**
 * Negate a vector.
 * @param A
 */
export function neg(A: IVector) {
  return [-A[0], -A[1]]
}

/**
 * Add vectors.
 * @param A
 * @param B
 */
export function add(A: IVector, B: IVector) {
  return [A[0] + B[0], A[1] + B[1]]
}

/**
 * Subtract vectors.
 * @param A
 * @param B
 */
export function sub(A: IVector, B: IVector) {
  return [A[0] - B[0], A[1] - B[1]]
}

/**
 * Get the vector from vectors A to B.
 * @param A
 * @param B
 */
export function vec(A: IVector, B: IVector) {
  // A, B as vectors get the vector from A to B
  return [B[0] - A[0], B[1] - A[1]]
}

/**
 * Vector multiplication by scalar
 * @param A
 * @param n
 */
export function mul(A: IVector, n: number) {
  // VECTOR MULTIPLICATION BY SCALAR
  return [A[0] * n, A[1] * n]
}

export function mulV(A: IVector, B: IVector) {
  return [A[0] * B[0], A[1] * B[1]]
}

/**
 * Vector division by scalar.
 * @param A
 * @param n
 */
export function div(A: IVector, n: number) {
  return [A[0] / n, A[1] / n]
}

/**
 * Vector division by vector.
 * @param A
 * @param n
 */
export function divV(A: IVector, B: IVector) {
  return [A[0] / B[0], A[1] / B[1]]
}

/**
 * Perpendicular rotation of a vector A
 * @param A
 */
export function per(A: IVector) {
  return [A[1], -A[0]]
}

/**
 * Dot product
 * @param A
 * @param B
 */
export function dpr(A: IVector, B: IVector) {
  return A[0] * B[0] + A[1] * B[1]
}

/**
 * Cross product (outer product) | A X B |
 * @param A
 * @param B
 */
export function cpr(A: IVector, B: IVector) {
  return A[0] * B[1] - B[0] * A[1]
}

/**
 * Length of the vector squared
 * @param A
 */
export function len2(A: IVector) {
  return A[0] * A[0] + A[1] * A[1]
}

/**
 * Length of the vector
 * @param A
 */
export function len(A: IVector) {
  return Math.hypot(A[0], A[1])
}

/**
 * Project A over B
 * @param A
 * @param B
 */
export function pry(A: IVector, B: IVector) {
  return dpr(A, B) / len(B)
}

/**
 * Get normalized / unit vector.
 * @param A
 */
export function uni(A: IVector) {
  return div(A, len(A))
}

/**
 * Get normalized / unit vector.
 * @param A
 */
export function normalize(A: IVector) {
  return uni(A)
}

/**
 * Get the tangent between two vectors.
 * @param A
 * @param B
 * @returns
 */
export function tangent(A: IVector, B: IVector) {
  return normalize(sub(A, B))
}

/**
 * Dist length from A to B squared.
 * @param A
 * @param B
 */
export function dist2(A: IVector, B: IVector) {
  var dif = sub(A, B)
  return dif[0] * dif[0] + dif[1] * dif[1]
}

/**
 * Dist length from A to B
 * @param A
 * @param B
 */
export function dist(A: IVector, B: IVector) {
  return Math.hypot(A[1] - B[1], A[0] - B[0])
}

/**
 * Angle between vector A and vector B in radians
 * @param A
 * @param B
 */
export function ang(A: IVector, B: IVector) {
  return Math.atan2(cpr(A, B), dpr(A, B))
}

/**
 * Angle between vector A and vector B in radians
 * @param A
 * @param B
 */
export function angle(A: IVector, B: IVector) {
  return Math.atan2(B[1] - A[1], B[0] - A[0])
}
/**
 * Mean between two vectors or mid vector between two vectors
 * @param A
 * @param B
 */
export function med(A: IVector, B: IVector) {
  return mul(add(A, B), 0.5)
}

/**
 * Vector rotation by r (radians)
 * @param A
 * @param r rotation in radians
 */
export function rot(A: IVector, r: number) {
  return [
    A[0] * Math.cos(r) - A[1] * Math.sin(r),
    A[1] * Math.cos(r) + A[0] * Math.sin(r),
  ]
}

/**
 * Rotate a vector around another vector by r (radians)
 * @param A vector
 * @param C center
 * @param r rotation in radians
 */
export function rotWith(A: IVector, C: IVector, r: number) {
  const s = Math.sin(r)
  const c = Math.cos(r)

  const px = A[0] - C[0]
  const py = A[1] - C[1]

  const nx = px * c - py * s
  const ny = px * s + py * c

  return [nx + C[0], ny + C[1]]
}

/**
 * Check of two vectors are identical.
 * @param A
 * @param B
 */
export function isEqual(A: IVector, B: IVector) {
  return A[0] === B[0] && A[1] === B[1]
}

/**
 * Interpolate vector A to B with a scalar t
 * @param A
 * @param B
 * @param t scalar
 */
export function lrp(A: IVector, B: IVector, t: number) {
  return add(A, mul(vec(A, B), t))
}

/**
 * Interpolate from A to B when curVAL goes fromVAL => to
 * @param A
 * @param B
 * @param from Starting value
 * @param to Ending value
 * @param s Strength
 */
export function int(A: IVector, B: IVector, from: number, to: number, s = 1) {
  var t = (clamp(from, to) - from) / (to - from)
  return add(mul(A, 1 - t), mul(B, s))
}

/**
 * Get the angle between the three vectors A, B, and C.
 * @param p1
 * @param pc
 * @param p2
 */
export function ang3(p1: IVector, pc: IVector, p2: IVector) {
  // this,
  var v1 = vec(pc, p1)
  var v2 = vec(pc, p2)
  return ang(v1, v2)
}

/**
 * Get whether p1 is left of p2, relative to pc.
 * @param p1
 * @param pc
 * @param p2
 */
export function isLeft(p1: IVector, pc: IVector, p2: IVector) {
  //  isLeft: >0 for counterclockwise
  //          =0 for none (degenerate)
  //          <0 for clockwise
  return (pc[0] - p1[0]) * (p2[1] - p1[1]) - (p2[0] - p1[0]) * (pc[1] - p1[1])
}

export function clockwise(p1: IVector, pc: IVector, p2: IVector) {
  return isLeft(p1, pc, p2) > 0
}

const rounds = [1, 10, 100, 1000]

export function round(a: IVector, d = 2) {
  return [
    Math.round(a[0] * rounds[d]) / rounds[d],
    Math.round(a[1] * rounds[d]) / rounds[d],
  ]
}
