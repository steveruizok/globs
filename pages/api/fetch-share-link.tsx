import { fetchSharedProjectById } from "lib/supabase-server"
import { NextApiRequest, NextApiResponse } from "next"

export default async function fetchShareLink(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(400)
    res.send({ response: "You need to post to this endpoint." })
    return
  }

  const id = req.body.id.toString()

  const { data, error } = await fetchSharedProjectById(id)

  if (error !== null) {
    res.send({ response: "Failure." })
  } else {
    res.send({ response: "Success.", url: data[0].uuid })
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
}
