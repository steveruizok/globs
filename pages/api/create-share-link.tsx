import { createSharedProject } from "lib/supabase-server"
import { NextApiRequest, NextApiResponse } from "next"

export default async function createShareLink(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(400)
    res.send({ response: "You need to post to this endpoint." })
    return
  }

  const name = req.body.name.toString()
  const document = req.body.document.toString()

  const { data, error } = await createSharedProject(name, document)

  if (error !== null) {
    res.send({ response: error })
  } else {
    res.send({ response: "Success.", url: data[0].uuid })
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
}
