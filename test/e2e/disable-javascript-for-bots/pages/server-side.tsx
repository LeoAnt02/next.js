import { GetServerSideProps } from 'next'

interface Props {
  timestamp: string
}

export default function ServerSidePage({ timestamp }: Props) {
  return (
    <div>
      <h1>Server Side Rendered Page</h1>
      <p id="timestamp">Generated at: {timestamp}</p>
      <script
        dangerouslySetInnerHTML={{
          __html: `console.log('SSR page script executed');`,
        }}
      />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      timestamp: new Date().toISOString(),
    },
  }
}
