import Head from "next/head"
import dynamic from "next/dynamic"
const Editor = dynamic(() => import("components/editor"), { ssr: false })

export default function Home() {
  return (
    <div>
      <Head>
        <title>Glob Editor</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Editor />
      </main>

      <footer></footer>
    </div>
  )
}
