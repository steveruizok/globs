import useRegisteredElement from "hooks/useRegisteredElement"
import state, { useSelector } from "lib/state"
import { deepCompareArrays, deepCompare } from "lib/utils"
import { useEffect, useRef } from "react"
import Dot from "../dot"
import classNames from "classnames"
import BaseNode from "./base-node"

interface Props {
  id: string
  fill: boolean
  isSelected: boolean
}

export default function Node({ id, fill, isSelected }: Props) {
  const node = useSelector((s) => s.data.nodes[id])

  const rOutline = useRegisteredElement<SVGCircleElement>(id)

  if (!node) return null

  return (
    <BaseNode
      ref={rOutline}
      id={node.id}
      cx={node.point[0]}
      cy={node.point[1]}
      r={node.radius}
      isFilled={fill}
      isSelected={isSelected}
      isLocked={node.locked}
    />
  )
}
