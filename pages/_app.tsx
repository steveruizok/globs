import { useEffect } from "react"
import router from "next/router"
import { AppProps } from "next/app"
import * as gtag from "lib/gtag"
import Meta from "components/meta"
import { globalStyles } from "styles/globalStyles"
import "styles/styles.css"
import { init } from "../utils/sentry"

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
      <Meta />
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
