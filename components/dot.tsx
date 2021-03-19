interface Props {
  position?: number[]
  color?: string
  radius?: number
  onSelect?: () => void
}

export default function Dot({
  position = [0, 0],
  color = "#000",
  radius = 2,
  onSelect,
}: Props) {
  return (
    <circle
      cx={position[0]}
      cy={position[1]}
      r={radius}
      fill={color}
      onPointerDown={onSelect}
      pointerEvents={onSelect ? "all" : "none"}
    />
  )
}
