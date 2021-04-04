import styled from "styled-components"
import * as _ContextMenu from "@radix-ui/react-context-menu"
import { useSelector } from "lib/state"
import { deepCompare } from "lib/utils"

export default function ContextMenu() {
  // const hoveredNode = useSelector(
  //   (s) => s.data.hoveredNodes[0] && s.data.nodes[s.data.hoveredNodes[0]],
  //   deepCompare
  // )

  return (
    // @ts-ignore
    <StyledContent disableOutsidePointerEvents={false}>
      <StyledItem>Todo</StyledItem>
      {/* <StyledItem onSelect={() => {}}>{hoveredNode?.id}</StyledItem> */}
    </StyledContent>
  )
}

const StyledContent = styled(_ContextMenu.Content)`
  font-size: 11px;
  min-width: 130px;
  background-color: #fff;
  border-radius: 4px;
  padding: 5px;
  box-shadow: 2px 2px 12px -4px rgba(0, 0, 0, 0.2);
  pointer-events: all;
  z-index: 2;
`

const StyledItem = styled(_ContextMenu.Item)`
  font-size: 13px;
  padding: 5px 10px;
  border-radius: 2px;
  outline: none;
  cursor: pointer;

  &:hover {
    background-color: var(--muted);
  }
`

export const ContextMenuRoot = _ContextMenu.Root
export const ContextMenuTrigger = _ContextMenu.Trigger
