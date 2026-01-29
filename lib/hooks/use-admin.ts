"use client"

import useSWR from "swr"
import { djangoApi } from "@/lib/api/django"
import type { Profile, TransportRequest, WalletTransaction, Dispute, Wallet } from "@/lib/types/database"

// Fetch admin KPIs
export function useAdminKPIs() {
  return useSWR("admin-kpis", async () => {
    const response = await djangoApi.getAdminKPIs()
    if (response.error) throw new Error(response.error)
    return response
  })
}

// Fetch all users for admin
export function useAdminUsers(role?: string) {
  return useSWR<(Profile & { wallet?: Wallet })[]>(["admin-users", role], async () => {
    const res = await djangoApi.getAdminUsers(role)
    if (res.error) throw new Error(res.error)
    return res.users || []
  })
}

// Fetch recent transactions for admin
export function useAdminTransactions(limit = 10) {
  return useSWR<(WalletTransaction & { wallet: Wallet & { user: Profile } })[]>(
    ["admin-transactions", limit],
    async () => {
      // Pour l'instant, pas de transactions détaillées côté Django → on retourne un tableau vide
      return []
    },
  )
}

// Fetch recent requests for admin
export function useAdminRequests(limit = 10) {
  return useSWR<(TransportRequest & { client: Profile; transporter: Profile | null })[]>(
    ["admin-requests", limit],
    async () => {
      const res = await djangoApi.getAdminRequests({ limit })
      if (res.error) throw new Error(res.error)
      return (res.requests as any) || []
    },
  )
}

// Fetch all disputes for admin
export function useAdminDisputes() {
  return useSWR<(Dispute & { opener: Profile; moderator: Profile | null })[]>("admin-disputes", async () => {
    // Pas encore de gestion de litiges côté Django → renvoie une liste vide
    return []
  })
}

// Suspend user
export async function suspendUser(userId: string) {
  await djangoApi.suspendUser(userId)
  return true
}

// Activate user
export async function activateUser(userId: string) {
  await djangoApi.activateUser(userId)
  return true
}

// Verify transporter
export async function verifyTransporter(userId: string) {
  await djangoApi.approveTransporter(userId)
  return true
}

// Update user role
export async function updateUserRole(userId: string, role: string) {
  await djangoApi.updateUserRole(userId, role)
  return true
}

// Get chart data for admin
export function useAdminChartData() {
  return useSWR("admin-chart-data", async () => {
    // Utilise déjà getAdminKPIs côté Django pour les KPIs principaux.
    // Pour les graphiques, on simplifie en réutilisant ces chiffres.
    const kpis = await djangoApi.getAdminKPIs()
    if (kpis.error) throw new Error(kpis.error)

    const areaData = [
      {
        name: "Global",
        demandes: kpis.total_requests || 0,
        livraisons: kpis.completed_requests || 0,
        revenue: kpis.total_revenue || 0,
      },
    ]

    const pieData = [
      { name: "En attente", value: kpis.pending_requests || 0, color: "#f59e0b" },
      { name: "En cours", value: kpis.in_progress_requests || 0, color: "#3b82f6" },
      { name: "Terminées", value: kpis.completed_requests || 0, color: "#10b981" },
    ]

    return { areaData, pieData }
  })
}
