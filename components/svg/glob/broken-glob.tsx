import classNames from "classnames"
import { INode } from "lib/types"

interface Props {
  start: INode
  end: INode
}

export default function BrokenGlob({ start, end }: Props) {
  return (
    <line
      x1={start.point[0]}
      y1={start.point[1]}
      x2={end.point[0]}
      y2={end.point[1]}
      className={classNames(["strokewidth-m", "stroke-selected"])}
    />
  )
}
