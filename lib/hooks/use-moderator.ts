"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { TransportRequest, Profile, Vehicle, Dispute } from "@/lib/types/database"

const supabase = createClient()

// Fetch all pending requests for moderators
export function usePendingRequests() {
  return useSWR<(TransportRequest & { client: Profile })[]>("moderator-pending-requests", async () => {
    const { data, error } = await supabase
      .from("transport_requests")
      .select(`
        *,
        client:profiles!transport_requests_client_id_fkey(*)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  })
}

// Fetch all requests for moderators with filters
export function useModeratorRequests(status?: string) {
  return useSWR<(TransportRequest & { client: Profile; transporter: Profile | null; vehicle: Vehicle | null })[]>(
    ["moderator-requests", status],
    async () => {
      let query = supabase
        .from("transport_requests")
        .select(`
          *,
          client:profiles!transport_requests_client_id_fkey(*),
          transporter:profiles!transport_requests_assigned_transporter_id_fkey(*),
          vehicle:vehicles(*)
        `)
        .order("created_at", { ascending: false })

      if (status && status !== "all") {
        query = query.eq("status", status)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
  )
}

// Fetch available transporters
export function useAvailableTransporters() {
  return useSWR<(Profile & { vehicles: Vehicle[] })[]>("available-transporters", async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        vehicles(*)
      `)
      .eq("role", "transporter")
      .eq("is_active", true)
      .eq("is_verified", true)

    if (error) throw error
    return data || []
  })
}

// Fetch all disputes for moderators
export function useModeratorDisputes(status?: string) {
  return useSWR<(Dispute & { opener: Profile; moderator: Profile | null; request: TransportRequest | null })[]>(
    ["moderator-disputes", status],
    async () => {
      let query = supabase
        .from("disputes")
        .select(`
          *,
          opener:profiles!disputes_opened_by_fkey(*),
          moderator:profiles!disputes_assigned_moderator_fkey(*),
          request:transport_requests(*)
        `)
        .order("created_at", { ascending: false })

      if (status && status !== "all") {
        query = query.eq("status", status)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
  )
}

// Fetch moderator statistics
export function useModeratorStats(moderatorId?: string) {
  return useSWR(moderatorId ? ["moderator-stats", moderatorId] : null, async () => {
    // Get requests validated today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: validatedToday } = await supabase
      .from("transport_requests")
      .select("id", { count: "exact" })
      .eq("validated_by", moderatorId)
      .gte("validated_at", today.toISOString())

    // Get total validated
    const { data: totalValidated } = await supabase
      .from("transport_requests")
      .select("id", { count: "exact" })
      .eq("validated_by", moderatorId)

    // Get pending requests count
    const { count: pendingCount } = await supabase
      .from("transport_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")

    // Get in progress count
    const { count: inProgressCount } = await supabase
      .from("transport_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["assigned", "in_progress"])

    // Get open disputes
    const { count: openDisputes } = await supabase
      .from("disputes")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "investigating"])

    // Get disputes assigned to this moderator
    const { count: myDisputes } = await supabase
      .from("disputes")
      .select("id", { count: "exact", head: true })
      .eq("assigned_moderator", moderatorId)
      .in("status", ["open", "investigating"])

    return {
      pending_requests: pendingCount || 0,
      validated_today: validatedToday?.length || 0,
      total_validated: totalValidated?.length || 0,
      in_progress: inProgressCount || 0,
      open_disputes: openDisputes || 0,
      my_disputes: myDisputes || 0,
    }
  })
}

// Validate a request
export async function validateRequest(requestId: string, moderatorId: string, estimatedPrice?: number) {
  const { error } = await supabase
    .from("transport_requests")
    .update({
      status: "validated",
      validated_by: moderatorId,
      validated_at: new Date().toISOString(),
      estimated_price: estimatedPrice,
    })
    .eq("id", requestId)

  if (error) throw error
  return true
}

// Reject a request
export async function rejectRequest(requestId: string, moderatorId: string, reason: string) {
  const { error } = await supabase
    .from("transport_requests")
    .update({
      status: "cancelled",
      cancelled_by: moderatorId,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    })
    .eq("id", requestId)

  if (error) throw error
  return true
}

// Assign transporter to request
export async function assignTransporter(
  requestId: string,
  transporterId: string,
  vehicleId: string,
  moderatorId: string,
  finalPrice: number,
  commission: number,
) {
  const { error } = await supabase
    .from("transport_requests")
    .update({
      status: "assigned",
      assigned_transporter_id: transporterId,
      assigned_vehicle_id: vehicleId,
      assigned_by: moderatorId,
      assigned_at: new Date().toISOString(),
      final_price: finalPrice,
      platform_commission: commission,
      transporter_earnings: finalPrice - commission,
    })
    .eq("id", requestId)

  if (error) throw error
  return true
}

// Take dispute
export async function takeDispute(disputeId: string, moderatorId: string) {
  const { error } = await supabase
    .from("disputes")
    .update({
      assigned_moderator: moderatorId,
      status: "investigating",
    })
    .eq("id", disputeId)

  if (error) throw error
  return true
}

// Resolve dispute
export async function resolveDispute(disputeId: string, resolution: string) {
  const { error } = await supabase
    .from("disputes")
    .update({
      status: "resolved",
      resolution,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", disputeId)

  if (error) throw error
  return true
}

// Send dispute message
export async function sendDisputeMessage(disputeId: string, senderId: string, message: string) {
  const { error } = await supabase.from("dispute_messages").insert({
    dispute_id: disputeId,
    sender_id: senderId,
    message,
  })

  if (error) throw error
  return true
}

// Fetch dispute messages
export function useDisputeMessages(disputeId?: string) {
  return useSWR(disputeId ? ["dispute-messages", disputeId] : null, async () => {
    const { data, error } = await supabase
      .from("dispute_messages")
      .select(`
        *,
        sender:profiles(*)
      `)
      .eq("dispute_id", disputeId)
      .order("created_at", { ascending: true })

    if (error) throw error
    return data || []
  })
}
