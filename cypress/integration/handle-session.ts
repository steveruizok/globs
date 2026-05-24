import { IData } from "types"
import inputs from "lib/inputs"
import HandleSession from "lib/sessions/HandleSession"

describe("Handle Session.", () => {
  beforeEach(() => {
    inputs.keys = {}
    inputs.modifiers = {}
    inputs.pointer.point = [100, 0]
  })

  it("Moves a glob handle.", () => {
    cy.fixture<IData>("project").then((data) => {
      const glob = data.globs["g"]
      expect(glob.D).to.deep.equal([100, 0])

      inputs.keys.Alt = true
      const session = new HandleSession(data, "g", "D")
      inputs.pointer.point = [150, 50]
      session.update(data)
      session.complete(data)

      expect(glob.D).to.deep.equal([150, 50])
      expect(glob.Dp).to.deep.equal([100, 0])
    })
  })

  it("Moves both handles when meta is pressed.", () => {
    cy.fixture<IData>("project").then((data) => {
      const glob = data.globs["g"]
      inputs.keys.Alt = true
      inputs.keys.Meta = true
      const session = new HandleSession(data, "g", "D")
      inputs.pointer.point = [150, 50]
      session.update(data)
      session.complete(data)

      expect(glob.D).to.deep.equal([150, 50])
      expect(glob.Dp).to.deep.equal([150, 50])
    })
  })
})
