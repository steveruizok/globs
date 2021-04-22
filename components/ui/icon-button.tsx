import { styled } from "stitches.config"

const IconButton = styled("button", {
  background: "none",
  border: "none",
  width: "40px",
  height: "40px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  outline: "none",
  color: "$text",

  "@media (min-width: 768px)": {
    "&:hover:enabled": {
      "& > svg": {
        stroke: "$selected",
      },
    },
  },

  "&:disabled": {
    opacity: "0.3",
  },

  '&[data-active="true"]': {
    "& > svg": {
      stroke: "$selected",
    },
  },
})

export default IconButton
