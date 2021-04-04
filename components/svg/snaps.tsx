import { useSelector } from "lib/state"

export default function Snaps() {
  const snaps = useSelector((s) => s.data.snaps.active)

  return (
    <g>
      {snaps.map((snap, i) => (
        <g key={i}>
          <line
            x1={snap.from[0]}
            y1={snap.from[1]}
            x2={snap.to[0]}
            y2={snap.to[1]}
            className="strokewidth-s stroke-selected"
          />
          <use xlinkHref="#snap" x={snap.from[0]} y={snap.from[1]} />
          <use xlinkHref="#snap" x={snap.to[0]} y={snap.to[1]} />
        </g>
      ))}
    </g>
  )
}
