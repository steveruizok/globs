import chromium from "@sparticuz/chromium"
import { NextApiRequest, NextApiResponse } from "next"
import puppeteer from "puppeteer-core"

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

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1200, height: 627 },
    executablePath: await chromium.executablePath(),
    acceptInsecureCerts: true,
    headless: true,
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 627 })
    await page.goto(url, { timeout: 15 * 1000 })

    await page.waitForSelector("#canvas")

    const imageBuffer = await page.screenshot({ type: "jpeg" })

    res.setHeader("Content-Type", "image/jpg")

    res.setHeader(
      "Cache-Control",
      `s-maxage=${30 * 60 * 1000}, stale-while-revalidate`
    )

    res.status(200).send(imageBuffer)
  } finally {
    await browser.close()
  }

  return {}
}
