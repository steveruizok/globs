import Document, {
  DocumentContext,
  Html,
  Head,
  Main,
  NextScript,
} from "next/document"
import { dark } from "stitches.config"
import { GA_TRACKING_ID } from "lib/gtag"

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html>
        <Head>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_TRACKING_ID}', {
                page_path: window.location.pathname,
              });
          `,
            }}
          />
          <link rel="manifest" href="/manifest.json" />
          <link rel="icon" href="/icon.png" />
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
