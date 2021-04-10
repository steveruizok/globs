import { IData, IGlob, INode } from "lib/types"
import inputs from "lib/inputs"
import * as vec from "lib/vec"
import { pointInRect } from "lib/utils"

const MIN_SPEED = 5, // Min length of vector (in screen space) to start snapping
  SNAP_DISTANCE = 4 // Min distance (in screen space) to make a snap

type SnapResult = {
  id: string
  from: number[]
  to: number[]
}

export default function getNodeSnapper(
  node: INode,
  nodes: INode[],
  globs: IGlob[]
) {
  // Since we'll be using a closure, create a not-proxy copy of the data.
  const iPoint = [...node.point]
  const r = node.radius
  const iNodes = nodes
    .filter(({ id }) => id !== node.id)
    .map(({ id, point, radius }) => ({
      id,
      point: [...point],
      radius,
    }))

  // The delta here should be in world space!
  // let delta = vec.div(vec.vec(pointer.origin, pointer.point), camera.zoom)
  return function getSnap(
    delta: number[],
    camera: IData["camera"],
    document: IData["document"],
    skip = false
  ): { delta: number[]; point: number[]; snaps: SnapResult[] } {
    // Where would the point be without any snaps?
    const next = vec.add(iPoint, delta)

    let d: number,
      results: SnapResult[] = [], // either [center] or [x-axis, y-axis]
      dx = SNAP_DISTANCE, // distance to test point (screen space)
      dy = SNAP_DISTANCE,
      sx = next[0],
      sy = next[1]

    // Is the user skipping snaps? Is the user moving quickly? Return point.
    if (skip || vec.len(inputs.pointer.delta) > MIN_SPEED)
      return { delta: vec.vec(iPoint, next), point: next, snaps: [] }

    // Get a rect 1.5x the size of the document.
    const minX = document.point[0] - document.size[0] * 0.25,
      minY = document.point[1] - document.size[1] * 0.25,
      maxX = minX + document.size[0] * 1.5,
      maxY = minY + document.size[1] * 1.5

    // Get nodes that are close enough;
    const nodesToCheck = iNodes.filter(({ id, point }) =>
      pointInRect(point, minX, minY, maxX, maxY)
    )

    // CENTER -> CENTER

    for (let n of nodesToCheck) {
      d = vec.dist(n.point, next) * camera.zoom
      if (d < dx) {
        dx = d
        sx = n.point[0]
        sy = n.point[1]

        results[0] = {
          id: n.id,
          from: n.point,
          to: [0, 0],
        }
      }
    }

    if (!results[0]) {
      // If we haven't snapped to a center...
      // CENTER X -> CENTER X / CENTER Y -> CENTER Y

      for (let n of nodesToCheck) {
        // Center x -> Center x
        d = Math.abs(next[0] - n.point[0]) * camera.zoom
        if (d < dx) {
          dx = d
          sx = n.point[0]
          results[0] = {
            id: n.id,
            from: n.point,
            to: [0, 0],
          }
        }

        // Center y -> Center y
        d = Math.abs(next[1] - n.point[1]) * camera.zoom
        if (d < dy) {
          dy = d
          sy = n.point[1]
          results[1] = {
            id: n.id,
            from: n.point,
            to: [0, 0],
          }
        }
      }

      // If we have at least one axis unsnapped...
      // CENTER X -> EDGES X, CENTER Y -> EDGES Y

      if (!(results[0] && results[1])) {
        for (let n of nodesToCheck) {
          // If we don't have a center x -> center x snap, check center x -> edges x
          if (!results[0]) {
            // Center x -> min x
            d = Math.abs(next[0] - (n.point[0] - n.radius)) * camera.zoom
            if (d < dx) {
              dx = d
              sx = n.point[0] - n.radius
              results[0] = {
                id: n.id,
                from: vec.sub(n.point, [n.radius, 0]),
                to: [0, 0],
              }
            }

            // Center x -> max x
            d = Math.abs(next[0] - (n.point[0] + n.radius)) * camera.zoom
            if (d < dx) {
              dx = d
              sx = n.point[0] + n.radius
              results[0] = {
                id: n.id,
                from: vec.add(n.point, [n.radius, 0]),
                to: [0, 0],
              }
            }
          }

          if (!results[1]) {
            // Center y -> min y
            d = Math.abs(next[1] - (n.point[1] - n.radius)) * camera.zoom
            if (d < dy) {
              dy = d
              sy = n.point[1] - n.radius
              results[1] = {
                id: n.id,
                from: vec.sub(n.point, [0, n.radius]),
                to: [0, 0],
              }
            }

            // Center y -> max y
            d = Math.abs(next[1] - (n.point[1] + n.radius)) * camera.zoom
            if (d < dy) {
              dy = d
              sy = n.point[1] + n.radius
              results[1] = {
                id: n.id,
                from: vec.add(n.point, [0, n.radius]),
                to: [0, 0],
              }
            }
          }
        }
      }

      // If we have still at least one axis unsnapped...
      // check from left and right edges.

      if (!(results[0] && results[1])) {
        for (let n of nodesToCheck) {
          // EDGES X -> EDGES X

          if (!results[0]) {
            // Min x -> center x
            d = Math.abs(next[0] - r - n.point[0]) * camera.zoom
            if (d < dx) {
              dx = d
              sx = n.point[0] + r
              results[0] = {
                id: n.id,
                from: n.point,
                to: [-r, 0],
              }
            }

            // Min x -> min x
            d = Math.abs(next[0] - r - (n.point[0] - n.radius)) * camera.zoom
            if (d < dx) {
              dx = d
              sx = n.point[0] - n.radius + r
              results[0] = {
                id: n.id,
                from: vec.sub(n.point, [n.radius, 0]),
                to: [-r, 0],
              }
            }

            // Min x -> max x
            d = Math.abs(next[0] - r - (n.point[0] + n.radius)) * camera.zoom
            if (d < dx) {
              dx = d
              sx = n.point[0] + n.radius + r
              results[0] = {
                id: n.id,
                from: vec.add(n.point, [n.radius, 0]),
                to: [-r, 0],
              }
            }

            // Max x -> center x
            d = Math.abs(next[0] + r - n.point[0]) * camera.zoom
            if (d < dx) {
              dx = d
              sx = n.point[0] - r
              results[0] = {
                id: n.id,
                from: n.point,
                to: [r, 0],
              }
            }

            // Max x -> min x
            d = Math.abs(next[0] + r - (n.point[0] - n.radius)) * camera.zoom
            if (d < dx) {
              dx = d
              sx = n.point[0] - n.radius - r
              results[0] = {
                id: n.id,
                from: vec.sub(n.point, [n.radius, 0]),
                to: [r, 0],
              }
            }

            // Max x -> max x
            d = Math.abs(next[0] + r - (n.point[0] + n.radius)) * camera.zoom
            if (d < dx) {
              dx = d
              sx = n.point[0] + n.radius - r
              results[0] = {
                id: n.id,
                from: vec.add(n.point, [n.radius, 0]),
                to: [r, 0],
              }
            }
          }

          // EDGES Y -> EDGES Y

          if (!results[1]) {
            // Min y -> center y
            d = Math.abs(next[1] - r - n.point[1]) * camera.zoom
            if (d < dy) {
              dy = d
              sy = n.point[1] + r
              results[1] = {
                id: n.id,
                from: n.point,
                to: [0, -r],
              }
            }

            // Min y -> min y
            d = Math.abs(next[1] - r - (n.point[1] - n.radius)) * camera.zoom
            if (d < dy) {
              dy = d
              sy = n.point[1] - n.radius + r
              results[1] = {
                id: n.id,
                from: vec.sub(n.point, [0, n.radius]),
                to: [0, -r],
              }
            }

            // Min y -> max y
            d = Math.abs(next[1] - r - (n.point[1] + n.radius)) * camera.zoom
            if (d < dy) {
              dy = d
              sy = n.point[1] + n.radius + r
              results[1] = {
                id: n.id,
                from: vec.add(n.point, [0, n.radius]),
                to: [0, -r],
              }
            }

            // Max y -> center y
            d = Math.abs(next[1] + r - n.point[1]) * camera.zoom
            if (d < dy) {
              dy = d
              sy = n.point[1] - r
              results[1] = {
                id: n.id,
                from: n.point,
                to: [0, r],
              }
            }

            // Max y -> min y
            d = Math.abs(next[1] + r - (n.point[1] - n.radius)) * camera.zoom
            if (d < dy) {
              dy = d
              sy = n.point[1] - n.radius - r
              results[1] = {
                id: n.id,
                from: vec.sub(n.point, [0, n.radius]),
                to: [0, r],
              }
            }

            // Max y -> max y
            d = Math.abs(next[1] + r - (n.point[1] + n.radius)) * camera.zoom
            if (d < dy) {
              dy = d
              sy = n.point[1] + n.radius - r
              results[1] = {
                id: n.id,
                from: vec.add(n.point, [0, n.radius]),
                to: [0, r],
              }
            }
          }
        }
      }
    }

    return {
      delta: vec.vec(iPoint, [sx, sy]),
      point: [sx, sy],
      snaps: results.map((r) => ({
        ...r,
        to: vec.add(r.to, [sx, sy]),
      })),
    }
  }
}

export type NodeSnapper = ReturnType<typeof getNodeSnapper>
