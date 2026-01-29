"use client"

import useSWR from "swr"
import { djangoApi } from "@/lib/api/django"

async function fetchNotifications() {
  const res = await djangoApi.getMyNotifications()
  if (res.error) throw new Error(res.error)
  return res.notifications || []
}

async function fetchUnreadCount() {
  const res = await djangoApi.getMyNotifications()
  if (res.error) throw new Error(res.error)
  return (res.notifications || []).filter((n: any) => !n.is_read).length
}

export function useNotifications(userId: string | undefined) {
  return useSWR(userId ? ["notifications", userId] : null, () => fetchNotifications(), {
    refreshInterval: 30000,
  })
}

export function useUnreadCount(userId: string | undefined) {
  return useSWR(userId ? ["unread-count", userId] : null, () => fetchUnreadCount(), {
    refreshInterval: 30000,
  })
}

export async function markAsRead(notificationId: string) {
  // Optionnel: endpoint spécifique pour 1 notification si nécessaire
  console.warn("markAsRead(id) non encore implémenté côté API, utiliser markAllNotificationsRead")
}

export async function markAllAsRead(userId: string) {
  await djangoApi.markAllNotificationsRead()
}
