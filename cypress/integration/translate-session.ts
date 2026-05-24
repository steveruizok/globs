import { IData } from "types"
import inputs from "lib/inputs"
import TranslateSession from "lib/sessions/TranslateSession"
import { getSelectionSnapshot } from "lib/utils"

describe("Translate Session.", () => {
  beforeEach(() => {
    inputs.keys = {}
    inputs.modifiers = {}
  })

  it("Translates selected nodes on the x axis.", () => {
    cy.fixture<IData>("project").then((data) => {
      data.selectedNodes = ["a"]
      data.selectedGlobs = []
      const snapshot = getSelectionSnapshot(data)

      TranslateSession.translateXY(data, [50, 25], "x", snapshot)

      expect(data.nodes["a"].point).to.deep.equal([50, 0])
    })
  })

  it("Translates selected glob handles.", () => {
    cy.fixture<IData>("project").then((data) => {
      data.selectedGlobs = ["g"]
      data.selectedNodes = []
      const snapshot = getSelectionSnapshot(data)

      TranslateSession.translateHandleXY(data, [20, 0], "D", "x", snapshot)

      expect(data.globs["g"].D).to.deep.equal([120, 0])
    })
  })

  it("Updates node radius in radius translation mode.", () => {
    cy.fixture<IData>("project").then((data) => {
      data.selectedNodes = ["a"]
      data.selectedGlobs = []
      const snapshot = getSelectionSnapshot(data)

      TranslateSession.translateRadius(data, [10, 0], snapshot)

      expect(data.nodes["a"].radius).to.equal(35)
    })
  })
})
