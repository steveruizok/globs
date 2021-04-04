import Head from "next/head"
import dynamic from "next/dynamic"
const Canvas = dynamic(() => import("components/canvas/canvas"), { ssr: false })

export default function Home() {
  return (
    <div>
      <Head>
        <title>Glob Editor</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Canvas />
      </main>

      <footer></footer>
    </div>
  )
}
