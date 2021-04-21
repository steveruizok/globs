import { deleteSharedProject } from "lib/supabase"
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

  const url = req.body.url.toString()

  const result = await deleteSharedProject(url)

  if (result[0]) {
    res.send({ response: "Success." })
  } else {
    res.send({ response: "Failure." })
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
}
