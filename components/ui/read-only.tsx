import { styled } from "stitches.config"
import state, { useSelector } from "lib/state"
import IconButton from "./icon-button"
import { Download } from "react-feather"
import Button from "./button"

export default function ReadOnlyPanel() {
  return (
    <Container>
      <Button onClick={() => state.send("DOWNLOADED_SHARE_LINK")}>
        Import Project <Download size={14} />
      </Button>
    </Container>
  )
}

const Container = styled("div", {
  position: "absolute",
  display: "flex",
  alignItems: "center",
  bottom: "0px",
  right: "0px",
  borderRadius: "4px",
  pointerEvents: "all",
})
