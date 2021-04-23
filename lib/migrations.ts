/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import exampleCode from "components/ui/code-panel/example-code"
import { ICanvasItems, IData } from "types"

/**
 * Move the properties from "Glob.options" onto the glob object itself.
 * @param data
 */
function migrateToV1(data: IData) {
  const { globIds, globs } = data
  for (const globId of globIds) {
    const glob: any = globs[globId]
    if (glob.options !== undefined) {
      Object.assign(glob, glob.options)
      delete glob.options
    }
  }
}

/**
 * Create the document structure with page, parentIds, groups, and so on.
 * @param data
 */
function migrateToV2(data: Partial<IData>) {
  data.pageId = "0"

  data.pages = {
    0: {
      id: "0",
      name: "Page 1",
      type: ICanvasItems.Page,
      locked: false,
      childIndex: 0,
    },
  }

  data.theme = "dark"

  data.code = {
    0: {
      id: "0",
      childIndex: 0,
      name: "My Code",
      code: exampleCode,
    },
  }
  data.groups = {}

  const { globIds, globs, nodeIds, nodes } = data

  let i = 0

  for (const nodeId of nodeIds) {
    const node = nodes[nodeId]
    node.type = ICanvasItems.Node
    node.parentId = "0"
    node.childIndex = i
    // @ts-ignore
    delete node.zIndex
    i++
  }

  for (const globId of globIds) {
    const glob = globs[globId]
    glob.type = ICanvasItems.Glob
    glob.parentId = "0"
    glob.childIndex = i
    // @ts-ignore
    delete glob.zIndex
    i++
  }

  // Get saved items from local storage and attempt to restore

  let saved: string

  saved = localStorage.getItem("globs_editor_theme")

  if (saved !== null) {
    try {
      const json = JSON.parse(saved)
      data.theme = json.theme as IData["theme"]
    } catch (e) {
      console.warn("Could not parse saved theme.")
    }
    localStorage.removeItem("globs_editor_theme")
  }

  // Get code from local storage

  saved = localStorage.getItem("__globs_code")

  if (saved !== null) {
    try {
      const json = JSON.parse(saved)
      data.code["0"].code = json.code
      data.codePanel.fontSize = json.style.fontSize
    } catch (e) {
      console.warn("Could not parse code.")
    }
    localStorage.removeItem("__globs_code")
  }
}

function supportShareUrls(data: IData) {
  // @ts-ignore
  data.shareUrls = [data.shareUrl]
  // @ts-ignore
  delete data.shareUrl
}

export default function migrate(data: IData) {
  if (!("version" in data) || Number(data.version) < 1) {
    if (data.globIds.length > 0 && "options" in data.globs[data.globIds[0]]) {
      migrateToV1(data)
    }

    if (!("pageId" in data)) {
      migrateToV2(data)
    }

    if ("shareUrl" in data) {
      supportShareUrls(data)
    }
  }

  return data
}
