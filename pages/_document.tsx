import Document, {
  DocumentContext,
  Html,
  Head,
  Main,
  NextScript,
} from "next/document"
import { dark } from "stitches.config"

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html>
        <Head>
          <title>Glob Editor</title>
        </Head>
        <body className={dark}>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
