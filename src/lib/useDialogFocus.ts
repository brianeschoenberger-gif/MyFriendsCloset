import { useEffect, useRef } from 'react'

const controls = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

function available(dialog: HTMLElement) {
  return Array.from(dialog.querySelectorAll<HTMLElement>(controls)).filter((element) =>
    !element.matches(':disabled, [hidden], [aria-hidden="true"]') &&
    !element.closest('[hidden], [inert], [aria-hidden="true"]') &&
    !!element.getClientRects().length)
}

export function useDialogFocus<T extends HTMLElement>(close: () => void, blocked = false) {
  const dialogRef = useRef<T>(null)
  const action = useRef({ close, blocked })
  const openerRef = useRef<HTMLElement | null>(null)

  useEffect(() => { action.current = { close, blocked } }, [close, blocked])
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const active = document.activeElement
    // Strict Mode can replay the effect after focus already moved inside.
    if (active instanceof HTMLElement && !dialog.contains(active)) openerRef.current = active
    const initial = dialog.querySelector<HTMLElement>('[data-dialog-initial]:not(:disabled)')
    const initialFocus = initial ?? available(dialog)[0] ?? dialog
    initialFocus.focus({ preventScroll: true })

    function keydown(event: KeyboardEvent) {
      if (!dialog || Array.from(document.querySelectorAll('[data-closet-dialog]')).at(-1) !== dialog) return
      if (event.key === 'Escape') {
        event.preventDefault()
        if (!action.current.blocked) action.current.close()
        return
      }
      if (event.key !== 'Tab') return
      const options = available(dialog)
      const first = options[0]
      const last = options.at(-1)
      const focused = document.activeElement
      const outside = focused === dialog || !dialog.contains(focused)
      if (!first || !last) {
        event.preventDefault()
        dialog.focus({ preventScroll: true })
      } else if (event.shiftKey && (focused === first || outside)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (focused === last || outside)) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', keydown)
    return () => {
      document.removeEventListener('keydown', keydown)
      const opener = openerRef.current
      if (opener) window.requestAnimationFrame(() => {
        // Do not steal focus from a handling dialog opened in the same interaction.
        if (!document.querySelector('[data-closet-dialog]') && opener.isConnected) opener.focus({ preventScroll: true })
      })
    }
  }, [])
  return dialogRef
}
