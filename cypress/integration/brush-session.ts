import { IData } from "types"
import inputs from "lib/inputs"
import BrushSession from "lib/sessions/BrushSession"

describe("Brush Session.", () => {
  beforeEach(() => {
    inputs.keys = {}
    inputs.modifiers = {}
  })

  it("Selects nodes inside the brush bounds.", () => {
    cy.fixture<IData>("project").then((data) => {
      inputs.pointer.origin = [-100, -100]
      inputs.pointer.point = [-100, -100]
      const session = new BrushSession(data)

      inputs.pointer.point = [400, 100]
      session.update(data)
      session.complete(data)

      expect(data.selectedNodes).to.include("a")
      expect(data.selectedNodes).to.include("b")
      expect(data.selectedGlobs).to.include("g")
      expect(data.brush).to.equal(undefined)
    })
  })

  it("Restores selection on cancel.", () => {
    cy.fixture<IData>("project").then((data) => {
      data.selectedNodes = ["a"]
      data.selectedGlobs = ["g"]

      inputs.pointer.origin = [0, 0]
      inputs.pointer.point = [0, 0]
      const session = new BrushSession(data)

      inputs.pointer.point = [500, 500]
      session.update(data)
      session.cancel(data)

      expect(data.selectedNodes).to.deep.equal(["a"])
      expect(data.selectedGlobs).to.deep.equal(["g"])
      expect(data.brush).to.equal(undefined)
    })
  })
})
