import { styled } from "stitches.config"

const Button = styled("button", {
  font: "$docs",
  background: "none",
  width: "100%",
  border: "1px solid $border",
  borderRadius: 8,
  padding: "8px 12px",
  outline: "none",
  cursor: "pointer",
  fontWeight: 600,
  transition: "border .2s",

  "&:hover:not(:disabled)": {
    border: "1px solid $text",
  },
})

export default Button
