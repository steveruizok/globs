interface Props {
  position?: number[]
  color?: string
  isSelected: boolean
  onSelect?: () => void
}

export default function Anchor({
  position = [0, 0],
  color = "#000",
  isSelected = false,
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
        opacity={isSelected ? 1 : 0.5}
        pointerEvents="none"
      />
    </>
  )
}
