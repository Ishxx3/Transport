"use client"

import useSWR from "swr"
import { djangoApi } from "@/lib/api/django"

// Fetch all requests for moderators with filters
export function useModeratorRequests(status?: string) {
  return useSWR(
    ["moderator-requests", status],
    async () => {
      const res = await djangoApi.getAdminRequests()
      if (res.error) throw new Error(res.error)
      const all = res.requests || []
      if (!status || status === "all") return all
      return all.filter((r: any) => (r.status || "").toUpperCase() === status.toUpperCase())
    },
  )
}

// Fetch available transporters
export function useAvailableTransporters() {
  return useSWR("available-transporters", async () => {
    // Note: This endpoint should be added to djangoApi if not exists
    // For now we use the users endpoint filtered by role
    const res = await djangoApi.getAdminUsers('TRANSPORTEUR')
    if (res.error) throw new Error(res.error)
    return res.users || []
  })
}

// Validate a request
export async function validateRequest(requestSlug: string, moderatorId: string, estimatedPrice?: number) {
  const res = await djangoApi.adminUpdateRequestStatus(requestSlug, 'VALIDATED')
  if (res.error) throw new Error(res.error)
  return true
}

// Reject a request
export async function rejectRequest(requestSlug: string, moderatorId: string, reason: string) {
  const res = await djangoApi.adminUpdateRequestStatus(requestSlug, 'CANCELLED', reason)
  if (res.error) throw new Error(res.error)
  return true
}

// Assign transporter to request
export async function assignTransporter(
  requestSlug: string,
  transporterSlug: string,
  vehicleSlug: string,
  moderatorId: string,
  finalPrice: number,
  commission: number,
) {
  const res = await djangoApi.adminAssignTransporter(requestSlug, transporterSlug)
  if (res.error) throw new Error(res.error)
  return true
}

