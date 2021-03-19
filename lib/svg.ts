// Some helpers for drawing SVGs.

import * as Vec from "./vec"
import { angleDelta, getSweep } from "utils"

// General

export function ellipse(A: number[], r: number) {
  return `
      M ${A[0] - r},${A[1]}
      a ${r},${r} 0 1,0 ${r * 2},0
      a ${r},${r} 0 1,0 -${r * 2},0
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

export function arcTo(C: number[], r: number, A: number[], B: number[]) {
  return [
    moveTo(A),
    "A",
    r,
    r,
    0,
    getSweep(C, A, B) > 0 ? "1" : "0",
    0,
    B[0],
    B[1],
  ].join(" ")
}
export function closePath() {
  return "Z"
}

export function rectTo(A: number[]) {
  return ["R", A[0], A[1]].join(" ")
}
