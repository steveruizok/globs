import { IData } from "lib/types"

export default class BaseSession {
  constructor(data: IData) {
    void data
  }

  update = (data: IData) => {
    void data
    // Update the state
  }

  cancel = (data: IData) => {
    void data
    // Clean up the change
  }

  complete = (data: IData) => {
    void data
    // Create a command
  }
}
