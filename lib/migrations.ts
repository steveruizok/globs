import { IData } from "types"

function removeGlobOptions(data: IData) {
  const { globIds, globs } = data
  for (const globId of globIds) {
    const glob: any = globs[globId]
    if (glob.options !== undefined) {
      Object.assign(glob, glob.options)
      delete glob.options
    }
  }
}

export default function migrate(data: IData) {
  removeGlobOptions(data)
  return data
}
