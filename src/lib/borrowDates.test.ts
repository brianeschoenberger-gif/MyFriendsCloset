import { describe, expect, it } from 'vitest'
import { checkLoanDates, conflictingApproval } from './borrowDates'
import type { BorrowRequest } from '../types'

function request(id: number, status: BorrowRequest['status'], startDate = '2026-12-02', endDate = '2026-12-04') {
  return { id, itemId: 13, ownerId: 'owner', requesterId: 'friend', status, startDate, endDate } as BorrowRequest
}

describe('demo scheduling and availability', () => {
  it('accepts flexible or paired valid dates, including a one-day loan', () => {
    expect(checkLoanDates('', '')).toBeUndefined()
    expect(checkLoanDates('2026-12-04', '2026-12-04')).toBeUndefined()
    expect(checkLoanDates('2026-12-04', '')).toMatch(/both/)
    expect(checkLoanDates('2026-02-30', '2026-03-02')).toMatch(/valid/)
    expect(checkLoanDates('2026-12-04', '2026-12-03')).toMatch(/on or after/)
  })
  it('blocks overlapping approvals but ignores requests that are pending, declined or returned', () => {
    const target = request(101, 'Pending', '2026-12-04', '2026-12-10')
    const approved = request(102, 'Approved')
    expect(conflictingApproval(target, [approved])?.id).toBe(102)
    expect(conflictingApproval(target, [request(102, 'Approved', '', '')])?.id).toBe(102)
    for (const status of ['Pending', 'Declined', 'Returned'] as const) expect(conflictingApproval(target, [request(102, status)])).toBeUndefined()
    expect(conflictingApproval(target, [request(102, 'Approved', '2026-12-11', '2026-12-15')])).toBeUndefined()
  })
})
