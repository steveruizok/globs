import { IData } from "types"
import inputs from "lib/inputs"
import TransformSession from "lib/sessions/TransformSession"

describe("Transform Session.", () => {
  beforeEach(() => {
    inputs.keys = {}
    inputs.modifiers = {}
    inputs.pointer.point = [200, 0]
  })

  it("Scales selected nodes from a corner handle.", () => {
    cy.fixture<IData>("project").then((data) => {
      data.selectedNodes = ["a", "b"]
      const startA = [...data.nodes["a"].point]
      const startB = [...data.nodes["b"].point]

      const session = new TransformSession(data, "corner", 2)
      inputs.pointer.point = [300, 100]
      session.update(data)
      session.complete(data)

      expect(data.nodes["a"].point).to.not.deep.equal(startA)
      expect(data.nodes["b"].point).to.not.deep.equal(startB)
    })
  })

  it("Restores the selection on cancel.", () => {
    cy.fixture<IData>("project").then((data) => {
      data.selectedNodes = ["a", "b"]
      const startA = [...data.nodes["a"].point]
      const startB = [...data.nodes["b"].point]

      const session = new TransformSession(data, "corner", 2)
      inputs.pointer.point = [300, 100]
      session.update(data)
      session.cancel(data)

      expect(data.nodes["a"].point).to.deep.equal(startA)
      expect(data.nodes["b"].point).to.deep.equal(startB)
    })
  })
})
