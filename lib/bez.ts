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
  A: number[],
  B: number[],
  C: number[],
  D: number[],
  t: number
) {
  return [bez1d(A[0], B[0], C[0], D[0], t), bez1d(A[1], B[1], C[1], D[1], t)]
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
    x: xl,
    y: yl,
    maxX: xh,
    maxY: yh,
    width: Math.abs(xl - xh),
    height: Math.abs(yl - yh),
  }
}

// getPointAt(t, p1, pc, p2) {
// 	const x = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * pc.x + t * t * p2.x
// 	const y = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * pc.y + t * t * p2.y

// 	return { x, y };
// }

// getDerivativeAt(t, p1, pc, p2) {
// 	const d1 = { x: 2 * (pc.x - p1.x), y: 2 * (pc.y - p1.y) };
// 	const d2 = { x: 2 * (p2.x - pc.x), y: 2 * (p2.y - pc.y) };

// 	const x = (1 - t) * d1.x + t * d2.x;
// 	const y = (1 - t) * d1.y + t * d2.y;

// 	return { x, y };
// }

// getNormalAt(t, p1, pc, p2) {
// 	const d = getDerivativeAt(t, p1, pc, p2);
// 	const q = sqrt(d.x * d.x + d.y * d.y);

// 	const x = -d.y / q;
// 	const y = d.x / q;

// 	return { x, y };
// }
