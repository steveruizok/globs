import Head from "next/head"
import dynamic from "next/dynamic"
import useTheme from "hooks/useTheme"
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next"
import { IProject } from "lib/types"
import { fetchSharedProjectByUuid } from "lib/supabase"
import Loading from "components/loading"
const Editor = dynamic(() => import("components/editor"), {
  ssr: false,
  loading: function WhileLoading() {
    return <Loading />
  },
})

interface PageProps {
  uuid?: string
  project?: IProject
}

export default function ProjectPage({ uuid, project }: PageProps) {
  useTheme()

  return (
    <div>
      <Head>
        <title>Glob Editor</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Editor isShareLink={true} uuid={uuid} project={project} />
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
      uuid: uuid.toString(),
      project: data[0],
    },
  }
}
