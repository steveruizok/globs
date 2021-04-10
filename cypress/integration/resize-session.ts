import { IData } from "types"
import inputs from "lib/inputs"
import * as vec from "lib/vec"
import ResizeSession from "lib/sessions/ResizeSession"

describe("Resize Session.", () => {
  it("Changes a node's radius.", () => {
    cy.fixture<IData>("project").then((data) => {
      const node = data.nodes["a"]
      data.selectedNodes = ["a"]
      expect(node.point).to.deep.equal([0, 0])
      expect(node.radius).equal(25)

      inputs.pointer.point = [10, 0]
      inputs.keys.Meta = true
      const session = new ResizeSession(data, "a")
      inputs.pointer.point = [20, 0]
      session.update(data)

      session.complete(data)
      expect(node.point).to.deep.equal([0, 0])
      expect(node.radius).to.equal(35)
    })
  })

  it("Changes a node's radius to absolute distance when shift is pressed .", () => {
    cy.fixture<IData>("project").then((data) => {
      const node = data.nodes["a"]
      data.selectedNodes = ["a"]
      expect(node.point).to.deep.equal([0, 0])
      expect(node.radius).equal(25)

      inputs.pointer.point = [10, 0]
      inputs.keys.Shift = true
      const session = new ResizeSession(data, "a")
      inputs.pointer.point = [20, 0]
      session.update(data)

      session.complete(data)
      expect(node.point).to.deep.equal([0, 0])
      expect(node.radius).to.equal(20)
    })
  })

  it("Handles negative zoom correctly.", () => {
    cy.fixture<IData>("project").then((data) => {
      const node = data.nodes["a"]
      data.selectedNodes = ["a"]
      data.camera.zoom = 0.5
      expect(node.point).to.deep.equal([0, 0])
      expect(node.radius).equal(25)

      inputs.pointer.point = [10, 0]
      inputs.keys.Meta = true
      const session = new ResizeSession(data, "a")
      inputs.pointer.point = [20, 0]
      session.update(data)

      session.complete(data)
      expect(node.point).to.deep.equal([0, 0])
      expect(node.radius).to.equal(40)
    })
  })

  it("Handles positive zoom correctly.", () => {
    cy.fixture<IData>("project").then((data) => {
      const node = data.nodes["a"]
      data.selectedNodes = ["a"]
      data.camera.zoom = 2
      expect(node.point).to.deep.equal([0, 0])
      expect(node.radius).equal(25)

      inputs.pointer.point = [10, 0]
      inputs.keys.Meta = true
      const session = new ResizeSession(data, "a")
      inputs.pointer.point = [20, 0]
      session.update(data)

      session.complete(data)
      expect(node.point).to.deep.equal([0, 0])
      expect(node.radius).to.equal(10)
    })
  })
})
