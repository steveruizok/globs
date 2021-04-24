import * as playwright from "playwright-aws-lambda"

import { NextApiRequest, NextApiResponse } from "next"

export default async function sandbox(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    query: { uuid },
  } = req

  const url = `${process.env.NEXT_PUBLIC_BASE_API_URL}/p/${uuid.toString()}`

  const browser = await playwright.launchChromium()

  const page = await browser.newPage({
    viewport: {
      width: 1200,
      height: 630,
    },
  })

  await page.goto(url, { timeout: 15 * 1000 })

  await page.waitForTimeout(2000)

  const data = await page.screenshot({ type: "jpeg" })

  await browser.close()

  res.setHeader(
    "Cache-Control",
    `s-maxage=${30 * 60 * 1000}, stale-while-revalidate`
  )
  res.setHeader("Content-Type", "image/jpeg")
  res.status(200).end(data)
  return {}
}
