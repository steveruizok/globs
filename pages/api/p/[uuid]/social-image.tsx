import chromium from "chrome-aws-lambda"
import { NextApiRequest, NextApiResponse } from "next"

// Adapted from https://github.com/samrobbins85/next-og-image

export default async function sandbox(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    query: { uuid },
  } = req

  const url = `${
    process.env.NEXT_PUBLIC_BASE_API_URL
  }/p/${uuid.toString()}/clean`

  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    ignoreHTTPSErrors: true,
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1200, height: 627 })
  await page.goto(url, { timeout: 15 * 1000 })

  await page.waitForTimeout(3000)

  const imageBuffer = await page.screenshot({ type: "jpeg" })

  await browser.close()

  res.setHeader("Content-Type", "image/jpg")

  res.setHeader(
    "Cache-Control",
    `s-maxage=${0 * 60 * 1000}, stale-while-revalidate`
  )

  res.status(200).send(imageBuffer)

  return {}
}
