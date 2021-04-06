import { globalStyles } from "styles/globalStyles"
import "styles/styles.css"

function MyApp({ Component, pageProps }) {
  globalStyles()
  return <Component {...pageProps} />
}

export default MyApp
