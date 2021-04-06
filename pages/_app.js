import { globalStyles } from "styles/globalStyles"
import "styles/styles.css"

function MyApp({ Component, pageProps }) {
  globalStyles()
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
