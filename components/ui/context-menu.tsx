import { styled } from "stitches.config"
import * as _ContextMenu from "@radix-ui/react-context-menu"
import state from "lib/state"

export default function ContextMenu() {
  return (
    <StyledContent disableOutsidePointerEvents={false}>
      <StyledItem onSelect={() => state.send("COPIED")}>Copy</StyledItem>
      <StyledItem onSelect={() => state.send("PASTED")}>Paste</StyledItem>
      <StyledItem onSelect={() => state.send("EXPORTED")}>Copy SVG</StyledItem>
    </StyledContent>
  )
}

const StyledContent = styled(_ContextMenu.Content, {
  fontSize: "11px",
  minWidth: "130px",
  color: "$text",
  backgroundColor: "$panel",
  borderRadius: "4px",
  padding: "5px",
  boxShadow: "2px 2px 12px -4px rgba(0, 0, 0, 0.2)",
})

const StyledItem = styled(_ContextMenu.Item, {
  fontSize: "13px",
  padding: "5px 10px",
  borderRadius: "2px",
  outline: "none",
  cursor: "pointer",

  "&:hover": {
    backgroundColor: "$muted",
  },
})

export const ContextMenuRoot = _ContextMenu.Root
export const ContextMenuTrigger = _ContextMenu.Trigger
