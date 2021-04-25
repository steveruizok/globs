import Head from "next/head"

export default function Meta({ uuid }: { uuid?: string }) {
  const title = "Globs Designer"
  const DESCRIPTION =
    "Design with globs, a stretchy new design primitive. Tired of the pen tool? Need smarter curves? Want to design from code? Stretching for your og:description optimal word count? Get started with globs."
  const IMAGE = uuid
    ? `https://globs.design/api/p/${uuid}/social-image`
    : "https://globs.design/globs-social.png"
  const URL = "https://globs.design/"

  return (
    <Head>
      <title>{title}</title>
      <meta name="og:title" content={title} />
      <meta name="og:description" content={DESCRIPTION} />
      <meta name="og:image" content={IMAGE} />
      <meta name="og:url" content={URL} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={DESCRIPTION} />
      <meta name="twitter:image" content={IMAGE} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@steveruizok" />
    </Head>
  )
}
