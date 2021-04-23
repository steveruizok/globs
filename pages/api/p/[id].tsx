import { GetServerSideProps } from "next"

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query

  return {
    props: {
      id: id.toString(),
    },
  }
}
