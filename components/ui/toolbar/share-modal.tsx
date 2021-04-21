import * as Dialog from "@radix-ui/react-dialog"
import { useStateDesigner } from "@state-designer/react"
import state, { useSelector } from "lib/state"
import { IProject } from "lib/types"
import { copyToClipboard } from "lib/utils"
import { useEffect, useRef } from "react"
import { BookOpen, Copy, Share, Trash } from "react-feather"
import { styled } from "stitches.config"
import Button from "../button"
import IconButton from "../icon-button"

const Trigger = styled(Dialog.Trigger, {
  background: "none",
  border: "none",
  width: "40px",
  height: "40px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  outline: "none",

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

const Overlay = styled(Dialog.Overlay, {
  backgroundColor: "rgba(255, 255, 255, .7)",
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
})

const Content = styled(Dialog.Content, {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  minWidth: 200,
  maxWidth: 400,
  maxHeight: "85vh",
  padding: "20px 24px",
  marginTop: "-5vh",
  backgroundColor: "white",
  borderRadius: 16,
  font: "$docs",
  boxShadow:
    "0px 0px 40px -8px rgba(0,0,0,.16), 0px 3px 12px -8px rgba(0,0,0,.4)",
  display: "grid",
  gap: 20,

  "&:focus": {
    outline: "none",
  },
})

const ActionContainer = styled("div", {
  display: "flex",
  height: 40,

  "& input": {
    flexGrow: 2,
    font: "$docs",
    border: "1px solid $border",
    borderRadius: 8,
    marginRight: 8,
    padding: "0px 12px",
    outline: "none",
  },
})

const InfoBox = styled("div", {
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  alignItems: "flex-start",
  font: "$docs",
  gap: "12px",

  "& p": { margin: 0 },
  "& svg": { marginTop: 2 },
})

export default function ShareModal() {
  const shareUrl = useSelector((state) => state.data.shareUrl)

  const local = useStateDesigner({
    data: { shareUrl },
    initial: "idle",
    states: {
      idle: {
        initial: {
          if: "hasShareUrl",
          to: "shared",
          else: { to: "notShared" },
        },
        states: {
          notShared: {
            on: {
              CREATED_SHARE_LINK: {
                to: "creatingShareLink",
              },
            },
          },
          shared: {
            on: {
              DELETED_SHARE_URL: {
                to: "deletingShareLink",
              },
            },
          },
        },
      },
      creatingShareLink: {
        initial: "creatingLink",
        states: {
          creatingLink: {
            async: {
              await: "createShareUrl",
              onResolve: { to: "idle" },
              onReject: { to: "errorCreatingLink" },
            },
          },
          errorCreatingLink: {
            on: {
              CONFIRMED: { to: "idle" },
            },
          },
        },
      },
      deletingShareLink: {
        initial: "deletingLink",
        states: {
          deletingLink: {
            async: {
              await: "deleteShareUrl",
              onResolve: { to: "idle" },
              onReject: { to: "errorDeletingLink" },
            },
          },
          errorDeletingLink: {
            on: {
              CONFIRMED: { to: "idle" },
            },
          },
        },
      },
    },
    conditions: {
      hasShareUrl(data) {
        return !!data.shareUrl
      },
    },
    actions: {},
    asyncs: {
      async createShareUrl(data) {
        // const result = await createSharedProject(state.data)
        // console.log(result)

        const {
          id,
          name,
          nodes,
          globs,
          groups,
          pages,
          code,
          version,
        } = state.data

        const project: IProject = {
          id,
          name,
          nodes,
          globs,
          groups,
          pages,
          code,
          version,
        }

        const document = JSON.stringify(project)

        const path = `/api/create-share-link`
        const url = process.env.NEXT_PUBLIC_BASE_API_URL + path

        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, document }),
        }).then((d) => d.json())

        if (result.response === "Success.") {
          data.shareUrl = result.url
          state.send("CREATED_SHARE_LINK", { url: result.url })
        }
      },
      async deleteShareUrl(data) {
        const path = `/api/delete-share-link`
        const url = process.env.NEXT_PUBLIC_BASE_API_URL + path

        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: data.shareUrl }),
        }).then((d) => d.json())

        if (result.response === "Success.") {
          data.shareUrl = undefined
          state.send("DELETED_SHARE_LINK")
        }
      },
    },
  })

  const rInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const input = rInput.current
    if (!input) return
    input.select()
  }, [local.isIn("shared")])

  return (
    <Dialog.Root
      onOpenChange={(isOpen) => {
        console.log(isOpen)
        state.send(
          isOpen ? "OPENED_SHARE_LINK_MODAL" : "CLOSED_SHARE_LINK_MODAL"
        )
      }}
    >
      <Overlay />
      <Trigger title="Share">
        <Share />
      </Trigger>
      <Content>
        <ActionContainer>
          {local.whenIn({
            shared: (
              <>
                <input
                  ref={rInput}
                  value={
                    process.env.NEXT_PUBLIC_BASE_API_URL +
                    "/p/" +
                    local.data.shareUrl
                  }
                  onChange={() => null}
                  readOnly
                />
                <IconButton
                  onClick={() => copyToClipboard(local.data.shareUrl)}
                >
                  <Copy size={18} />
                </IconButton>
                <IconButton onClick={() => local.send("DELETED_SHARE_URL")}>
                  <Trash size={18} />
                </IconButton>
              </>
            ),
            notShared: (
              <Button onClick={() => local.send("CREATED_SHARE_LINK")}>
                Create a Share Link
              </Button>
            ),
            creatingLink: <Button disabled>Creating Share Link...</Button>,
            deletingLink: <Button disabled>Deleting Share Link...</Button>,
            errorCreatingLink: (
              <Button onClick={() => local.send("CONTINUED")}>
                Try Again?
              </Button>
            ),
            errorDeletingLink: (
              <Button onClick={() => local.send("CONTINUED")}>
                Try Again?
              </Button>
            ),
          })}
        </ActionContainer>
        <InfoBox>
          <BookOpen size={18} />
          <p>
            Anyone with your Share Link can view a snapshot of this project (as
            it is right now) and copy it down to their own project.
          </p>
        </InfoBox>
      </Content>
    </Dialog.Root>
  )
}
