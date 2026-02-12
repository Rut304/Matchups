import { redirect } from 'next/navigation'

// Control Panel has been merged into Dashboard
// This redirect ensures old links still work

export default function ControlPanelPage() {
  redirect('/dashboard')
}
