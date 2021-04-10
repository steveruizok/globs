import classNames from "classnames"

interface Props {
  position?: number[]
  color?: string
  isSelected: boolean
  isPrime: boolean
  onSelect?: (e: React.PointerEvent<SVGUseElement>) => void
}

export default function Anchor({
  position = [0, 0],
  color = "#000",
  isSelected = false,
  isPrime = false,
  onSelect,
}: Props) {
  return (
    <>
      <use
        href="#touch-small"
        x={position[0]}
        y={position[1]}
        fill={color}
        opacity={0}
        onPointerDown={onSelect}
      />
      <use
        href="#anchor"
        x={position[0]}
        y={position[1]}
        fill={color}
        className={classNames([
          {
            "fill-left": !isPrime,
            "fill-right": isPrime,
          },
        ])}
        pointerEvents="none"
      />
    </>
  )
}
