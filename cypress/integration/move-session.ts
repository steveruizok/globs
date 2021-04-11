import { IData } from "types"
import inputs from "lib/sinputs"
import MoveSession from "lib/sessions/MoveSession"

describe("Move Session.", () => {
  it("Moves a node.", () => {
    cy.fixture<IData>("project").then((data) => {
      data.selectedNodes = ["a"]
      inputs.pointer.point = [0, 0]
      data.camera.zoom = 1
      const session = new MoveSession(data)
      inputs.pointer.point = [200, 200]
      session.update(data)
      session.complete(data)
      expect(data.nodes["a"].point).to.deep.eq([200, 200])
    })
  })

  it("Handles positive zoom correctly.", () => {
    cy.fixture<IData>("project").then((data) => {
      data.selectedNodes = ["a"]
      inputs.pointer.point = [0, 0]
      data.camera.zoom = 2
      const session = new MoveSession(data)
      inputs.pointer.point = [200, 200]
      session.update(data)
      session.complete(data)
      expect(data.nodes["a"].point).to.deep.eq([100, 100])
    })
  })

  it("Handles negative zoom correctly.", () => {
    cy.fixture<IData>("project").then((data) => {
      data.selectedNodes = ["a"]
      inputs.pointer.point = [0, 0]
      data.camera.zoom = 0.5
      const session = new MoveSession(data)
      inputs.pointer.point = [200, 200]
      session.update(data)
      session.complete(data)
      expect(data.nodes["a"].point).to.deep.eq([400, 400])
    })
  })

  it("Moves selected nodes without moving an unselected glob's handles.", () => {
    cy.fixture<IData>("project").then((data) => {
      data.selectedNodes = ["a", "b"]
      inputs.pointer.point = [0, 0]
      const session = new MoveSession(data)
      inputs.pointer.point = [200, 200]
      session.update(data)
      session.complete(data)
      expect(data.globs["g"].D).to.deep.eq([100, 0])
      expect(data.globs["g"].Dp).to.deep.eq([100, 0])
    })
  })

  it("Moves a selected glob's nodes and handles when it moves the glob.", () => {
    cy.fixture<IData>("project").then((data) => {
      data.selectedGlobs = ["g"]
      inputs.pointer.point = [0, 0]
      const session = new MoveSession(data)
      inputs.pointer.point = [200, 200]
      data.camera.zoom = 1
      session.update(data)
      session.complete(data)
      expect(data.nodes["a"].point).to.deep.eq([200, 200])
      expect(data.nodes["b"].point).to.deep.eq([400, 200])
      expect(data.globs["g"].D).to.deep.eq([300, 200])
      expect(data.globs["g"].Dp).to.deep.eq([300, 200])
    })
  })
})
