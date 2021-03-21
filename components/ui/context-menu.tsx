import styled from "styled-components"
import * as _ContextMenu from "@radix-ui/react-context-menu"

export default function ContextMenu() {
  return (
    // @ts-ignore
    <StyledContent onOpenAutoFocus={(e) => {}}>
      <StyledItem onSelect={() => {}}>Todo!</StyledItem>
    </StyledContent>
  )
}

const StyledContent = styled(_ContextMenu.Content)`
  font-size: 11px;
  min-width: 130px;
  background-color: #fff;
  border-radius: 4px;
  padding: 5px;
`

const StyledItem = styled(_ContextMenu.Item)`
  font-size: 13px;
  padding: 5px 10px;
  border-radius: 2px;
`

export const ContextMenuRoot = _ContextMenu.Root
export const ContextMenuTrigger = _ContextMenu.Trigger
