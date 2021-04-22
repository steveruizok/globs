import * as Dialog from "@radix-ui/react-dialog"
import { useStateDesigner } from "@state-designer/react"
import state, { useSelector } from "lib/state"
import {
  createSharedProject,
  deleteSharedProject,
  fetchSharedProject,
  updateSharedProject,
} from "lib/supabase"
import { copyToClipboard } from "lib/utils"
import { useEffect, useRef } from "react"
import { BookOpen, Copy, RotateCw, Share, Trash } from "react-feather"
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
  minWidth: 360,
  maxWidth: 360,
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
  minWidth: 0,
  width: "100%",

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
  minWidth: 0,
  width: "100%",
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
    data: { shareUrl, error: "" },
    on: {
      OPENED_MODAL: { to: "fetchingShareLink" },
    },
    initial: "fetchingShareLink",
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
              DELETED_SHARE_LINK: {
                if: "hasShareUrl",
                to: "deletingShareLink",
              },
              UPDATED_SHARE_LINK: {
                if: "hasShareUrl",
                to: "updatingShareLink",
              },
            },
          },
        },
      },
      fetchingShareLink: {
        async: {
          await: "fetchShareLink",
          onResolve: { to: "shared" },
          onReject: { to: "notShared" },
        },
      },
      creatingShareLink: {
        async: {
          await: "createShareUrl",
          onResolve: { wait: 0.5, do: "clearError", to: "idle" },
          onReject: { do: "setError", to: "error" },
        },
      },
      deletingShareLink: {
        async: {
          await: "deleteShareUrl",
          onResolve: { wait: 0.5, do: "clearError", to: "idle" },
          onReject: { do: "setError", to: "error" },
        },
      },
      updatingShareLink: {
        async: {
          await: "updateShareLink",
          onResolve: { wait: 0.5, do: "clearError", to: "idle" },
          onReject: { do: "setError", to: "error" },
        },
      },
      error: {
        on: {
          CONTINUED: { to: "idle" },
        },
      },
    },
    conditions: {
      hasShareUrl(data) {
        return !!state.data.shareUrl
      },
    },
    actions: {
      setError(data, payload, result: { message: string }) {
        data.error = result.message
      },
      clearError(data) {
        data.error = ""
      },
    },
    asyncs: {
      async fetchShareLink(data) {
        const result = await fetchSharedProject(state.data)

        if (result.error === null) {
          const { uuid } = result.data[0]
          data.shareUrl = uuid
        } else {
          throw result.error
        }
      },
      async createShareUrl(data) {
        const result = await createSharedProject(state.data)

        if (result.error === null) {
          const { uuid } = result.data[0]
          data.shareUrl = uuid
          state.send("CREATED_SHARE_LINK", { url: uuid })
        } else {
          throw result.error
        }
      },
      async deleteShareUrl(data) {
        const result = await deleteSharedProject(state.data)

        if (result.error === null) {
          state.send("DELETED_SHARE_LINK")
          data.shareUrl = undefined
        } else {
          throw result.error
        }
      },
      async updateShareLink(data) {
        await updateSharedProject(state.data)
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
        local.send("OPENED_MODAL")
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
                  onClick={(e) => e.currentTarget.select()}
                  onChange={() => null}
                  readOnly
                />
                <IconButton
                  onClick={() => copyToClipboard(rInput.current.value)}
                >
                  <Copy size={18} />
                </IconButton>
                <IconButton onClick={() => local.send("UPDATED_SHARE_LINK")}>
                  <RotateCw size={18} />
                </IconButton>
                <IconButton onClick={() => local.send("DELETED_SHARE_LINK")}>
                  <Trash size={18} />
                </IconButton>
              </>
            ),
            notShared: (
              <Button onClick={() => local.send("CREATED_SHARE_LINK")}>
                Create a Share Link
              </Button>
            ),
            fetchingShareLink: <Button disabled>Getting Share Link...</Button>,
            updatingShareLink: <Button disabled>Updating Share Link...</Button>,
            creatingShareLink: <Button disabled>Creating Share Link...</Button>,
            deletingShareLink: <Button disabled>Deleting Share Link...</Button>,
            error: (
              <Button onClick={() => local.send("CONTINUED")}>
                Try Again?
              </Button>
            ),
          })}
        </ActionContainer>
        {local.data.error && <p>{local.data.error}</p>}
        <InfoBox>
          <BookOpen size={18} />
          {local.whenIn({
            shared: (
              <p>
                To update your Share Link with your current project state, click
                the <RotateCw strokeWidth={3} size={11} /> button. To delete the
                link, click the <Trash strokeWidth={3} size={11} /> button.
              </p>
            ),
            default: (
              <p>
                Anyone with your Share Link can view a snapshot of this project
                (as it is right now) and copy it down to their own project.
              </p>
            ),
          })}
        </InfoBox>
      </Content>
    </Dialog.Root>
  )
}
