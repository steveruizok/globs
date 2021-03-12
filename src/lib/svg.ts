// Some helpers for drawing SVGs.

import * as Vec from "./vector"
import { angleDelta } from "./utils"

export function ellipse(v: number[]) {
  return `
      M ${v[0] - v[2]},${v[1]}
      a ${v[2]},${v[2]} 0 1,0 ${v[2] * 2},0
      a ${v[2]},${v[2]} 0 1,0 -${v[2] * 2},0
    `
}

export function moveTo(v: number[]) {
  return `
      M ${v[0]},${v[1]}
    `
}

export function lineTo(v: number[]) {
  return `
      L ${v[0]},${v[1]}
    `
}

export function bezierTo(A: number[], B: number[], C: number[]) {
  return `
      C ${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}
    `
}

export function arcTo(C: number[], A: number[], B: number[]) {
  const sweep = angleDelta(Vec.angle(C, A), Vec.angle(C, B)) > 0 ? "1" : "0"

  return [moveTo(A), "A", C[2], C[2], 0, sweep, 0, B[0], B[1]].join(" ")
}
