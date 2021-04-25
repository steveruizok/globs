import state, { useSelector } from "lib/state"
import { useRef } from "react"
import { Plus } from "react-feather"
import PageListItem from "./page-list-item"
import { styled } from "stitches.config"
import IconButton from "../icon-button"

const SectionTitle = styled("div", {
  display: "flex",
  alignItems: "center",
  "&:hover button > svg": {
    visibility: "visible",
  },
  "& button > svg": {
    visibility: "hidden",
  },

  "& button": {
    height: 28,
    border: "none",
    backgroundColor: "$section",
    borderBottom: "1px solid $border",
  },
})

export default function PageList() {
  const rContainer = useRef<HTMLDivElement>(null)
  const rList = useRef<HTMLOListElement>(null)

  const pages = useSelector((state) => state.data.pages)
  const pageId = useSelector((state) => state.data.pageId)

  const pageIds = Object.keys(pages)

  return (
    <section ref={rContainer}>
      <SectionTitle>
        <h2>Pages</h2>
        <IconButton onClick={() => state.send("CREATED_PAGE")}>
          <Plus size={12} />
        </IconButton>
      </SectionTitle>
      <ol ref={rList}>
        {pageIds.map((id, index) => {
          return (
            <li key={index}>
              <PageListItem id={id} selected={pageId === id} />
            </li>
          )
        })}
      </ol>
    </section>
  )
}
