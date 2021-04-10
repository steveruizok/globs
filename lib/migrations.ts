function removeGlobOptions(data: any) {
  const { globIds, globs } = data
  for (let globId of globIds) {
    const glob = globs[globId]
    if (glob.options !== undefined) {
      Object.assign(glob, glob.options)
      delete glob.options
    }
  }
}

export default function migrate(data: any) {
  removeGlobOptions(data)
  return data
}
