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
import {
  BookOpen,
  Copy,
  ExternalLink,
  RotateCw,
  Share,
  Trash,
} from "react-feather"
import { styled } from "stitches.config"
import Button from "./button"
import IconButton from "./icon-button"

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
  backgroundColor: "$soft",
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: "100%",
  height: "100%",
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
  color: "$text",
  backgroundColor: "$panel",
  borderRadius: 16,
  font: "$docs",
  boxShadow:
    "0px 0px 40px -8px rgba(0,0,0,.16), 0px 3px 12px -8px rgba(0,0,0,.4)",
  display: "grid",
  gap: 20,

  "&:focus": {
    outline: "none",
  },

  "& a:hover > svg": {
    color: "$selected",
  },
})

const InputRow = styled("div", {
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
    backgroundColor: "$canvas",
    color: "$text",
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
  const shareUrls = useSelector((state) => state.data.shareUrls)

  const local = useStateDesigner({
    data: { shareUrls, error: "" },
    on: {
      OPENED_SHARE_LINK_MODAL: { to: "fetchingShareLink" },
    },
    initial: "fetchingShareLink",
    states: {
      idle: {
        initial: {
          if: "hasShareUrls",
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
              CREATED_SHARE_LINK: {
                to: "creatingShareLink",
              },
              DELETED_SHARE_LINK: {
                to: "deletingShareLink",
              },
              UPDATED_SHARE_LINK: {
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
          await: "createShareLink",
          onResolve: { wait: 0.5, do: "clearError", to: "idle" },
          onReject: { do: "setError", to: "error" },
        },
      },
      deletingShareLink: {
        async: {
          await: "deleteShareLink",
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
      hasShareUrls(data) {
        return !!data.shareUrls.length
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
          for (const doc of result.data) {
            if (!data.shareUrls.includes(doc.uuid)) {
              data.shareUrls.push(doc.uuid)
            }
          }
        } else {
          throw result.error
        }
        state.send("CHANGED_SHARE_LINKS", { uuids: data.shareUrls })
      },
      async createShareLink(data) {
        const result = await createSharedProject(state.data)

        if (result.error === null) {
          const { uuid } = result.data[0]
          data.shareUrls.push(uuid)
          state.send("CHANGED_SHARE_LINKS", { uuids: data.shareUrls })
        } else {
          throw result.error
        }
      },
      async deleteShareLink(data, payload: { uuid: string }) {
        const result = await deleteSharedProject(state.data, payload.uuid)

        if (result.error === null) {
          data.shareUrls = data.shareUrls.filter(
            (uuid) => uuid !== payload.uuid
          )
          state.send("CHANGED_SHARE_LINKS", { uuids: data.shareUrls })
        } else {
          throw result.error
        }
      },
      async updateShareLink(data, payload: { uuid: string }) {
        await updateSharedProject(state.data, payload.uuid)
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
        local.send("OPENED_SHARE_LINK_MODAL")
        state.send(
          isOpen ? "OPENED_SHARE_LINK_MODAL" : "CLOSED_SHARE_LINK_MODAL"
        )
      }}
    >
      <Overlay />
      <Trigger title="Share">
        <Share />
      </Trigger>
      <Content
        onKeyDown={(e) => {
          if (e.key !== "Escape") {
            e.stopPropagation()
          }
        }}
      >
        {local.data.shareUrls.map((uuid) => (
          <InputRow key={uuid}>
            <input
              ref={rInput}
              value={process.env.NEXT_PUBLIC_BASE_API_URL + "/p/" + uuid}
              onClick={(e) => e.currentTarget.select()}
              onChange={() => null}
              readOnly
            />
            <IconButton onClick={() => copyToClipboard(rInput.current.value)}>
              <Copy size={18} />
            </IconButton>
            <IconButton
              as="a"
              href={process.env.NEXT_PUBLIC_BASE_API_URL + "/p/" + uuid}
              target="_blank"
              rel="nofollow"
            >
              <ExternalLink size={18} />
            </IconButton>
            <IconButton
              onClick={() => local.send("UPDATED_SHARE_LINK", { uuid })}
            >
              <RotateCw size={18} />
            </IconButton>
            <IconButton
              onClick={() => local.send("DELETED_SHARE_LINK", { uuid })}
            >
              <Trash size={18} />
            </IconButton>
          </InputRow>
        ))}

        <Button
          disabled={!local.can("CREATED_SHARE_LINK")}
          onClick={() => local.send("CREATED_SHARE_LINK")}
        >
          {local.data.error ? "Try Again?" : "Create a New Share Link"}
        </Button>
        {/* {local.data.error && <p>{local.data.error}</p>} */}
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
