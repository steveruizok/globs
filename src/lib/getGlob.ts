// The base "glob" shape
import { lrp, tangent, angle, mul } from "./vector";

import { angleDelta, getCircleTangentsToPoint } from "./utils";

function getTangentPoint(C: number[], P: number[], side: number) {
  const pts = getCircleTangentsToPoint(C, P);
  if (!pts) throw Error("Could not get tangent points for glob.");
  return side === -1 ? pts[0] : pts[1];
}

export function getGlob(
  // Circle A
  C0: number[],
  // Circle B
  C1: number[],
  // Target Point D
  D: number[],
  // Target Point D Prime
  DP: number[],
  // Control Scalars
  a: number,
  ap: number,
  b: number,
  bp: number
) {
  const E0 = getTangentPoint(C0, D, 1),
    E1 = getTangentPoint(C1, D, -1),
    E0p = getTangentPoint(C0, DP, -1),
    E1p = getTangentPoint(C1, DP, 1),
    F0 = lrp(E0, D, a),
    F1 = lrp(E1, D, b),
    F0p = lrp(E0p, DP, ap),
    F1p = lrp(E1p, DP, bp),
    n0 = tangent(C0, lrp(E0, E0p, 0.5)),
    n1 = tangent(lrp(E1, E1p, 0.5), C1);

  return {
    C0,
    C1,
    E0,
    E1,
    E0p,
    E1p,
    F0,
    F1,
    F0p,
    F1p,
    n0: angleDelta(angle(C0, E0), angle(C0, E0p)) > 0 ? n0 : mul(n0, -1),
    n1: angleDelta(angle(C1, E1), angle(C1, E1p)) > 0 ? n1 : mul(n1, -1)
  };
}
