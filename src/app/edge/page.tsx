import { redirect } from 'next/navigation'

// Redirect /edge to /markets/edge for now
// This ensures backward compatibility with links
export default function EdgeRedirect() {
  redirect('/markets/edge')
}
