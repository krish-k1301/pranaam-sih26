import { Link } from 'react-router-dom'
import { TopBar } from '../components/TopBar'

export default function NotFound() {
  return (
    <>
      <TopBar title="Page not found" />
      <main id="main" className="px-4 py-10 md:px-6">
        <div className="max-w-[560px] rounded-lg bg-surface p-6 border border-line">
          <p className="text-[16px] font-medium">There is no page at this address.</p>
          <p className="mt-1 text-muted">The application may have been withdrawn, or the link was typed incorrectly.</p>
          <Link to="/" className="mt-4 inline-flex h-9 items-center rounded-md bg-action px-4 font-medium text-white hover:bg-action-dark">
            Back to the queue
          </Link>
        </div>
      </main>
    </>
  )
}
