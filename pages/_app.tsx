import { useEffect } from "react"
import router from "next/router"
import { AppProps } from "next/app"
import * as gtag from "lib/gtag"
import { globalStyles } from "styles/globalStyles"
import "styles/styles.css"
import { init } from "../utils/sentry"
import Head from "next/head"

const TITLE = "Globs Designer"
const DESCRIPTION =
  "Design with globs, a stretchy new design primitive. Tired of the pen tool? Need smarter curves? Want to design from code? Get started with globs."
const URL = "https://globs.design/"

init()

function MyApp({ Component, pageProps }: AppProps) {
  globalStyles()

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return

    function handleRouteChange(url: URL) {
      gtag.pageview(url)
    }

    router.events.on("routeChangeComplete", handleRouteChange)
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange)
    }
  }, [router.events])

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="og:title" content={TITLE} />
        <meta name="og:description" content={DESCRIPTION} />
        <meta name="og:url" content={URL} />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@steveruizok" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
