import { styled } from "stitches.config"

const Button = styled("button", {
  font: "$docs",
  background: "none",
  width: "100%",
  border: "1px solid $text",
  borderRadius: 8,
  padding: "8px 12px",
  outline: "none",
  cursor: "pointer",
  fontWeight: 600,
  transition: "border .2s",
  color: "$text",
  userSelect: "none",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",

  "& svg": {
    marginLeft: 8,
    marginBottom: 2,
    strokeWidth: 3,
  },

  "&:disabled": {
    color: "$muted",
    borderColor: "$muted",
  },

  "&:hover:not(:disabled)": {
    border: "1px solid $text",
  },

  variants: {
    variant: {
      cta: {
        color: "$left",
      },
    },
  },
})

export default Button
