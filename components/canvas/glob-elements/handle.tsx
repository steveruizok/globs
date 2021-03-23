interface Props {
  position?: number[]
  color?: string
  onSelect?: () => void
}

export default function Handle({
  position = [0, 0],
  color = "#000",
  onSelect,
}: Props) {
  return (
    <>
      <use
        href="#touch"
        x={position[0]}
        y={position[1]}
        fill={color}
        opacity={0.2}
        onPointerDown={onSelect}
      />
      <use
        href="#anchor"
        x={position[0]}
        y={position[1]}
        fill={color}
        opacity={1}
        pointerEvents="none"
      />
    </>
  )
}
