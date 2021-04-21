import { createSharedProject } from "lib/supabase"
import { NextApiRequest, NextApiResponse } from "next"

export default async function sandbox(
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

  const result = await createSharedProject(name, document)

  if (result[0]) {
    res.send({ response: "Success.", url: result[0].uuid })
  } else {
    res.send({ response: "Failure." })
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
}
