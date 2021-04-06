import { styled } from "stitches.config"
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

const StyledContent = styled(_ContextMenu.Content, {
	fontSize: '11px',
  minWidth: '130px',
  color: 'var(--colors-text)',
  backgroundColor: 'var(--colors-panel)',
  borderRadius: '4px',
  padding: '5px',
  boxShadow: '2px 2px 12px -4px rgba(0, 0, 0, 0.2)',
})

const StyledItem = styled(_ContextMenu.Item, {
	fontSize: '13px',
  padding: '5px 10px',
  borderRadius: '2px',
  outline: 'none',
  cursor: 'pointer',

  '&:hover': {
    backgroundColor: 'var(--muted)',
  }
})

export const ContextMenuRoot = _ContextMenu.Root
export const ContextMenuTrigger = _ContextMenu.Trigger
