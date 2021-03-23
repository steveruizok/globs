interface Props {
  position?: number[]
  color?: string
}

export default function Dot({ position = [0, 0], color = "#000" }: Props) {
  return (
    <use
      href="#dot"
      x={position[0]}
      y={position[1]}
      fill={color}
      stroke="none"
    />
  )
}
