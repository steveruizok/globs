import { updateSharedProject } from "lib/supabase-server"
import { NextApiRequest, NextApiResponse } from "next"

export default async function updateShareLink(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(400)
    res.send({ response: "You need to post to this endpoint." })
    return
  }
  const id = req.body.id.toString()
  const name = req.body.name.toString()
  const document = req.body.document.toString()

  const { error } = await updateSharedProject(id, name, document)

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
