import { deleteSharedProject } from "lib/supabase-server"
import { NextApiRequest, NextApiResponse } from "next"

export default async function deleteShareLink(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(400)
    res.send({ response: "You need to post to this endpoint." })
    return
  }

  const url = req.body.url.toString()

  const { error } = await deleteSharedProject(url)

  if (error !== null) {
    res.send({ response: error })
  } else {
    res.send({ response: "Success." })
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
}
