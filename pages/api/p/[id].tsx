// An endpoint that fetches a shared project from the cloud and restores it to a canvas.
// On first implementation, the project is just a way to distribute your work: changes to
// the file cannot be saved, and local changes will be saved only on the user's device.

// This means that a user will need to have more than one globs project on their device,
// saved locally under a specific ID, and perhaps a way to navigate between them.
// Alternatively, share links could be read-only, with the option to copy the contents
// of the link to your project's canvas, or to a new "page" in your project.

import { GetServerSideProps } from "next"

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query

  // Get project from database
  // Validate that project exists
  // Redirect if the project does not exist
  // Otherwise, return the editor in a "viewing share link" state.

  // const project = await db
  //   .collection("users")
  //   .doc(single(oid))
  //   .collection("projects")
  //   .doc(single(pid))
  //   .get()

  // if (!project.exists) {
  //   context.res.setHeader("Location", `/u/${oid}/p/${pid}/not-found`)
  //   context.res.statusCode = 307
  //   return {
  //     props: { isProject: false },
  //   }
  // }

  // return {
  //   oid: single(oid),
  //   pid: single(pid),
  //   isProject: true,
  // }

  return {
    props: {
      id: id.toString(),
    },
  }
}
