import styled from "styled-components"
import * as _ContextMenu from "@radix-ui/react-context-menu"

export default function ContextMenu() {
  return (
    <StyledContent onOpenAutoFocus={(e) => console.log("hi")}>
      <StyledItem onSelect={() => console.log("cut")}>Cut</StyledItem>
      <StyledItem onSelect={() => console.log("copy")}>Copy</StyledItem>
      <StyledItem onSelect={() => console.log("paste")}>Paste</StyledItem>
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
