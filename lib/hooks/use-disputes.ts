"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { Dispute } from "@/lib/types/database"

const supabase = createClient()

async function fetchDisputes(status?: string) {
  let query = supabase.from("disputes").select(
    `
      *,
      request:transport_requests(*),
      complainant:profiles!disputes_complainant_id_fkey(id, first_name, last_name, role),
      defendant:profiles!disputes_defendant_id_fkey(id, first_name, last_name, role),
      resolver:profiles!disputes_resolved_by_fkey(id, first_name, last_name)
    `,
  )

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export function useDisputes(status?: string) {
  return useSWR(["disputes", status], () => fetchDisputes(status), {
    refreshInterval: 30000,
  })
}

export async function createDispute(data: Partial<Dispute>) {
  const { data: dispute, error } = await supabase.from("disputes").insert(data).select().single()

  if (error) throw error
  return dispute
}

export async function resolveDispute(id: string, resolution: string, resolverId: string) {
  const { data, error } = await supabase
    .from("disputes")
    .update({
      status: "resolved",
      resolution,
      resolved_by: resolverId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}
