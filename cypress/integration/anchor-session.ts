import { IData } from "types"
import inputs from "lib/inputs"
import AnchorSession from "lib/sessions/AnchorSession"

describe("Anchor Session.", () => {
  beforeEach(() => {
    inputs.keys = {}
    inputs.modifiers = {}
    inputs.pointer.point = [50, 0]
  })

  it("Updates an anchor value along the handle segment.", () => {
    cy.fixture<IData>("project").then((data) => {
      const glob = data.globs["g"]
      const initial = glob.a

      const session = new AnchorSession(data, "g", "a")
      inputs.pointer.point = [80, 0]
      session.update(data)
      session.complete(data)

      expect(glob.a).to.not.equal(initial)
    })
  })

  it("Restores anchor values on cancel.", () => {
    cy.fixture<IData>("project").then((data) => {
      const glob = data.globs["g"]
      const snapshot = { a: glob.a, b: glob.b, ap: glob.ap, bp: glob.bp }

      const session = new AnchorSession(data, "g", "a")
      inputs.pointer.point = [80, 0]
      session.update(data)
      session.cancel(data)

      expect(glob.a).to.equal(snapshot.a)
      expect(glob.b).to.equal(snapshot.b)
      expect(glob.ap).to.equal(snapshot.ap)
      expect(glob.bp).to.equal(snapshot.bp)
    })
  })
})
