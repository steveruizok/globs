import "./styles.css"
import { state, useSelector } from "./state"
import Glob from "./components/glob"
import useKeyboardEvents from "./hooks/useKeyboardEvents"

export default function App() {
  useKeyboardEvents()
  const reset = useSelector((s) => s.data.resets)
  const fill = useSelector((s) => s.data.fill)
  const ids = useSelector((s) => s.data.ids)
  const selectedIds = useSelector((s) => s.data.selectedIds)

  return (
    <div className="container">
      <svg>
        <defs>
          <rect
            id="mask_flat"
            x={0}
            y={0}
            width="100%"
            height="100%"
            fill="white"
          />
        </defs>
        <rect
          x={0}
          y={0}
          width="100%"
          height="100%"
          fill="#fefefe"
          onPointerDown={() => state.send("DESELECTED")}
        />
        {ids.map((id, i) => (
          <Glob
            key={id}
            x={0} //-12 + Math.random() * 25 + (i % 2) * 232}
            y={0} //-12 + Math.random() * 25 + Math.floor(i / 2) * 232}
            rotate={0} //Math.random() * (Math.PI * 2)}
            fill={fill && !selectedIds.includes(id)}
            reset={reset}
            id={id}
            isSelected={selectedIds.includes(id)}
            onSelect={() => state.send("SELECTED_GLOB", id)}
          />
        ))}
        {/* Controls */}
        <g>
          <circle
            cx={40}
            cy={40}
            r={16}
            fill="orange"
            onClick={(e) => state.send("RESET", { shift: e.shiftKey })}
          />
          <circle
            cx={90}
            cy={40}
            r={16}
            fill="black"
            onClick={() => state.send("TOGGLED_FILL")}
          />
          <circle
            cx={140}
            cy={40}
            r={16}
            fill="dodgerblue"
            onClick={() => state.send("CREATED_GLOB")}
          />
          <g>
            <circle cx={190} cy={40} r={8} fill="#555" />
            <circle
              cx={190}
              cy={40}
              r={16}
              fill="transparent"
              onClick={() => state.send("DELETED_GLOB")}
            />
          </g>
        </g>
      </svg>
      <div className="author">
        <a
          href="https://twitter.com/steveruizok"
          target="_blank"
          rel="nofollow noreferrer"
        >
          @steveruizok
        </a>
      </div>
      <div className="about">
        An SVG implementation of{" "}
        <a
          href="https://twitter.com/AndrewGlassner"
          target="_blank"
          rel="nofollow noreferrer"
        >
          Andrew Glassner
        </a>
        's{" "}
        <a
          href="https://imaginary-institute.com/resources/TechNote11/TechNote11.html"
          target="_blank"
          rel="nofollow noreferrer"
        >
          glob
        </a>{" "}
        shape. Hold <b>Shift</b> or multi-touch to drag.
      </div>
    </div>
  )
}
