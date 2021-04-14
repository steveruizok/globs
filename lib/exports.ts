import { MutableRefObject } from "react"
import { getCommonBounds, getNodeBounds, getGlobBounds } from "lib/utils"
import { IData } from "./types"

class Exports {
  copyToSvg(
    data: IData,
    elements: Record<string, MutableRefObject<SVGElement>>
  ) {
    const {
      globs,
      nodes,
      globIds,
      nodeIds,
      selectedGlobs,
      selectedNodes,
    } = data

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")

    const globbedNodes = new Set<string>([])

    const hasSelected = globIds.length + nodeIds.length > 0

    const globIdsToCopy = hasSelected
      ? selectedGlobs.length
        ? selectedGlobs
        : []
      : globIds

    for (let globId of globIdsToCopy) {
      globbedNodes.add(globs[globId].nodes[0])
      globbedNodes.add(globs[globId].nodes[1])
      try {
        const copy = elements[globId].current.cloneNode(true)
        svg.appendChild(copy)
      } catch (e) {
        console.log("Could not copy id", globId)
      }
    }

    const nodeIdsToCopy = (hasSelected
      ? data.selectedNodes.length
        ? selectedNodes
        : []
      : nodeIds
    ).filter((id) => !globbedNodes.has(id))

    for (let nodeId of nodeIdsToCopy) {
      try {
        const copy = elements[nodeId].current.cloneNode(true)
        svg.appendChild(copy)
      } catch (e) {
        console.log("Could not copy id: " + e)
      }
    }

    const bounds = getCommonBounds(
      ...globIdsToCopy
        .map((id) => globs[id])
        .filter((glob) => glob.points !== null)
        .map((glob) =>
          getGlobBounds(glob, nodes[glob.nodes[0]], nodes[glob.nodes[1]])
        ),
      ...nodeIdsToCopy.map((id) => getNodeBounds(nodes[id]))
    )

    const padding = 16

    // Resize the element to the bounding box
    svg.setAttribute(
      "viewBox",
      [
        bounds.x - padding,
        bounds.y - padding,
        bounds.width + padding * 2,
        bounds.height + padding * 2,
      ].join(" ")
    )
    svg.setAttribute("width", String(bounds.width))
    svg.setAttribute("height", String(bounds.height))

    // Take a snapshot of the element
    const s = new XMLSerializer()
    const svgString = s.serializeToString(svg)

    // Copy to clipboard!
    try {
      navigator.clipboard.writeText(svgString)
    } catch (e) {
      Exports.copyStringToClipboard(svgString)
    }
  }

  static copyStringToClipboard(string: string) {
    let textarea: HTMLTextAreaElement
    let result: any

    try {
      textarea = document.createElement("textarea")
      textarea.setAttribute("position", "fixed")
      textarea.setAttribute("top", "0")
      textarea.setAttribute("readonly", "true")
      textarea.setAttribute("contenteditable", "true")
      textarea.style.position = "fixed" // prevent scroll from jumping to the bottom when focus is set.
      textarea.value = string

      document.body.appendChild(textarea)

      textarea.focus()
      textarea.select()

      const range = document.createRange()
      range.selectNodeContents(textarea)

      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      textarea.setSelectionRange(0, textarea.value.length)
      result = document.execCommand("copy")
    } catch (err) {
      console.error(err)
      result = null
    } finally {
      document.body.removeChild(textarea)
    }

    // manual copy fallback using prompt
    if (!result) {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
      const copyHotkey = isMac ? "⌘C" : "CTRL+C"
      result = prompt(`Press ${copyHotkey}`, string) // eslint-disable-line no-alert
      if (!result) {
        return false
      }
    }
    return true
  }
}

export default new Exports()
