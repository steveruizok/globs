import { globalStyles } from "styles/globalStyles"
import { useEffect } from "react"
import router from "next/router"
import * as gtag from "lib/gtag"
import Head from "next/head"
import "styles/styles.css"

function MyApp({ Component, pageProps }) {
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
        <title>Glob Editor</title>
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
