import { IBounds, ICanvasItems, IGlob, INode } from "./types"
import { v4 as uuid } from "uuid"
import { clamp } from "./utils"

const nodes = new Set<Node>([])
const globs = new Set<Glob>([])

interface Point {
  x: number
  y: number
}

class Utils {
  static getRayRayIntersection(p0: Vector, n0: Vector, p1: Vector, n1: Vector) {
    const p0e = Vector.add(p0, n0),
      p1e = Vector.add(p1, n1),
      m0 = (p0e.y - p0.y) / (p0e.x - p0.x),
      m1 = (p1e.y - p1.y) / (p1e.x - p1.x),
      b0 = p0.y - m0 * p0.x,
      b1 = p1.y - m1 * p1.x,
      x = (b1 - b0) / (m0 - m1),
      y = m0 * x + b0

    return new Vector({ x, y })
  }

  static getCircleTangentToPoint(
    A: Point | Vector,
    r0: number,
    P: Point | Vector,
    side: number
  ) {
    const v0 = Vector.cast(A)
    const v1 = Vector.cast(P)
    const B = Vector.lrp(v0, v1, 0.5),
      r1 = Vector.dist(v0, B),
      delta = Vector.sub(B, v0),
      d = Vector.len(delta)

    if (!(d <= r0 + r1 && d >= Math.abs(r0 - r1))) {
      return
    }

    const a = (r0 * r0 - r1 * r1 + d * d) / (2.0 * d),
      n = 1 / d,
      p = Vector.add(v0, Vector.mul(delta, a * n)),
      h = Math.sqrt(r0 * r0 - a * a),
      k = Vector.mul(Vector.per(delta), h * n)

    return side === 0 ? p.add(k) : p.sub(k)
  }

  static shortAngleDist(a: number, b: number) {
    const max = Math.PI * 2
    const da = (b - a) % max
    return ((2 * da) % max) - da
  }

  static getSweep(C: Vector, A: Vector, B: Vector) {
    return Utils.shortAngleDist(Vector.ang(C, A), Vector.ang(C, B))
  }

  static bez1d(a: number, b: number, c: number, d: number, t: number) {
    return (
      a * (1 - t) * (1 - t) * (1 - t) +
      3 * b * t * (1 - t) * (1 - t) +
      3 * c * t * t * (1 - t) +
      d * t * t * t
    )
  }

  static getCubicBezierBounds(
    p0: Point | Vector,
    c0: Point | Vector,
    c1: Point | Vector,
    p1: Point | Vector
  ): IBounds {
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
      const t1 = (-b + Math.sqrt(disc)) / (2 * a)
      if (t1 > 0 && t1 < 1) {
        const x1 = Utils.bez1d(p0[0], c0[0], c1[0], p1[0], t1)
        if (x1 < xl) xl = x1
        if (x1 > xh) xh = x1
      }
      const t2 = (-b - Math.sqrt(disc)) / (2 * a)
      if (t2 > 0 && t2 < 1) {
        const x2 = Utils.bez1d(p0[0], c0[0], c1[0], p1[0], t2)
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
      const t1 = (-b + Math.sqrt(disc)) / (2 * a)
      if (t1 > 0 && t1 < 1) {
        const y1 = Utils.bez1d(p0[1], c0[1], c1[1], p1[1], t1)
        if (y1 < yl) yl = y1
        if (y1 > yh) yh = y1
      }
      const t2 = (-b - Math.sqrt(disc)) / (2 * a)
      if (t2 > 0 && t2 < 1) {
        const y2 = Utils.bez1d(p0[1], c0[1], c1[1], p1[1], t2)
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

  static getExpandedBounds(a: IBounds, b: IBounds) {
    const minX = Math.min(a.minX, b.minX),
      minY = Math.min(a.minY, b.minY),
      maxX = Math.max(a.maxX, b.maxX),
      maxY = Math.max(a.maxY, b.maxY),
      width = Math.abs(maxX - minX),
      height = Math.abs(maxY - minY)

    return { minX, minY, maxX, maxY, width, height }
  }

  static getCommonBounds(...b: IBounds[]) {
    if (b.length < 2) return b[0]

    let bounds = b[0]

    for (let i = 1; i < b.length; i++) {
      bounds = Utils.getExpandedBounds(bounds, b[i])
    }

    return bounds
  }
}

interface VectorOptions {
  x: number
  y: number
}

class Vector {
  x = 0
  y = 0

  constructor(x: number, y: number)
  constructor(vector: Vector, b?: undefined)
  constructor(options: Point, b?: undefined)
  constructor(a: VectorOptions | Vector | number, b?: number) {
    if (typeof a === "number") {
      this.x = a
      this.y = b
    } else {
      const { x = 0, y = 0 } = a
      this.x = x
      this.y = y
    }
  }

  set(v: Vector | Point) {
    this.x = v.x
    this.y = v.y
  }

  copy() {
    return new Vector(this)
  }

  clone() {
    return this.copy()
  }

  toArray() {
    return [this.x, this.y]
  }

  add(b: Vector) {
    this.x += b.x
    this.y += b.y
    return this
  }

  static add(a: Vector, b: Vector) {
    const n = new Vector(a)
    n.x += b.x
    n.y += b.y
    return n
  }

  sub(b: Vector) {
    this.x -= b.x
    this.y -= b.y
    return this
  }

  static sub(a: Vector, b: Vector) {
    const n = new Vector(a)
    n.x -= b.x
    n.y -= b.y
    return n
  }

  mul(b: number): Vector
  mul(b: Vector): Vector
  mul(b: Vector | number) {
    if (b instanceof Vector) {
      this.x *= b.x
      this.y *= b.y
    } else {
      this.x *= b
      this.y *= b
    }
    return this
  }

  mulScalar(b: number) {
    return this.mul(b)
  }

  static mulScalar(a: Vector, b: number) {
    return Vector.mul(a, b)
  }

  static mul(a: Vector, b: number): Vector
  static mul(a: Vector, b: Vector): Vector
  static mul(a: Vector, b: Vector | number) {
    const n = new Vector(a)
    if (b instanceof Vector) {
      n.x *= b.x
      n.y *= b.y
    } else {
      n.x *= b
      n.y *= b
    }
    return n
  }

  div(b: number): Vector
  div(b: Vector): Vector
  div(b: Vector | number) {
    if (b instanceof Vector) {
      if (b.x) {
        this.x /= b.x
      }
      if (b.y) {
        this.y /= b.y
      }
    } else {
      if (b) {
        this.x /= b
        this.y /= b
      }
    }
    return this
  }

  static div(a: Vector, b: number): Vector
  static div(a: Vector, b: Vector): Vector
  static div(a: Vector, b: Vector | number) {
    const n = new Vector(a)
    if (b instanceof Vector) {
      if (b.x) n.x /= b.x
      if (b.y) n.y /= b.y
    } else {
      if (b) {
        n.x /= b
        n.y /= b
      }
    }
    return n
  }

  divScalar(b: number) {
    return this.div(b)
  }

  static divScalar(a: Vector, b: number) {
    return Vector.div(a, b)
  }

  vec(b: Vector) {
    const { x, y } = this
    this.x = b.x - x
    this.y = b.y - y
    return this
  }

  static vec(a: Vector, b: Vector) {
    const n = new Vector(a)
    n.x = b.x - a.x
    n.y = b.y - a.y
    return n
  }

  pry(b: Vector) {
    return this.dpr(b) / b.len()
  }

  static pry(a: Vector, b: Vector) {
    return a.dpr(b) / b.len()
  }

  dpr(b: Vector) {
    return this.x * b.x + this.y * b.y
  }

  static dpr(a: Vector, b: Vector) {
    return a.x & (b.x + a.y * b.y)
  }

  cpr(b: Vector) {
    return this.x * b.y - b.y * this.y
  }

  static cpr(a: Vector, b: Vector) {
    return a.x * b.y - b.y * a.y
  }

  tangent(b: Vector) {
    return this.sub(b).uni()
  }

  static tangent(a: Vector, b: Vector) {
    const n = new Vector(a)
    return n.sub(b).uni()
  }

  dist2(b: Vector) {
    return this.sub(b).len2()
  }

  static dist2(a: Vector, b: Vector) {
    const n = new Vector(a)
    return n.sub(b).len2()
  }

  dist(b: Vector) {
    return Math.hypot(b.y - this.y, b.x - this.x)
  }

  static dist(a: Vector, b: Vector) {
    const n = new Vector(a)
    return Math.hypot(b.y - n.y, b.x - n.x)
  }

  ang(b: Vector) {
    return Math.atan2(b.y - this.y, b.x - this.x)
  }

  static ang(a: Vector, b: Vector) {
    const n = new Vector(a)
    return Math.atan2(b.y - n.y, b.x - n.x)
  }

  med(b: Vector) {
    return this.add(b).mul(0.5)
  }

  static med(a: Vector, b: Vector) {
    const n = new Vector(a)
    return n.add(b).mul(0.5)
  }

  rot(r: number) {
    const { x, y } = this
    this.x = x * Math.cos(r) - y * Math.sin(r)
    this.y = x * Math.sin(r) + y * Math.cos(r)
    return this
  }

  static rot(a: Vector, r: number) {
    const n = new Vector(a)
    n.x = a.x * Math.cos(r) - a.y * Math.sin(r)
    n.y = a.x * Math.sin(r) + a.y * Math.cos(r)
    return n
  }

  rotAround(b: Vector, r: number) {
    const { x, y } = this
    const s = Math.sin(r)
    const c = Math.cos(r)

    const px = x - b.x
    const py = y - b.y

    this.x = px * c - py * s + b.x
    this.y = px * s + py * c + b.y

    return this
  }

  static rotAround(a: Vector, b: Vector, r: number) {
    const n = new Vector(a)
    const s = Math.sin(r)
    const c = Math.cos(r)

    const px = n.x - b.x
    const py = n.y - b.y

    n.x = px * c - py * s + b.x
    n.y = px * s + py * c + b.y

    return n
  }

  lrp(b: Vector, t: number) {
    const n = new Vector(this)
    this.vec(b).mul(t).add(n)
  }

  static lrp(a: Vector, b: Vector, t: number) {
    const n = new Vector(a)
    n.vec(b).mul(t).add(a)
    return n
  }

  nudge(b: Vector, d: number) {
    this.add(b.mul(d))
  }

  static nudge(a: Vector, b: Vector, d: number) {
    const n = new Vector(a)
    return n.add(b.mul(d))
  }

  nudgeToward(b: Vector, d: number) {
    return this.nudge(Vector.vec(this, b).uni(), d)
  }

  static nudgeToward(a: Vector, b: Vector, d: number) {
    return Vector.nudge(a, Vector.vec(a, b).uni(), d)
  }

  int(b: Vector, from: number, to: number, s: number) {
    const t = (Math.max(from, to) - from) / (to - from)
    this.add(Vector.mul(this, 1 - t).add(Vector.mul(b, s)))
    return this
  }

  static int(a: Vector, b: Vector, from: number, to: number, s: number) {
    const n = new Vector(a)
    const t = (Math.max(from, to) - from) / (to - from)
    n.add(Vector.mul(a, 1 - t).add(Vector.mul(b, s)))
    return n
  }

  equals(b: Vector) {
    return this.x === b.x && this.y === b.y
  }

  static equals(a: Vector, b: Vector) {
    return a.x === b.x && a.y === b.y
  }

  abs() {
    this.x = Math.abs(this.x)
    this.y = Math.abs(this.y)
    return this
  }

  static abs(a: Vector) {
    const n = new Vector(a)
    n.x = Math.abs(n.x)
    n.y = Math.abs(n.y)
    return n
  }

  len() {
    return Math.hypot(this.x, this.y)
  }

  static len(a: Vector) {
    return Math.hypot(a.x, a.y)
  }

  len2() {
    return this.x * this.x + this.y * this.y
  }

  static len2(a: Vector) {
    return a.x * a.x + a.y * a.y
  }

  per() {
    const t = this.x
    this.x = this.y
    this.y = -t
    return this
  }

  static per(a: Vector) {
    const n = new Vector(a)
    n.x = n.y
    n.y = -a.x
    return n
  }

  neg() {
    this.x *= -1
    this.y *= -1
    return this
  }

  static neg(v: Vector) {
    const n = new Vector(v)
    n.x *= -1
    n.y *= -1
    return n
  }

  uni() {
    return this.div(this.len())
  }

  static uni(v: Vector) {
    const n = new Vector(v)
    return n.div(n.len())
  }

  isLeft(center: Vector, b: Vector) {
    return (
      (center.x - this.x) * (b.y - this.y) - (b.x - this.x) * (center.y - b.y)
    )
  }

  static isLeft(center: Vector, a: Vector, b: Vector) {
    return (center.x - a.x) * (b.y - a.y) - (b.x - a.x) * (center.y - b.y)
  }

  static ang3(center: Vector, a: Vector, b: Vector) {
    const v1 = Vector.vec(center, a)
    const v2 = Vector.vec(center, b)
    return Vector.ang(v1, v2)
  }

  static clockwise(center: Vector, a: Vector, b: Vector) {
    return Vector.isLeft(center, a, b) > 0
  }

  static cast(v: Point | Vector) {
    return "cast" in v ? v : new Vector(v)
  }

  static from(v: Vector) {
    return new Vector(v)
  }

  nearestPointOnLineThroughPoint(b: Vector, u: Vector) {
    return this.clone().add(u.clone().mul(Vector.sub(this, b).pry(u)))
  }

  static nearestPointOnLineThroughPoint(a: Vector, b: Vector, u: Vector) {
    return a.clone().add(u.clone().mul(Vector.sub(a, b).pry(u)))
  }

  distanceToLineThroughPoint(b: Vector, u: Vector) {
    return this.dist(Vector.nearestPointOnLineThroughPoint(b, u, this))
  }

  static distanceToLineThroughPoint(a: Vector, b: Vector, u: Vector) {
    return a.dist(Vector.nearestPointOnLineThroughPoint(b, u, a))
  }

  nearestPointOnLineSegment(p0: Vector, p1: Vector, clamp = true) {
    return Vector.nearestPointOnLineSegment(this, p0, p1, clamp)
  }

  static nearestPointOnLineSegment(
    a: Vector,
    p0: Vector,
    p1: Vector,
    clamp = true
  ) {
    const delta = Vector.sub(p1, p0)
    const length = delta.len()
    const u = Vector.div(delta, length)

    const pt = Vector.add(p0, Vector.mul(u, Vector.pry(Vector.sub(a, p0), u)))

    if (clamp) {
      const da = p0.dist(pt)
      const db = p1.dist(pt)

      if (db < da && da > length) return p1
      if (da < db && db > length) return p0
    }

    return pt
  }

  distanceToLineSegment(p0: Vector, p1: Vector, clamp = true) {
    return Vector.distanceToLineSegment(this, p0, p1, clamp)
  }

  static distanceToLineSegment(
    a: Vector,
    p0: Vector,
    p1: Vector,
    clamp = true
  ) {
    return Vector.dist(a, Vector.nearestPointOnLineSegment(a, p0, p1, clamp))
  }
}

type NodeOptions = {
  name?: string
  cap?: "flat" | "round"
  radius?: number
  parentId?: string
  locked?: boolean
} & ({ x: number; y: number } | { point: Vector })

class Node {
  readonly id = uuid()
  name = "Node"
  childIndex = 1
  locked = false
  parentId = "0"
  cap: "round" | "flat" = "round"
  point: Vector
  radius: number

  constructor(options = {} as NodeOptions) {
    if ("x" in options) {
      const { x = 0, y = 0 } = options
      this.point = new Vector({ x, y })
    } else {
      const { point = { x: 0, y: 0 } } = options
      this.point = new Vector(point)
    }

    const {
      name = "Node",
      cap = "round",
      locked = false,
      parentId = "0",
      radius = 25,
    } = options

    this.name = name
    this.cap = cap
    this.radius = radius
    this.locked = locked
    this.parentId = parentId

    nodes.add(this)
  }

  clone() {
    return new Node({
      point: Vector.from(this.point),
      radius: this.radius,
      cap: this.cap,
    })
  }

  destroy() {
    nodes.delete(this)
  }

  moveBy(v: Vector | Point) {
    const n = Vector.cast(v).clone()
    this.point.add(n)
  }

  moveTo(v: Vector) {
    const n = Vector.cast(v).clone()
    const vec = Vector.vec(this.point, n)
    this.moveBy(vec)
  }

  getBounds() {
    return {
      minX: this.point.x - this.radius,
      minY: this.point.y - this.radius,
      maxX: this.point.x + this.radius,
      maxY: this.point.y + this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
    }
  }

  get bounds() {
    return this.getBounds()
  }

  get x() {
    return this.point.x
  }

  set x(v: number) {
    this.point.x = v
  }

  get y() {
    return this.point.y
  }

  set y(v: number) {
    this.point.y = v
  }

  static cast(a: Node | Vector | Point) {
    if (a instanceof Node) {
      return a
    }

    return new Node({ x: a.x, y: a.y })
  }
}

interface GlobOptions {
  name: string
  start: Node | Vector | Point
  end: Node | Vector | Point
  D: Point | Vector
  Dp: Point | Vector
  a: number
  b: number
  ap: number
  bp: number
  parentId: string
  locked: boolean
}

class Glob {
  readonly id = uuid()
  childIndex = 1
  locked = false
  parentId = "0"
  name: string
  start: Node
  end: Node
  D: Vector
  Dp: Vector
  a: number
  b: number
  ap: number
  bp: number

  constructor(options = {} as Partial<GlobOptions>) {
    const {
      name = "Glob",
      parentId = "0",
      locked = false,
      a = 0.5,
      b = 0.5,
      ap = 0.5,
      bp = 0.5,
    } = options

    this.name = name
    this.start = Node.cast(options.start || { x: 0, y: 0 })
    this.end = Node.cast(options.end || { x: 0, y: 0 })
    this.D =
      options.D === undefined
        ? Vector.med(this.start.point, this.end.point)
        : Vector.cast(options.D)
    this.Dp =
      options.Dp === undefined
        ? Vector.med(this.start.point, this.end.point)
        : Vector.cast(options.Dp)
    this.a = clamp(a, 0, 1)
    this.b = clamp(b, 0, 1)
    this.ap = clamp(ap, 0, 1)
    this.bp = clamp(bp, 0, 1)
    this.parentId = parentId
    this.locked = locked

    globs.add(this)
  }

  destroy() {
    globs.delete(this)
  }

  get handleAngle() {
    return this.getHandleAngle()
  }

  getHandleAngle() {
    return Vector.ang(this.D, this.Dp)
  }

  get handleVector() {
    return this.getHandleVector()
  }

  getHandleVector() {
    return Vector.vec(this.D, this.Dp).uni()
  }

  get handleDistance() {
    return Vector.dist(this.D, this.Dp)
  }

  getHandleDistance() {
    return this.handleDistance
  }

  get handleMidpoint() {
    return Vector.med(this.D, this.Dp)
  }

  getHandleMidpoint() {
    return this.handleMidpoint
  }

  straighten = () => {
    const n = Vector.vec(this.start.point, this.end.point)
      .uni()
      .per()
      .mul((this.start.radius + this.end.radius) / 2)

    const center = Vector.med(this.start.point, this.end.point)
    this.D = center.clone().add(n)
    this.Dp = center.clone().sub(n)
    return this
  }

  pinch = () => {
    const mp = this.center
    this.D.set(mp)
    this.Dp.set(mp)
    return this
  }

  pinchBy = (distance = 0) => {
    const center = this.center
    if (this.D.equals(center)) {
      this.D.nudge(
        Vector.per(this.vector).neg(),
        Math.min(this.D.dist(center), distance)
      )
    } else {
      this.D.nudgeToward(center, Math.min(this.D.dist(center), distance))
    }

    if (this.Dp.equals(center)) {
      this.Dp.nudge(
        Vector.per(this.vector),
        Math.min(this.Dp.dist(center), distance)
      )
    } else {
      this.Dp.nudgeToward(center, Math.min(this.Dp.dist(center), distance))
    }
    return this
  }

  rotateHandles = (angle: number) => {
    this.D.rotAround(this.center, angle)
    this.Dp.rotAround(this.center, angle)
    return this
  }

  getBounds = () => {
    const { E0, F0, F1, E1, E0p, F0p, F1p, E1p } = this.getPoints()
    const b = Utils.getCubicBezierBounds(E0, F0, F1, E1)
    const bp = Utils.getCubicBezierBounds(E0p, F0p, F1p, E1p)
    const sb = this.start.getBounds()
    const eb = this.end.getBounds()

    return Utils.getCommonBounds(b, bp, sb, eb)
  }

  getPoints = () => {
    const {
      start: { point: C0, radius: r0 },
      end: { point: C1, radius: r1 },
      D,
      Dp,
      a,
      b,
      ap,
      bp,
    } = this

    let E0 = Utils.getCircleTangentToPoint(C0, r0, D, 0),
      E0p = Utils.getCircleTangentToPoint(C0, r0, Dp, 1),
      E1 = Utils.getCircleTangentToPoint(C1, r1, D, 1),
      E1p = Utils.getCircleTangentToPoint(C1, r1, Dp, 0)

    if (!(E0 || E0p)) {
      E0 = C0
      E0p = C0
    } else if (!E0) {
      E0 = E0p
    } else if (!E0p) {
      E0p = E0
    }

    if (!(E1 || E1p)) {
      E1 = C1
      E1p = C1
    } else if (!E1) {
      E1 = E1p
    } else if (!E1p) {
      E1p = E1
    }

    // Get control points
    const F0 = Vector.lrp(E0, D, a),
      F1 = Vector.lrp(E1, D, b),
      F0p = Vector.lrp(E0p, Dp, ap),
      F1p = Vector.lrp(E1p, Dp, bp)

    // Get inner / outer normal points
    let N0 = Vector.tangent(C0, Vector.lrp(E0, E0p, 0.5)),
      N0p = Vector.mul(N0, -1),
      N1 = Vector.tangent(Vector.lrp(E1, E1p, 0.5), C1),
      N1p = Vector.mul(N1, -1)

    if (Utils.getSweep(C0, E0, E0p) > 0) {
      ;[N0, N0p] = [N0p, N0]
    }

    if (Utils.getSweep(C1, E1, E1p) > 0) {
      ;[N1, N1p] = [N1p, N1]
    }

    return {
      C0,
      C1,
      D,
      Dp,
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
      r0,
      r1,
    }
  }

  moveBy(v: Vector | Point) {
    const n = Vector.cast(v).clone()
    this.D.add(n)
    this.Dp.add(n)
    this.start.point.add(n)
    this.end.point.add(n)
  }

  moveTo(v: Vector | Point) {
    const n = Vector.cast(v).clone()
    const vec = Vector.vec(this.center, n)
    this.moveBy(vec)
  }

  get vector() {
    return Vector.vec(this.start.point, this.end.point).uni()
  }

  getVector() {
    return this.vector
  }

  set center(v: Vector) {
    const n = Vector.cast(v).clone()
    this.moveTo(n)
  }

  get center() {
    return Vector.med(this.start.point, this.end.point)
  }

  setCenter(v: Vector | Point) {
    this.center = Vector.cast(v)
  }

  getCenter(): Vector {
    return this.center
  }

  static from(a: Node | Vector | Point, b: Node | Vector | Point) {
    return new Glob({ start: Node.cast(a), end: Node.cast(b) })
  }

  static chain(...a: (Node | Vector | Point)[]) {
    const globs: Glob[] = []

    if (a.length > 1) {
      const nodes = a.map((p) => Node.cast(p))
      for (let i = 1; i < nodes.length; i++) {
        globs.push(new Glob({ start: nodes[i - 1], end: nodes[i] }))
      }
    }

    return globs
  }

  static branch(a: Node | Vector | Point, ...b: (Node | Vector | Point)[]) {
    const n = Node.cast(a)

    const globs: Glob[] = []

    if (b.length > 0) {
      const nodes = b.map((p) => Node.cast(p))
      for (let i = 0; i < nodes.length; i++) {
        globs.push(new Glob({ start: n, end: nodes[i] }))
      }
    }

    return globs
  }
}

export default function evalCode(
  code: string
): { nodes: Record<string, INode>; globs: Record<string, IGlob> } {
  nodes.clear()
  globs.clear()

  Function(
    "Glob",
    "Node",
    "Vector",
    "Utils",
    code
    // `const fn = () => { ${code} }; fn();`
  )(Glob, Node, Vector, Utils)

  return {
    nodes: Object.fromEntries(
      Array.from(nodes.values()).map((node) => {
        const { id, name, radius, cap, locked, point, childIndex } = node
        return [
          id,
          {
            id,
            type: ICanvasItems.Node,
            name,
            point: point.toArray(),
            radius,
            cap,
            locked,
            parentId: "0",
            childIndex,
          },
        ]
      })
    ),
    globs: Object.fromEntries(
      Array.from(globs.values()).map((glob) => {
        const {
          id,
          name,
          start,
          end,
          D,
          Dp,
          a,
          b,
          ap,
          bp,
          childIndex,
          locked,
        } = glob
        return [
          glob.id,
          {
            id,
            name,
            type: ICanvasItems.Glob,
            nodes: [start.id, end.id],
            D: D.toArray(),
            Dp: Dp.toArray(),
            a,
            b,
            ap,
            bp,
            parentId: "0",
            childIndex,
            locked,
          },
        ]
      })
    ),
  }
}
