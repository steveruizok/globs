import Head from "next/head"
import dynamic from "next/dynamic"
import useTheme from "hooks/useTheme"
import Loading from "components/loading"

const Editor = dynamic(() => import("components/editor"), {
  ssr: false,
  loading: function WhileLoading() {
    return <Loading />
  },
})

export default function Home() {
  useTheme()

  return <Editor />
}
