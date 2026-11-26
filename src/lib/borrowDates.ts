import type { BorrowRequest } from '../types'

const ymd = /^(\d{4})-(\d{2})-(\d{2})$/

function validDate(value: string) {
  if (!ymd.test(value)) return false
  const t = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === value
}

export function checkLoanDates(start: string, end: string) {
  if (!start && !end) return undefined
  if (!start || !end) return 'Enter both dates, or leave both blank.'
  if (!validDate(start) || !validDate(end)) return 'Enter two valid dates.'
  if (end < start) return 'The return date must be on or after pickup.'
}

export function conflictingApproval(target: BorrowRequest, requests: BorrowRequest[]) {
  return requests.find((candidate) => {
    if (candidate.id === target.id || candidate.itemId !== target.itemId || candidate.status !== 'Approved') return false
    const a = target.startDate, b = target.endDate, c = candidate.startDate, d = candidate.endDate
    if (!a || !b || !c || !d || checkLoanDates(a, b) || checkLoanDates(c, d)) return true
    return a <= d && c <= b
  })
}
