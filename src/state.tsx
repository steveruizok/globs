import { createState, createSelectorHook } from "@state-designer/react"

const initialData = {
  selectedIds: [0],
  ids: [0],
  resets: 0,
  fill: false
}

export const state = createState({
  data: initialData,
  on: {
    LOADED: "loadData",
    CREATED_GLOB: "createId",
    DELETED_GLOB: "deleteSelectedIds",
    SELECTED_GLOB: ["setSelectedId", "moveToFront"],
    DESELECTED: "clearSelectedId",
    RESET: { if: "hasShift", do: "resetData", else: "reset" },
    TOGGLED_FILL: "toggleFill"
  },
  conditions: {
    hasShift(d, p) {
      return !!p.shift
    }
  },
  actions: {
    loadData(d, p) {
      Object.assign(d, p)
    },
    resetData(d) {
      Object.assign(d, initialData)
    },
    toggleFill(d) {
      d.fill = !d.fill
    },
    reset(d) {
      d.resets++
    },
    createId(d) {
      d.ids.push(Date.now())
    },
    deleteSelectedIds(d) {
      d.ids = d.ids.filter((id) => !d.selectedIds.includes(id))
    },
    setSelectedId(d, p) {
      d.selectedIds = [p]
    },
    addSelectedId(d, p) {
      d.selectedIds.push(p)
    },
    clearSelectedId(d) {
      d.selectedIds = []
    },
    moveToFront(d, p) {
      d.ids = d.ids.filter((id) => id !== p)
      d.ids.push(p)
    }
  }
})

export const useSelector = createSelectorHook(state)

// Load local data
const data = localStorage.getItem(`glob_al_data`)

if (data !== null) {
  state.send("LOADED", JSON.parse(data))
}

state.onUpdate((d) => {
  localStorage.setItem(`glob_al_data`, JSON.stringify(d.data))
})
