import { useState } from 'react'
import { Download } from 'lucide-react'
import { makeLookCard } from '../lib/lookCard'
import type { ClosetItem } from '../types'

export function LookCardDownload({ items }: { items: ClosetItem[] }) {
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function download() {
    setBusy(true)
    setNotice('')
    setError('')
    try {
      const uri = URL.createObjectURL(await makeLookCard(items))
      const link = document.createElement('a')
      link.href = uri
      link.download = 'my-friends-closet-outfit.png'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(uri), 30_000)
      setNotice('Download started. Check your browser’s downloads.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Couldn’t make a card in this browser.')
    } finally {
      setBusy(false)
    }
  }

  return <details className="look-card-download">
    <summary>Ask a friend</summary>
    <p>Make a card with these clothing photos and names. It saves to your device and doesn’t send anything. Share it only if you’re comfortable with someone keeping the image.</p>
    <button type="button" className="secondary-button" onClick={download} disabled={busy}><Download size={16} /> {busy ? 'Making outfit card…' : 'Download outfit card'}</button>
    {notice && <p role="status">{notice}</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
  </details>
}
