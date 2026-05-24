import { IData } from "types"
import inputs from "lib/inputs"
import RotateSession from "lib/sessions/RotateSession"

describe("Rotate Session.", () => {
  beforeEach(() => {
    inputs.keys = {}
    inputs.modifiers = {}
  })

  it("Rotates selected nodes around the selection center.", () => {
    cy.fixture<IData>("project").then((data) => {
      data.selectedNodes = ["a", "b"]
      const startA = [...data.nodes["a"].point]
      const startB = [...data.nodes["b"].point]

      inputs.pointer.point = [100, -100]
      const session = new RotateSession(data)
      inputs.pointer.point = [200, 100]
      session.update(data)
      session.complete(data)

      expect(data.nodes["a"].point).to.not.deep.equal(startA)
      expect(data.nodes["b"].point).to.not.deep.equal(startB)
    })
  })

  it("Restores the snapshot on cancel.", () => {
    cy.fixture<IData>("project").then((data) => {
      data.selectedNodes = ["a", "b"]
      const startA = [...data.nodes["a"].point]
      const startB = [...data.nodes["b"].point]

      inputs.pointer.point = [100, -100]
      const session = new RotateSession(data)
      inputs.pointer.point = [200, 100]
      session.update(data)
      session.cancel(data)

      expect(data.nodes["a"].point).to.deep.equal(startA)
      expect(data.nodes["b"].point).to.deep.equal(startB)
    })
  })
})
