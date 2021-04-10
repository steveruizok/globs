import classNames from "classnames"

interface Props {
  position?: number[]
  isPrime?: boolean
  onSelect?: (e: React.PointerEvent<SVGUseElement>) => void
}

export default function Handle({
  position = [0, 0],
  isPrime = false,
  onSelect,
}: Props) {
  return (
    <>
      <use
        href="#touch"
        x={position[0]}
        y={position[1]}
        onPointerDown={onSelect}
        className={classNames([
          "opacity-s",
          { "fill-left": !isPrime, "fill-right": isPrime },
        ])}
      />
      <use
        href="#anchor"
        x={position[0]}
        y={position[1]}
        pointerEvents="none"
        className={classNames([
          { "fill-left": !isPrime, "fill-right": isPrime },
        ])}
      />
    </>
  )
}
