import { IData } from "types"
import MoveSession from "lib/sessions/MoveSession"

describe("Move Session.", () => {
  it("Moves a node.", () => {
    cy.fixture<IData>("project").then((data) => {
      const moveSession = new MoveSession(data)
      moveSession.update(data)
      expect(true).to.equal(false)
    })
  })
})
