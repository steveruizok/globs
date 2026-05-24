import state, { useSelector } from "lib/state"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import {
  RotateCcw,
  RotateCw,
  Disc,
  ArrowRight,
  Copy,
  Sun,
  X,
  Circle,
  Menu,
  GitHub,
  ExternalLink,
  List,
  Sidebar,
  Check,
} from "react-feather"
import { styled } from "stitches.config"
import useTheme from "hooks/useTheme"
import ShareModel from "../share-modal"
import IconButton from "../icon-button"

const SOURCE_REPO_URL = "https://github.com/steveruizok/globs"

export default function Toolbar() {
  const hasSelectedNodes = useSelector((s) => s.data.selectedNodes.length > 0)
  const hasSelectedGlobs = useSelector((s) => s.data.selectedGlobs.length > 0)
  const isGlobbing = useSelector((s) => s.isIn("globbingNodes"))
  const isCreating = useSelector((s) => s.isIn("creatingNodes"))
  const isObjectListOpen = useSelector(
    (s) => s.data.panels.objectList.isOpen
  )
  const isInspectorOpen = useSelector((s) => s.data.panels.inspector.isOpen)

  const { toggle } = useTheme()

  return (
    <StyledContainer>
      <section>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <IconButton title="Menu">
              <Menu />
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <MenuContent align="start" sideOffset={4}>
              <MenuItem asChild>
                <a
                  href={SOURCE_REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  <GitHub />
                  <span>Source Repo</span>
                  <ExternalLink />
                </a>
              </MenuItem>
              <MenuSeparator />
              <MenuCheckboxItem
                checked={isObjectListOpen}
                onCheckedChange={() =>
                  state.send("TOGGLED_OBJECT_LIST_PANEL")
                }
              >
                <MenuItemIndicator>
                  <Check />
                </MenuItemIndicator>
                <List />
                <span>Object List</span>
              </MenuCheckboxItem>
              <MenuCheckboxItem
                checked={isInspectorOpen}
                onCheckedChange={() => state.send("TOGGLED_INSPECTOR_PANEL")}
              >
                <MenuItemIndicator>
                  <Check />
                </MenuItemIndicator>
                <Sidebar />
                <span>Inspector</span>
              </MenuCheckboxItem>
            </MenuContent>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        <IconButton title="Undo" onClick={() => state.send("UNDO")}>
          <RotateCcw />
        </IconButton>
        <IconButton title="Redo" onClick={() => state.send("REDO")}>
          <RotateCw />
        </IconButton>
      </section>
      <Spacer />

      <section>
        <IconButton
          title="Create Node (N)"
          data-active={isCreating}
          onClick={() => {
            state.send("STARTED_CREATING_NODES")
          }}
        >
          <Disc />
        </IconButton>
        <IconButton
          title="Create Globs (G)"
          disabled={!hasSelectedNodes}
          data-active={isGlobbing}
          onClick={() => state.send("STARTED_GLOBBING_NODES")}
        >
          <ArrowRight />
        </IconButton>
        <IconButton
          title="Delete Selected Items (Backspace)"
          disabled={!(hasSelectedNodes || hasSelectedGlobs)}
          onClick={() => state.send("DELETED")}
        >
          <X />
        </IconButton>
      </section>
      <Spacer />
      <section>
        <IconButton
          title="Toggle Fill"
          onClick={() => state.send("TOGGLED_FILL")}
        >
          <Circle className="fill-flat" />
        </IconButton>
        <IconButton
          title="Copy SVG to Clipboard"
          onClick={() => state.send("EXPORTED")}
        >
          <Copy />
        </IconButton>
        <ShareModel />
        <IconButton onClick={toggle}>
          <Sun />
        </IconButton>
      </section>
    </StyledContainer>
  )
}

const StyledContainer = styled("div", {
  userSelect: "none",
  gridArea: "tool",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "$panel",
  borderBottom: "1px solid $border",

  "& svg": {
    height: "18px",
    width: "18px",
    stroke: "$text",
  },

  "& > section": {
    display: "flex",
  },
})

const Spacer = styled("div", {
  flexGrow: 2,
})

const menuItemStyles = {
  position: "relative",
  height: "28px",
  display: "grid",
  gridTemplateColumns: "18px 1fr 18px",
  alignItems: "center",
  gap: "8px",
  padding: "0 8px",
  borderRadius: "2px",
  color: "$text",
  font: "$ui",
  textDecoration: "none",
  outline: "none",
  cursor: "pointer",

  "&:hover, &:focus": {
    backgroundColor: "$muted",
  },

  "& > svg": {
    height: "14px",
    width: "14px",
    stroke: "$text",
  },
} as const

const MenuContent = styled(DropdownMenu.Content, {
  minWidth: "180px",
  padding: "4px",
  backgroundColor: "$panel",
  border: "1px solid $border",
  borderRadius: "4px",
  boxShadow: "2px 2px 12px -4px rgba(0, 0, 0, 0.4)",
  zIndex: 10,
})

const MenuItem = styled(DropdownMenu.Item, menuItemStyles)

const MenuCheckboxItem = styled(DropdownMenu.CheckboxItem, menuItemStyles)

const MenuItemIndicator = styled(DropdownMenu.ItemIndicator, {
  position: "absolute",
  right: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  "& > svg": {
    height: "14px",
    width: "14px",
    stroke: "$text",
  },
})

const MenuSeparator = styled(DropdownMenu.Separator, {
  height: "1px",
  margin: "4px",
  backgroundColor: "$border",
})
