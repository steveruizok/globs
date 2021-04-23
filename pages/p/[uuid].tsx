import Head from "next/head"
import dynamic from "next/dynamic"
import useTheme from "hooks/useTheme"
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next"
import { IProject } from "lib/types"
import { fetchSharedProjectByUuid } from "lib/supabase"

const Editor = dynamic(() => import("components/editor"), { ssr: false })

interface PageProps {
  project?: IProject
}

export default function ProjectPage({ project }: PageProps) {
  useTheme()

  return (
    <div>
      <Head>
        <title>Glob Editor</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Editor isShareLink={true} project={project} />
      </main>
    </div>
  )
}

export async function getServerSideProps(
  context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<PageProps>> {
  const { uuid } = context.query

  const { data, error } = await fetchSharedProjectByUuid(uuid.toString())

  if ((data && data[0] === undefined) || error !== null) {
    context.res.setHeader("Location", `/`)
    context.res.statusCode = 307
    return {
      props: {},
    }
  }

  return {
    props: {
      project: data[0],
    },
  }
}
