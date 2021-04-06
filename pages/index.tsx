import Head from "next/head"
import dynamic from "next/dynamic"
import useTheme from "hooks/useTheme"

const Editor = dynamic(() => import("components/editor"), { ssr: false })

export default function Home() {
  useTheme()

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
