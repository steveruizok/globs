import Head from "next/head"

export default function Meta({ uuid }: { uuid?: string }) {
  const IMAGE = `http://globs.design/api/p/${uuid}/social-image`

  return (
    <Head>
      <meta name="og:image" content={IMAGE} />
      <meta name="twitter:image" content={IMAGE} />
    </Head>
  )
}
