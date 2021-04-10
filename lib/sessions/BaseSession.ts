import { IData } from "lib/types"

export default class BaseSession {
  constructor(data: IData) {}

  update = (data: IData) => {
    // Update the state
  }

  cancel = (data: IData) => {
    // Clean up the change
  }

  complete = (data: IData) => {
    // Create a command
  }
}
