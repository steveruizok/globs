import { styled } from "stitches.config"

export default function Loading() {
  return <Wrapper>Loading...</Wrapper>
}

const Wrapper = styled("div", {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "$canvas",
  color: "$text",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
})
